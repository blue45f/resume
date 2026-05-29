import { useMemo } from 'react';
import { checkResumeContributionClarity } from '@/lib/resumeContributionClarityChecker';

interface Props {
  text: string;
}

const CLARITY_LABEL: Record<string, string> = {
  mixed: '기여 보강',
  unclear: '기여 불명확',
};

export default function ResumeContributionClarityPanel({ text }: Props) {
  const report = useMemo(() => checkResumeContributionClarity(text), [text]);

  if (text.trim().length < 40) return null;
  if (report.clarity === 'clear') return null;

  const isUnclear = report.clarity === 'unclear';

  return (
    <aside
      className={`contrib-card${isUnclear ? ' contrib-card--warn' : ''}`}
      aria-label="개인 기여도 명확성 분석"
    >
      <header className="contrib-card__head">
        <span className="contrib-card__eyebrow">개인 기여도</span>
        <span className={`contrib-card__badge contrib-card__badge--${report.clarity}`}>
          {CLARITY_LABEL[report.clarity]}
        </span>
        <span className="contrib-card__meta">
          개인 {report.individualCount} / 집단 {report.collectiveCount}
        </span>
      </header>

      <p className="contrib-card__hint">{report.summary}</p>

      {report.collectiveExamples.length > 0 && (
        <div className="contrib-card__chips" aria-label="집단 주어 예시">
          {report.collectiveExamples.slice(0, 3).map((ex, i) => (
            <span key={i} className="contrib-card__chip">
              {ex}
            </span>
          ))}
        </div>
      )}

      {report.suggestions.length > 0 && (
        <ul className="contrib-card__recs" aria-label="기여 명확화 권장사항">
          {report.suggestions.slice(0, 3).map((s, i) => (
            <li key={i} className="contrib-card__rec">
              → {s}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
