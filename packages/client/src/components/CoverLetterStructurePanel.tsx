import { useMemo } from 'react';
import { buildCoverLetterStructureReport } from '@/lib/coverLetterStructure';

interface Props {
  text: string;
}

const STATUS_ICON: Record<'pass' | 'warn' | 'fail', string> = {
  pass: '✓',
  warn: '▲',
  fail: '✕',
};

export default function CoverLetterStructurePanel({ text }: Props) {
  const report = useMemo(() => buildCoverLetterStructureReport(text), [text]);

  if (report.checks.length === 0) return null;

  const fill = Math.max(0.04, Math.min(1, report.score / 100));

  return (
    <aside
      className={`cl-struct-card cl-struct-card--${report.tone}`}
      aria-label="자기소개서 구조 품질"
    >
      <header className="cl-struct-card__head">
        <span className="cl-struct-card__eyebrow">Cover letter structure</span>
        <span className="cl-struct-card__label">{report.label}</span>
      </header>

      <div
        className="cl-struct-card__meter"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={report.score}
        aria-label="구조 점수"
      >
        <span
          className="cl-struct-card__meter-fill"
          style={{ ['--cl-struct-fill' as never]: String(fill) }}
        />
      </div>

      <div className="cl-struct-card__meta">
        <span>{report.wordCount.toLocaleString()}단어</span>
        <span>{report.paragraphCount}단락</span>
      </div>

      <ul className="cl-struct-card__checks" aria-label="구조 체크리스트">
        {report.checks.map((check) => (
          <li
            key={check.label}
            className={`cl-struct-card__check cl-struct-card__check--${check.status}`}
          >
            <span className="cl-struct-card__check-icon" aria-hidden>
              {STATUS_ICON[check.status]}
            </span>
            <span className="cl-struct-card__check-label">{check.label}</span>
            <span className="cl-struct-card__check-msg">{check.message}</span>
          </li>
        ))}
      </ul>

      <p className="cl-struct-card__summary">{report.summary}</p>
    </aside>
  );
}
