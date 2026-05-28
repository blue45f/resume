import { useMemo } from 'react';
import { analyzeResumeAwards } from '@/lib/resumeAwardsAnalyzer';

interface Props {
  text: string;
}

const QUALITY_LABEL: Record<string, string> = {
  strong: '충실',
  present: '있음',
  bare: '보강 필요',
  none: '없음',
};

export default function ResumeAwardsPanel({ text }: Props) {
  const report = useMemo(() => analyzeResumeAwards(text), [text]);

  if (text.trim().length < 40) return null;
  if (report.quality === 'strong') return null;
  // Don't nag short resumes that simply have no awards section.
  if (report.quality === 'none' && text.trim().length < 400) return null;

  const isWarn = report.quality === 'bare' || report.quality === 'none';

  return (
    <aside
      className={`awards-card${isWarn ? ' awards-card--warn' : ''}`}
      aria-label="수상·성과 분석"
    >
      <header className="awards-card__head">
        <span className="awards-card__eyebrow">수상·성과</span>
        <span className={`awards-card__badge awards-card__badge--${report.quality}`}>
          {QUALITY_LABEL[report.quality]}
        </span>
        {report.count > 0 && (
          <span className="awards-card__meta">
            {report.count}건 · 맥락 {report.contextRatio}%
          </span>
        )}
      </header>

      <p className="awards-card__hint">{report.summary}</p>

      {report.suggestions.length > 0 && (
        <ul className="awards-card__recs" aria-label="수상·성과 보완 권장사항">
          {report.suggestions.slice(0, 3).map((rec, i) => (
            <li key={i} className="awards-card__rec">
              → {rec}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
