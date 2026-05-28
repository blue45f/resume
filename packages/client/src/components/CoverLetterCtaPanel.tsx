import { useMemo } from 'react';
import { detectCoverLetterCta } from '@/lib/coverLetterCtaDetector';
import type { CtaStrength } from '@/lib/coverLetterCtaDetector';

export default function CoverLetterCtaPanel({ text }: { text: string }) {
  const report = useMemo(() => detectCoverLetterCta(text), [text]);

  if (text.trim().length < 50) return null;
  if (report.strength === 'strong') return null;

  const STRENGTH_COLOR: Record<CtaStrength, string> = {
    strong: '',
    present: 'border-sky-200 bg-sky-50',
    weak: 'border-amber-200 bg-amber-50',
    absent: 'border-rose-200 bg-rose-50',
  };
  const STRENGTH_TEXT: Record<CtaStrength, string> = {
    strong: '',
    present: 'text-sky-800',
    weak: 'text-amber-800',
    absent: 'text-rose-800',
  };
  const BADGE_COLOR: Record<CtaStrength, string> = {
    strong: '',
    present: 'bg-sky-100 text-sky-700',
    weak: 'bg-amber-100 text-amber-700',
    absent: 'bg-rose-100 text-rose-700',
  };
  const STRENGTH_LABEL: Record<CtaStrength, string> = {
    strong: '강한 CTA',
    present: 'CTA 있음',
    weak: '소극적',
    absent: '없음',
  };

  return (
    <aside
      className={`rounded-xl border p-4 text-sm ${STRENGTH_COLOR[report.strength]}`}
      aria-label="마무리 CTA 분석"
    >
      <div
        className={`mb-2 flex items-center gap-2 font-semibold ${STRENGTH_TEXT[report.strength]}`}
      >
        <span>🎯 마무리 행동 요청 (CTA)</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_COLOR[report.strength]}`}
        >
          {STRENGTH_LABEL[report.strength]}
        </span>
      </div>

      <p className={`mb-2 ${STRENGTH_TEXT[report.strength]}`}>{report.summary}</p>

      {report.lastParagraph && (
        <p className="mb-2 rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-600 italic">
          마지막 단락: "{report.lastParagraph.slice(0, 80)}
          {report.lastParagraph.length > 80 ? '…' : ''}"
        </p>
      )}

      {report.suggestions.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-neutral-600">
          {report.suggestions.map((s, i) => (
            <li key={i} className="flex gap-1">
              <span>•</span>
              {s}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
