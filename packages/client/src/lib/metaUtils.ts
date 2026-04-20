/**
 * 메타 유틸리티 모듈 — koreanChecker.ts 에서 분리.
 *
 * 공통 주제: 텍스트 보조 메타 정보 (시간·링크·태그·문자 분포).
 *
 * - estimateReadingTime: 한국어 평균 300자/분 기준 예상 독해 시간
 * - extractLinks: URL 추출 + 플랫폼(GitHub/LinkedIn/Notion 등) 분류 + scheme 검증
 * - generateHashtags: 키워드 기반 해시태그 생성
 * - countCharsByCategory: 한글/영문/숫자/공백/부호/기타 분포
 */

import { extractKeywords } from './jdKeywords';

export interface ReadingTimeEstimate {
  chars: number;
  words: number;
  minutes: number;
  label: string;
}

/**
 * 예상 읽기 시간 — 한국어 평균 독해 속도 ~300 자/분 기준.
 */
export function estimateReadingTime(text: string, charsPerMinute = 300): ReadingTimeEstimate {
  const clean = (text ?? '').replace(/\s+/g, '');
  const chars = clean.length;
  const words = (text ?? '').match(/[가-힣A-Za-z0-9]+/g)?.length ?? 0;
  const rawMinutes = chars / charsPerMinute;
  const minutes = Math.max(0, Math.round(rawMinutes * 2) / 2);
  const label =
    chars === 0
      ? '본문 없음'
      : rawMinutes < 0.5
        ? '30초 이내'
        : minutes < 1
          ? '약 30초'
          : minutes < 2
            ? '약 1분'
            : `약 ${Math.round(minutes)}분`;
  return { chars, words, minutes, label };
}

export interface ExtractedLink {
  url: string;
  index: number;
  platform: 'github' | 'linkedin' | 'notion' | 'behance' | 'dribbble' | 'velog' | 'blog' | 'other';
  hasScheme: boolean;
}

export interface LinkAnalysis {
  links: ExtractedLink[];
  count: number;
  platforms: string[];
  missingScheme: number;
  suggestion: string;
}

const PLATFORM_PATTERNS: Array<{ re: RegExp; platform: ExtractedLink['platform'] }> = [
  { re: /github\.com/i, platform: 'github' },
  { re: /linkedin\.com/i, platform: 'linkedin' },
  { re: /notion\.(so|site)/i, platform: 'notion' },
  { re: /behance\.net/i, platform: 'behance' },
  { re: /dribbble\.com/i, platform: 'dribbble' },
  { re: /velog\.io/i, platform: 'velog' },
  { re: /\b(tistory|naver\/blog|medium)/i, platform: 'blog' },
];

/**
 * URL 링크 추출 + 플랫폼 분류 + https:// scheme 누락 경고.
 */
export function extractLinks(text: string): LinkAnalysis {
  const t = text ?? '';
  const links: ExtractedLink[] = [];
  const re = /(?:https?:\/\/)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s)]*)?/g;
  let m: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((m = re.exec(t))) {
    const url = m[0];
    if (seen.has(url)) continue;
    seen.add(url);
    const hasScheme = /^https?:\/\//i.test(url);
    let platform: ExtractedLink['platform'] = 'other';
    for (const p of PLATFORM_PATTERNS) {
      if (p.re.test(url)) {
        platform = p.platform;
        break;
      }
    }
    links.push({ url, index: m.index, platform, hasScheme });
  }
  const platforms = [...new Set(links.map((l) => l.platform))];
  const missingScheme = links.filter((l) => !l.hasScheme).length;
  const suggestion = !links.length
    ? '외부 링크가 감지되지 않았습니다.'
    : missingScheme > 0
      ? `링크 ${links.length}개 — ${missingScheme}개에 https:// 스킴 누락 (클릭 안 될 수 있음).`
      : `링크 ${links.length}개 · 플랫폼 ${platforms.length}종 (${platforms.join(', ')}).`;
  return { links: links.slice(0, 30), count: links.length, platforms, missingScheme, suggestion };
}

/**
 * 키워드 → 해시태그 생성. 포트폴리오 공유용 추천 태그 생성.
 */
export function generateHashtags(text: string, topN = 8): string[] {
  const kws = extractKeywords(text, topN * 2);
  return kws
    .filter((k) => k.word.length >= 2 && /^[가-힣A-Za-z0-9]+$/.test(k.word))
    .slice(0, topN)
    .map((k) => `#${k.word}`);
}

export interface CharDistribution {
  total: number;
  korean: number;
  english: number;
  digits: number;
  whitespace: number;
  punctuation: number;
  other: number;
  percents: {
    korean: number;
    english: number;
    digits: number;
    whitespace: number;
    punctuation: number;
    other: number;
  };
}

/**
 * 문자 카테고리별 분포 — 한글/영문/숫자/공백/기타 기호 비율 계산.
 */
export function countCharsByCategory(text: string): CharDistribution {
  const t = text ?? '';
  let korean = 0;
  let english = 0;
  let digits = 0;
  let whitespace = 0;
  let punctuation = 0;
  let other = 0;
  for (const ch of t) {
    if (/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(ch)) korean++;
    else if (/[A-Za-z]/.test(ch)) english++;
    else if (/[0-9]/.test(ch)) digits++;
    else if (/\s/.test(ch)) whitespace++;
    else if (/[.,!?;:()"'`\-·\u3000「」『』《》〈〉]/.test(ch)) punctuation++;
    else other++;
  }
  const total = t.length || 1;
  const p = (n: number) => Math.round((n / total) * 1000) / 10;
  return {
    total,
    korean,
    english,
    digits,
    whitespace,
    punctuation,
    other,
    percents: {
      korean: p(korean),
      english: p(english),
      digits: p(digits),
      whitespace: p(whitespace),
      punctuation: p(punctuation),
      other: p(other),
    },
  };
}
