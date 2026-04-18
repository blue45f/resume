import type { Resume } from '@/types/resume';

/**
 * 이력서의 PersonalInfo 를 RFC 6350 vCard 3.0 텍스트로 직렬화.
 * 면접관이 1-클릭으로 연락처를 주소록에 추가할 수 있게 .vcf 파일로 제공.
 *
 * 지원 필드: 이름, 이메일, 전화, 주소, 웹사이트, GitHub, 현재 직장·직함, 사진(data URL).
 */
export function buildVCard(resume: Resume): string {
  const p = resume.personalInfo;
  const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0'];

  const name = (p.name || '').trim();
  if (name) {
    // N:Last;First;Middle;Prefix;Suffix — 한국 이름은 전체를 성으로 취급 (fallback)
    const [first, ...rest] = name.split(' ');
    const last = rest.join(' ') || first;
    lines.push(`N:${escape(last)};${escape(rest.length ? first : '')};;;`);
    lines.push(`FN:${escape(name)}`);
  }

  if (p.email) lines.push(`EMAIL;TYPE=INTERNET:${escape(p.email)}`);
  if (p.phone) lines.push(`TEL;TYPE=CELL:${escape(p.phone)}`);
  if (p.address) lines.push(`ADR;TYPE=HOME:;;${escape(p.address)};;;;`);
  if (p.website) lines.push(`URL:${escape(p.website)}`);
  if (p.github) lines.push(`URL;TYPE=GitHub:${escape(`https://github.com/${p.github}`)}`);

  // 현재 재직 회사 (가장 최근 experience 에서 current=true)
  const current = resume.experiences.find((e) => e.current);
  if (current) {
    if (current.company) lines.push(`ORG:${escape(current.company)}`);
    if (current.position) lines.push(`TITLE:${escape(current.position)}`);
  }

  // 자기소개 요약 — NOTE 에 80자 이내로
  if (p.summary) {
    const summary = stripHtml(p.summary).slice(0, 300);
    if (summary) lines.push(`NOTE:${escape(summary)}`);
  }

  // 프로필 사진 (data URL 만 지원 — 외부 URL 이면 skip)
  if (p.photo && p.photo.startsWith('data:image/')) {
    const [meta, base64] = p.photo.split(',');
    const mimeMatch = meta.match(/data:image\/(\w+)/);
    if (base64 && mimeMatch) {
      lines.push(`PHOTO;ENCODING=b;TYPE=${mimeMatch[1].toUpperCase()}:${base64}`);
    }
  }

  lines.push(`REV:${new Date().toISOString()}`);
  lines.push('END:VCARD');
  return lines.join('\r\n');
}

export function downloadVCard(resume: Resume): void {
  const vcf = buildVCard(resume);
  const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = (resume.personalInfo.name || resume.title || 'contact').replace(
    /[^a-zA-Z0-9가-힣_-]/g,
    '_',
  );
  a.href = url;
  a.download = `${safeName}.vcf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** vCard 특수문자 이스케이프: \\, \n, , 를 \\\\ 처리 */
function escape(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
