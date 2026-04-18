import type { Resume } from '@/types/resume';

interface BuildOptions {
  shareUrl?: string;
  accent?: string;
}

/**
 * 이력서 핵심 통계를 1200x630 OG 비율 SVG 카드로 생성.
 * 외부 이미지 의존 없이 순수 SVG (텍스트 + 기하 도형).
 * Canvas 2D 로 PNG 변환해 다운로드 가능.
 */
export function buildSocialCardSvg(resume: Resume, options: BuildOptions = {}): string {
  const accent = options.accent || '#2563eb';
  const p = resume.personalInfo;
  const current = resume.experiences.find((e) => e.current) || resume.experiences[0];
  const totalYears = resume.experiences.reduce((sum, e) => {
    if (!e.startDate) return sum;
    const start = new Date(e.startDate + '-01').getTime();
    const end = e.current ? Date.now() : new Date((e.endDate || e.startDate) + '-01').getTime();
    return sum + Math.max(0, (end - start) / (1000 * 60 * 60 * 24 * 365));
  }, 0);
  const skillCount = resume.skills.reduce(
    (n, s) => n + s.items.split(',').filter(Boolean).length,
    0,
  );
  const projectCount = resume.projects.length;

  const name = escapeXml(p.name || '이력서');
  const role = escapeXml(current?.position || '');
  const company = escapeXml(current?.company || '');
  const topSkills = resume.skills
    .flatMap((s) => s.items.split(',').map((x) => x.trim()))
    .filter(Boolean)
    .slice(0, 5)
    .map(escapeXml);

  // 1200x630 — OG 이미지 표준
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0f172a"/>
      <stop offset="0.5" stop-color="#1e293b"/>
      <stop offset="1" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${accent}"/>
      <stop offset="1" stop-color="${accent}80"/>
    </linearGradient>
    <pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="20" cy="20" r="1.5" fill="${accent}" opacity="0.12"/>
    </pattern>
  </defs>

  <!-- 배경 -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#dots)"/>

  <!-- 상단 accent bar -->
  <rect x="0" y="0" width="1200" height="6" fill="url(#accent)"/>

  <!-- 우측 장식 원 -->
  <circle cx="1050" cy="140" r="120" fill="${accent}" opacity="0.08"/>
  <circle cx="1100" cy="190" r="60" fill="${accent}" opacity="0.15"/>

  <!-- 로고/브랜드 -->
  <text x="80" y="85" font-family="-apple-system, 'Pretendard', sans-serif" font-size="18" font-weight="600" fill="#94a3b8" letter-spacing="3">
    이력서공방
  </text>

  <!-- 이름 -->
  <text x="80" y="230" font-family="-apple-system, 'Pretendard', sans-serif" font-size="88" font-weight="800" fill="#ffffff">
    ${name}
  </text>

  <!-- 현재 직함 · 회사 -->
  ${
    role || company
      ? `<text x="80" y="290" font-family="-apple-system, 'Pretendard', sans-serif" font-size="32" font-weight="500" fill="${accent}">${[role, company].filter(Boolean).join(' · ')}</text>`
      : ''
  }

  <!-- 통계 3개 -->
  <g transform="translate(80, 380)">
    ${stat(0, `${Math.round(totalYears * 10) / 10}년`, '경력', accent)}
    ${stat(280, `${skillCount}`, '기술 스택', accent)}
    ${stat(560, `${projectCount}`, '프로젝트', accent)}
  </g>

  <!-- 상위 기술 태그 -->
  ${
    topSkills.length > 0
      ? `<g transform="translate(80, 540)">
      ${topSkills
        .map((skill, i) => {
          const w = estimateWidth(skill, 20) + 32;
          const x = sumTagWidths(topSkills, i, 20, 32) + i * 12;
          return `<g transform="translate(${x}, 0)">
        <rect x="0" y="0" width="${w}" height="44" rx="22" fill="#ffffff" opacity="0.08"/>
        <rect x="0" y="0" width="${w}" height="44" rx="22" fill="none" stroke="${accent}" stroke-width="1.5" opacity="0.5"/>
        <text x="${w / 2}" y="29" font-family="-apple-system, 'Pretendard', sans-serif" font-size="18" font-weight="500" fill="#ffffff" text-anchor="middle">${skill}</text>
      </g>`;
        })
        .join('\n')}
    </g>`
      : ''
  }

  <!-- 하단 URL -->
  ${
    options.shareUrl
      ? `<text x="80" y="600" font-family="'SF Mono', 'Consolas', monospace" font-size="16" fill="#64748b">${escapeXml(options.shareUrl.replace(/^https?:\/\//, ''))}</text>`
      : ''
  }
</svg>`;
}

function stat(x: number, big: string, label: string, accent: string): string {
  return `<g transform="translate(${x}, 0)">
    <text x="0" y="0" font-family="-apple-system, 'Pretendard', sans-serif" font-size="68" font-weight="800" fill="#ffffff">${big}</text>
    <text x="0" y="36" font-family="-apple-system, 'Pretendard', sans-serif" font-size="18" fill="${accent}" font-weight="500">${label}</text>
  </g>`;
}

function estimateWidth(text: string, fontSize: number): number {
  // 한글 ~= fontSize, 영문 ~= fontSize*0.6 로 대략 추정
  let w = 0;
  for (const ch of text) {
    w += /[\uAC00-\uD7AF]/.test(ch) ? fontSize : fontSize * 0.6;
  }
  return Math.ceil(w);
}

function sumTagWidths(tags: string[], upTo: number, fontSize: number, padding: number): number {
  let total = 0;
  for (let i = 0; i < upTo; i++) {
    total += estimateWidth(tags[i], fontSize) + padding;
  }
  return total;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * SVG 를 PNG 로 변환해 다운로드.
 * foreignObject 없이 순수 SVG 도형·텍스트만 쓰므로 Canvas 변환 안전.
 */
export async function downloadSocialCard(
  resume: Resume,
  options: BuildOptions = {},
): Promise<void> {
  const svg = buildSocialCardSvg(resume, options);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('SVG load failed'));
      img.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unsupported');
    ctx.drawImage(img, 0, 0, 1200, 630);

    const pngUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    const safeName = (resume.personalInfo.name || resume.title || 'resume-card').replace(
      /[^a-zA-Z0-9가-힣_-]/g,
      '_',
    );
    a.href = pngUrl;
    a.download = `${safeName}_card.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

/** SVG 그대로 .svg 파일로 다운로드 (벡터 유지) */
export function downloadSocialCardSvg(resume: Resume, options: BuildOptions = {}): void {
  const svg = buildSocialCardSvg(resume, options);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = (resume.personalInfo.name || resume.title || 'resume-card').replace(
    /[^a-zA-Z0-9가-힣_-]/g,
    '_',
  );
  a.href = url;
  a.download = `${safeName}_card.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
