import { useMemo } from 'react';
import { checkResumeChronology } from '@/lib/resumeChronologyChecker';

interface Props {
  text: string;
}

const GRADE_LABEL: Record<string, string> = {
  mixed: '순서 혼재',
  reversed: '역순 권장',
};

export default function ResumeChronologyPanel({ text }: Props) {
  const report = useMemo(() => checkResumeChronology(text), [text]);

  if (text.trim().length < 20) return null;
  if (report.grade === 'ordered') return null;

  const isReversed = report.grade === 'reversed';

  return (
    <aside
      className={`chrono-card${isReversed ? ' chrono-card--reversed' : ''}`}
      aria-label="시간순 정렬 점검"
    >
      <header className="chrono-card__head">
        <span className="chrono-card__eyebrow">시간순 정렬</span>
        <span className={`chrono-card__badge chrono-card__badge--${report.grade}`}>
          {GRADE_LABEL[report.grade]}
        </span>
        <span className="chrono-card__meta">기간 {report.rangeCount}건</span>
      </header>

      <p className="chrono-card__hint">{report.summary}</p>

      {report.ranges.length > 0 && (
        <div className="chrono-card__chips" aria-label="감지된 기간">
          {report.ranges.slice(0, 6).map((r, i) => (
            <span key={i} className="chrono-card__chip">
              {r.excerpt}
            </span>
          ))}
        </div>
      )}

      {report.suggestions.length > 0 && (
        <ul className="chrono-card__recs" aria-label="정렬 권장사항">
          {report.suggestions.slice(0, 3).map((s, i) => (
            <li key={i} className="chrono-card__rec">
              → {s}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
