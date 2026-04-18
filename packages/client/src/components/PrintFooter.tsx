import { useMemo } from 'react';
import type { Resume } from '@/types/resume';

interface Props {
  resume: Resume;
}

/**
 * PrintFooter — 인쇄 시 마지막 페이지 하단에 자동 삽입.
 *
 * 포함 내용:
 * - 공유 URL QR 코드 (api.qrserver.com) — 종이 이력서에서 디지털 버전으로 유도
 * - Career DNA 핑거프린트 SVG (이력서 데이터 기반 고유 패턴)
 * - 발행 시각 / 고유 해시
 *
 * 화면에선 `.print-only` 로 숨김, `@media print` 에서만 표시.
 */
export default function PrintFooter({ resume }: Props) {
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const qrImageUrl = shareUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${encodeURIComponent(
        shareUrl,
      )}&bgcolor=ffffff&color=000000&margin=0&ecc=M`
    : '';

  // Career DNA — 이력서 데이터를 해시해 고유한 24-bar 패턴 생성.
  // 같은 이력서는 항상 같은 패턴, 데이터가 바뀌면 패턴도 변함.
  const dna = useMemo(() => generateCareerDna(resume), [resume]);

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

  const printedAt = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      className="print-only"
      style={{
        marginTop: '24pt',
        paddingTop: '10pt',
        borderTop: '0.5pt solid #cbd5e1',
        fontSize: '8pt',
        color: '#64748b',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: '16pt',
        pageBreakInside: 'avoid',
      }}
    >
      {/* 좌: 메타 정보 */}
      <div style={{ flex: '0 0 auto' }}>
        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '9pt' }}>{resume.title}</div>
        <div style={{ marginTop: '3pt' }}>
          {printedAt} · {Math.round(totalYears * 10) / 10}년 경력 · 기술 {skillCount}개
        </div>
        <div style={{ marginTop: '2pt', fontFamily: 'monospace', fontSize: '7pt', opacity: 0.7 }}>
          #{dna.hash.slice(0, 8)}
        </div>
      </div>

      {/* 중: Career DNA 핑거프린트 */}
      <div style={{ flex: '1 1 auto', display: 'flex', justifyContent: 'center' }}>
        <svg
          width="180"
          height="28"
          viewBox="0 0 180 28"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Career DNA"
        >
          {dna.bars.map((h, i) => (
            <rect
              key={i}
              x={i * 7.5}
              y={14 - h / 2}
              width={6}
              height={h}
              rx={1.5}
              fill={dna.colors[i % dna.colors.length]}
              opacity={0.85}
            />
          ))}
          <text x={180} y={26} textAnchor="end" fontSize="6" fill="#94a3b8" fontStyle="italic">
            career DNA
          </text>
        </svg>
      </div>

      {/* 우: QR 코드 */}
      {qrImageUrl && (
        <div style={{ flex: '0 0 auto', textAlign: 'center' }}>
          <img
            src={qrImageUrl}
            alt="QR: 공유 링크"
            width={64}
            height={64}
            style={{ display: 'block' }}
          />
          <div style={{ marginTop: '2pt', fontSize: '7pt', color: '#64748b' }}>
            스캔해서 온라인 이력서 보기
          </div>
        </div>
      )}
    </div>
  );
}

/** 이력서 데이터를 24-bar 시각적 핑거프린트로 변환. */
function generateCareerDna(resume: Resume): { bars: number[]; colors: string[]; hash: string } {
  const seed = [
    resume.personalInfo.name || '',
    resume.personalInfo.email || '',
    ...resume.experiences.map((e) => `${e.company}:${e.position}:${e.startDate}`),
    ...resume.educations.map((e) => `${e.school}:${e.field}`),
    ...resume.skills.map((s) => s.items),
    ...resume.projects.map((p) => p.name),
  ]
    .join('|')
    .slice(0, 2000);

  const hash = simpleHash(seed);
  const bars: number[] = [];
  for (let i = 0; i < 24; i++) {
    // 해시에서 i-번째 4비트씩 추출 → 6~26 픽셀 높이
    const v = (hash.charCodeAt(i % hash.length) + i * 7) % 22;
    bars.push(6 + v);
  }

  // 3-tone 컬러 팔레트 — 기술/경력/학력 비중 기반
  const expRatio = Math.min(1, resume.experiences.length / 5);
  const skillRatio = Math.min(1, resume.skills.length / 8);

  const colors = [
    interpolate('#0f172a', '#1e40af', expRatio),
    interpolate('#1e40af', '#06b6d4', skillRatio),
    interpolate('#06b6d4', '#0284c7', (expRatio + skillRatio) / 2),
  ];

  return { bars, colors, hash };
}

function simpleHash(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  // 16-digit hex expansion
  let out = h.toString(16).padStart(8, '0');
  let salt = h;
  while (out.length < 24) {
    salt = (salt * 2654435761) >>> 0;
    out += salt.toString(16).padStart(8, '0');
  }
  return out.slice(0, 24);
}

function interpolate(a: string, b: string, t: number): string {
  const ah = hexToRgb(a);
  const bh = hexToRgb(b);
  const r = Math.round(ah[0] + (bh[0] - ah[0]) * t);
  const g = Math.round(ah[1] + (bh[1] - ah[1]) * t);
  const bl = Math.round(ah[2] + (bh[2] - ah[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
