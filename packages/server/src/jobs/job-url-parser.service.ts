import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { LlmService } from '../llm/llm.service';
import { PrismaService } from '../prisma/prisma.service';

export interface ParsedJob {
  url: string;
  source: 'json-ld' | 'opengraph' | 'llm' | 'partial';
  title: string;
  company: string;
  position: string;
  location: string;
  employmentType: string; // 정규직 / 계약직 / 인턴 등
  experienceLevel: string; // 신입 / 경력 N년 / 무관
  salary: string;
  skills: string[];
  description: string;
  rawText: string; // LLM 분석 등 후속 작업용 (5000자 capped)
}

const TIMEOUT_MS = 7000;
const MAX_HTML_BYTES = 1_500_000; // 1.5MB safety
const MAX_TEXT_LEN = 8000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24시간
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);
const PRIVATE_HOST_RE = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/;
// IPv6 로컬/사설 (브래킷 제거된 hostname 기준): loopback, unspecified, ULA(fc/fd), link-local(fe80),
// multicast(ff), IPv4-mapped 사설/loopback.
const PRIVATE_IPV6_RE =
  /^(::1|::|fc[0-9a-f]{2}:|fd[0-9a-f]{2}:|fe80:|ff[0-9a-f]{2}:|::ffff:(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.))/i;
const MAX_REDIRECTS = 5;

/** IP 리터럴(IPv4/IPv6)이 로컬/사설/예약 범위인지. SSRF 차단용. */
function isPrivateIp(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) {
    // RFC1918 + loopback + link-local + 0.0.0.0/8 + CGNAT(100.64/10)
    return (
      PRIVATE_HOST_RE.test(ip) ||
      /^0\./.test(ip) ||
      /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(ip)
    );
  }
  if (v === 6) return PRIVATE_IPV6_RE.test(ip);
  return false;
}

/**
 * 채용공고 URL → 구조화된 ParsedJob 변환.
 *
 * 전략 (싸고 빠른 순서):
 * 1. JSON-LD JobPosting schema 파싱 (Google for Jobs 지원 사이트 — 가장 정확)
 * 2. OpenGraph + meta description 폴백 (제목/회사 일부 추출)
 * 3. LLM 추출 (마지막 보루 — 본문 텍스트 → 구조화)
 *
 * Korean 사이트 우선 지원: 원티드 / 잡코리아 / 사람인 / 프로그래머스 / 점핏 / 로켓펀치 등
 * 일부는 client-side rendering 이라 SSR HTML 만으로는 본문 누락될 수 있음 — 그 경우 LLM 도
 * og:description 등 부분 정보로 best-effort.
 */
@Injectable()
export class JobUrlParserService {
  private readonly logger = new Logger(JobUrlParserService.name);

  constructor(
    private llm: LlmService,
    private prisma: PrismaService,
  ) {}

  async parse(url: string): Promise<ParsedJob> {
    await this.assertPublicUrl(url);

    // 0차: 24시간 캐시 hit 시 즉시 반환 (외부 fetch + LLM 비용 절감)
    const cached = await this.readCache(url);
    if (cached) {
      this.logger.log(`cache hit: ${url}`);
      return cached;
    }

    const html = await this.fetchHtml(url);
    const text = this.htmlToText(html);

    let result: ParsedJob;
    // 1차: JSON-LD JobPosting
    const jsonLd = this.extractJsonLdJobPosting(html);
    if (jsonLd) {
      this.logger.log(`parsed via JSON-LD: ${url}`);
      result = this.fromJsonLd(jsonLd, url, text);
    } else {
      // 2차: OpenGraph + meta
      const og = this.extractOpenGraph(html);

      // 3차: LLM 추출 (og 정보 + 본문 텍스트로 enrich)
      try {
        const llmResult = await this.extractWithLlm(text, og, url);
        this.logger.log(`parsed via LLM: ${url}`);
        result = { ...llmResult, url, source: 'llm', rawText: text.slice(0, MAX_TEXT_LEN) };
      } catch (err) {
        this.logger.warn(`LLM 파싱 실패 → og 정보만 반환: ${(err as Error).message}`);
        // LLM 실패 시 partial 결과 반환 — 캐시는 하지 않음 (다음에 LLM 정상화 시 재시도)
        return {
          url,
          source: 'partial',
          title: og.title || '',
          company: og.siteName || '',
          position: og.title || '',
          location: '',
          employmentType: '',
          experienceLevel: '',
          salary: '',
          skills: [],
          description: og.description || '',
          rawText: text.slice(0, MAX_TEXT_LEN),
        };
      }
    }

    // 성공 시 캐시 저장 (실패는 silent)
    this.writeCache(url, result).catch((err) =>
      this.logger.warn(`cache write 실패: ${err?.message || err}`),
    );
    return result;
  }

  /** 캐시 read — 24시간 이내 entry 만 유효. 만료/누락은 null. */
  private async readCache(url: string): Promise<ParsedJob | null> {
    try {
      const row = await this.prisma.jobUrlCache.findUnique({ where: { url } });
      if (!row) return null;
      if (Date.now() - row.createdAt.getTime() > CACHE_TTL_MS) return null;
      return JSON.parse(row.data) as ParsedJob;
    } catch {
      return null;
    }
  }

