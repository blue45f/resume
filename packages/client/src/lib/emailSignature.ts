import type { Resume } from '@/types/resume';

export interface SignatureOptions {
  /** 절대 URL (현재 공유 URL 등). 없으면 링크 블록 생략. */
  shareUrl?: string;
  /** 강조 색상 (테마 accent). */
  accent?: string;
}

/**
 * 이력서 → Gmail/Outlook 에 붙여넣을 수 있는 HTML 이메일 서명.
 * 인라인 스타일만 사용 (이메일 클라이언트는 <style> 태그 잘 지원 안 함).
 */
export function buildHtmlSignature(resume: Resume, options: SignatureOptions = {}): string {
  const p = resume.personalInfo;
  const accent = options.accent || '#1e40af';
  const current = resume.experiences.find((e) => e.current);
  const totalYears = computeYears(resume);
  const topSkills = computeTopSkills(resume, 3);

  const safe = (s: string) => escapeHtml(s || '');
  const link = (url: string, label?: string) =>
    `<a href="${safe(url)}" style="color:${accent};text-decoration:none">${safe(label || url)}</a>`;

  const rows: string[] = [];

  // 1. 이름 + 직함
  rows.push(
    `<div style="font-weight:600;font-size:14px;color:#0f172a">${safe(p.name || '')}</div>`,
  );

  const subtitleParts: string[] = [];
  if (current?.position) subtitleParts.push(safe(current.position));
  if (current?.company) subtitleParts.push(safe(current.company));
  if (subtitleParts.length) {
    rows.push(
      `<div style="font-size:12px;color:#475569;margin-top:2px">${subtitleParts.join(' · ')}</div>`,
    );
  }

  // 2. 경력/기술 요약
  const meta: string[] = [];
  if (totalYears >= 0.5) meta.push(`${Math.round(totalYears * 10) / 10}년 경력`);
  if (topSkills.length) meta.push(topSkills.join(' / '));
  if (meta.length) {
    rows.push(
      `<div style="font-size:12px;color:#64748b;margin-top:3px">${safe(meta.join(' · '))}</div>`,
    );
  }

  // 3. 연락처 라인 — 이메일·전화
  const contact: string[] = [];
  if (p.email) contact.push(link(`mailto:${p.email}`, p.email));
  if (p.phone) contact.push(safe(p.phone));
  if (contact.length) {
    rows.push(
      `<div style="font-size:12px;color:#475569;margin-top:6px">${contact.join(' &nbsp;·&nbsp; ')}</div>`,
    );
  }

  // 4. 링크 — 공유 URL / 웹사이트 / GitHub
  const links: string[] = [];
  if (options.shareUrl) links.push(link(options.shareUrl, '이력서'));
  if (p.website) links.push(link(p.website, '웹사이트'));
  if (p.github) links.push(link(`https://github.com/${p.github}`, 'GitHub'));
  if (links.length) {
    rows.push(`<div style="font-size:12px;margin-top:3px">${links.join(' &nbsp;·&nbsp; ')}</div>`);
  }

  return `<table cellpadding="0" cellspacing="0" style="font-family:-apple-system,'Pretendard',sans-serif;border-left:3px solid ${accent};padding-left:12px">
  <tr><td>
  ${rows.join('\n  ')}
  </td></tr>
</table>`;
}

/** 일반 텍스트 폴백 (클립보드에 plain text 로 함께 복사). */
export function buildPlainSignature(resume: Resume, options: SignatureOptions = {}): string {
  const p = resume.personalInfo;
  const current = resume.experiences.find((e) => e.current);
  const totalYears = computeYears(resume);
  const topSkills = computeTopSkills(resume, 3);

  const lines: string[] = [];
  if (p.name) lines.push(p.name);

  const subtitle: string[] = [];
  if (current?.position) subtitle.push(current.position);
  if (current?.company) subtitle.push(current.company);
  if (subtitle.length) lines.push(subtitle.join(' · '));

  const meta: string[] = [];
  if (totalYears >= 0.5) meta.push(`${Math.round(totalYears * 10) / 10}년 경력`);
  if (topSkills.length) meta.push(topSkills.join(' / '));
  if (meta.length) lines.push(meta.join(' · '));

  const contact: string[] = [];
  if (p.email) contact.push(p.email);
  if (p.phone) contact.push(p.phone);
  if (contact.length) lines.push(contact.join(' · '));

  const links: string[] = [];
  if (options.shareUrl) links.push(`이력서: ${options.shareUrl}`);
  if (p.website) links.push(`웹: ${p.website}`);
  if (p.github) links.push(`GitHub: https://github.com/${p.github}`);
  if (links.length) lines.push(links.join(' · '));

  return lines.join('\n');
}

export async function copySignatureToClipboard(
  resume: Resume,
  options: SignatureOptions = {},
): Promise<void> {
  const html = buildHtmlSignature(resume, options);
  const plain = buildPlainSignature(resume, options);

  // ClipboardItem 지원 브라우저 — HTML + plain 양쪽 모두 클립보드에 넣기
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    try {
      const item = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plain], { type: 'text/plain' }),
      });
      await navigator.clipboard.write([item]);
      return;
    } catch {
      // fallthrough
    }
  }
  // 폴백: plain 만 복사
  await navigator.clipboard.writeText(plain);
}

function computeYears(resume: Resume): number {
  return resume.experiences.reduce((sum, e) => {
    if (!e.startDate) return sum;
    const start = new Date(e.startDate + '-01').getTime();
    const end = e.current ? Date.now() : new Date((e.endDate || e.startDate) + '-01').getTime();
    return sum + Math.max(0, (end - start) / (1000 * 60 * 60 * 24 * 365));
  }, 0);
}

function computeTopSkills(resume: Resume, n: number): string[] {
  const all = resume.skills.flatMap((s) => s.items.split(',').map((x) => x.trim())).filter(Boolean);
  return all.slice(0, n);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