  /** 캐시 write — upsert (기존 entry 가 있으면 갱신). */
  private async writeCache(url: string, data: ParsedJob): Promise<void> {
    const json = JSON.stringify(data);
    await this.prisma.jobUrlCache.upsert({
      where: { url },
      create: { url, data: json },
      update: { data: json, createdAt: new Date() },
    });
  }

  /** protocol + host 검증. 호스트는 DNS 해석 후 모든 IP 를 사설/로컬 범위 대조(SSRF 방지). */
  private async assertPublicUrl(url: string) {
    let u: URL;
    try {
      u = new URL(url);
    } catch {
      throw new BadRequestException('유효한 URL 이 아닙니다');
    }
    if (!ALLOWED_PROTOCOLS.has(u.protocol)) {
      throw new BadRequestException('http/https URL 만 지원합니다');
    }
    await this.assertPublicHost(u.hostname);
  }

  private async assertPublicHost(hostname: string) {
    const host = hostname.replace(/^\[|\]$/g, ''); // IPv6 브래킷 제거
    const blocked = () => new BadRequestException('로컬/사설 IP 는 차단됩니다 (SSRF 방지)');

    if (/^localhost$/i.test(host)) throw blocked();
    // IP 리터럴 (점표기 IPv4 / IPv6)
    if (isIP(host)) {
      if (isPrivateIp(host)) throw blocked();
      return;
    }
    // 이름 기반 사설 차단
    if (PRIVATE_HOST_RE.test(host) || PRIVATE_IPV6_RE.test(host)) throw blocked();
    // 난독화 숫자 IP (10진 정수·8진 leading-zero·16진 0x) → 보수적 차단.
    // 정상 도메인은 글자를 포함하고, 정상 점표기 IPv4 는 위 isIP 에서 이미 처리됨.
    if (/^[0-9.]+$/.test(host) || /0x/i.test(host)) throw blocked();
    // 호스트명 → DNS 해석(best-effort): 사설 IP 로 해석되면 차단. 해석 실패는 통과
    // (네트워크 없는 CI/오프라인에서도 동작 — 어차피 fetch 도 불가).
    let addrs: { address: string }[] | null = null;
    try {
      addrs = await lookup(host, { all: true });
    } catch {
      // 해석 실패 → addrs 는 null 유지 (best-effort, 오프라인/NXDOMAIN 도 통과)
    }
    if (addrs && addrs.some((a) => isPrivateIp(a.address))) throw blocked();
  }

  private async fetchHtml(url: string): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const headers = {
        // 봇 차단 우회용 일반 데스크톱 UA
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      };
      // 리다이렉트를 수동 추적하며 매 대상을 재검증 (DNS rebinding / redirect→내부망 SSRF 차단)
      let currentUrl = url;
      let res = await fetch(currentUrl, { signal: controller.signal, headers, redirect: 'manual' });
      for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
        if (![301, 302, 303, 307, 308].includes(res.status)) break;
        const loc = res.headers.get('location');
        if (!loc) break;
        currentUrl = new URL(loc, currentUrl).toString();
        await this.assertPublicUrl(currentUrl);
        res = await fetch(currentUrl, { signal: controller.signal, headers, redirect: 'manual' });
      }
      if (!res.ok) {
        throw new BadRequestException(`채용공고 페이지를 가져오지 못했습니다 (HTTP ${res.status})`);
      }
      const reader = res.body?.getReader();
      if (!reader) return await res.text();
      const chunks: Uint8Array[] = [];
      let total = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          total += value.length;
          if (total > MAX_HTML_BYTES) {
            controller.abort();
            break;
          }
        }
      }
      const merged = new Uint8Array(total);
      let offset = 0;
      for (const c of chunks) {
        merged.set(c, offset);
        offset += c.length;
      }
      return new TextDecoder('utf-8', { fatal: false }).decode(merged);
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        throw new BadRequestException(
          `채용공고 페이지 응답이 너무 느립니다 (${TIMEOUT_MS}ms 초과)`,
        );
      }
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(
        `채용공고 페이지를 불러오지 못했습니다: ${err?.message || err}`,
      );
    } finally {
      clearTimeout(timer);
    }
  }

  /** 매우 간단한 HTML → 텍스트 변환 (jsdom 등 무거운 의존 없이). 본문만 대략 추출. */
  private htmlToText(html: string): string {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#?\w+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** JSON-LD JobPosting 객체 (있으면). */
  private extractJsonLdJobPosting(html: string): any | null {
    const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) {
      try {
        const raw = m[1].trim();
        const parsed = JSON.parse(raw);
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        for (const obj of arr) {
          if (this.isJobPosting(obj)) return obj;
          // @graph 형식
          if (Array.isArray(obj?.['@graph'])) {
            for (const g of obj['@graph']) if (this.isJobPosting(g)) return g;
          }
        }
      } catch {
        // 무시 — 다른 script 시도
      }
    }
    return null;
  }

  private isJobPosting(obj: any): boolean {
    const t = obj?.['@type'];
    if (!t) return false;
    if (typeof t === 'string') return t === 'JobPosting';
    if (Array.isArray(t)) return t.includes('JobPosting');
    return false;
  }

  private fromJsonLd(jp: any, url: string, rawText: string): ParsedJob {
    const arrify = (v: any): string => {
      if (!v) return '';
      if (typeof v === 'string') return v;
      if (Array.isArray(v)) return v.map(arrify).filter(Boolean).join(', ');
      if (v?.name) return String(v.name);
      if (v?.['@value']) return String(v['@value']);
      return '';
    };
    const company = arrify(jp.hiringOrganization);
    const location = arrify(jp.jobLocation?.address) || arrify(jp.jobLocation);
    const baseSalary =
      typeof jp.baseSalary === 'object'
        ? `${arrify(jp.baseSalary.value?.minValue)}${jp.baseSalary.value?.maxValue ? ` ~ ${arrify(jp.baseSalary.value.maxValue)}` : ''} ${arrify(jp.baseSalary.currency) || ''}`.trim()
        : arrify(jp.baseSalary);
    const skills = Array.isArray(jp.skills)
      ? jp.skills.map(arrify).filter(Boolean)
      : typeof jp.skills === 'string'
        ? jp.skills
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [];
    const description = this.htmlToText(arrify(jp.description));
    return {
      url,
      source: 'json-ld',
      title: arrify(jp.title),
      company,
      position: arrify(jp.title) || arrify(jp.occupationalCategory),
      location,
      employmentType: arrify(jp.employmentType),
      experienceLevel: arrify(jp.experienceRequirements) || arrify(jp.qualifications),
      salary: baseSalary,
      skills,
      description: description.slice(0, MAX_TEXT_LEN),
      rawText: rawText.slice(0, MAX_TEXT_LEN),
    };
  }

  private extractOpenGraph(html: string): {
    title: string;
    description: string;
    siteName: string;
  } {
    const meta = (prop: string): string => {
      const re = new RegExp(
        `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,
        'i',
      );
      const m = re.exec(html);
      return m ? m[1].trim() : '';
    };
    return {
      title: meta('og:title') || meta('twitter:title') || this.extractTitleTag(html),
      description: meta('og:description') || meta('description') || meta('twitter:description'),
      siteName: meta('og:site_name'),
    };
  }

  private extractTitleTag(html: string): string {
    const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
    return m ? m[1].trim().slice(0, 200) : '';
  }

  private async extractWithLlm(
    text: string,
    og: { title: string; description: string; siteName: string },
    url: string,
  ): Promise<Omit<ParsedJob, 'url' | 'source' | 'rawText'>> {
    const trimmed = text.slice(0, MAX_TEXT_LEN);
    const systemPrompt = `당신은 한국 채용공고 페이지를 구조화된 JSON 으로 변환하는 전문가입니다.
응답은 반드시 valid JSON 객체. 마크다운/설명 금지.
필드 누락 시 빈 문자열 "" 반환. skills 는 string array.

출력 스키마:
{
  "title": string,        // 공고 제목
  "company": string,      // 회사명
  "position": string,     // 포지션 (백엔드/프론트엔드 등)
  "location": string,     // 근무지
  "employmentType": string, // 정규직/계약직/인턴/프리랜서
  "experienceLevel": string, // 신입/경력N년/무관
  "salary": string,       // 연봉 정보 (있을 때)
  "skills": string[],     // 요구 기술 스택 5~10개
  "description": string   // 핵심 업무/자격요건 요약 500자 이내
}`;

    const userMessage = `URL: ${url}
OG title: ${og.title}
OG description: ${og.description}
Site: ${og.siteName}

본문 텍스트:
${trimmed}`;

    const res = await this.llm.generateWithFallback(systemPrompt, userMessage, 'groq');
    return this.parseLlmJson(res.text);
  }

  private parseLlmJson(text: string): Omit<ParsedJob, 'url' | 'source' | 'rawText'> {
    // 모델이 ``` ``` 으로 감싸는 경우 대비
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    let obj: any;
    try {
      obj = JSON.parse(cleaned);
    } catch {
      // JSON 객체만 슬라이스 시도
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start === -1 || end === -1) {
        throw new Error('LLM 이 유효한 JSON 을 반환하지 않았습니다');
      }
      obj = JSON.parse(cleaned.slice(start, end + 1));
    }
    const str = (v: any) => (typeof v === 'string' ? v : v == null ? '' : String(v));
    return {
      title: str(obj.title),
      company: str(obj.company),
      position: str(obj.position),
      location: str(obj.location),
      employmentType: str(obj.employmentType),
      experienceLevel: str(obj.experienceLevel),
      salary: str(obj.salary),
      skills: Array.isArray(obj.skills) ? obj.skills.map(str).filter(Boolean) : [],
      description: str(obj.description).slice(0, MAX_TEXT_LEN),
    };
  }
}
