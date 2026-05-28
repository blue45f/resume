import { useMemo } from 'react';
import { checkCareerGapExplanations } from '@/lib/careerGapExplanationChecker';
import type { GapExplanationType } from '@/lib/careerGapExplanationChecker';

interface Props {
  text: string;
}

const TYPE_LABEL: Record<GapExplanationType, string> = {
  military: '군복무',
  study: '학습/연수',
  personal: '육아/건강',
  side_project: '사이드 프로젝트',
  startup: '창업',
  job_search: '구직 활동',
  explained_other: '자기계발',
};

const TYPE_ICON: Record<GapExplanationType, string> = {
  military: '🎖',
  study: '📚',
  personal: '🏠',
  side_project: '💻',
  startup: '🚀',
  job_search: '🔍',
  explained_other: '📈',
};

export default function CareerGapExplanationPanel({ text }: Props) {
  const report = useMemo(() => checkCareerGapExplanations(text), [text]);

  if (text.trim().length < 80) return null;
  // Only show if there are signals worth showing (unexplained or explained worth highlighting)
  if (report.totalGapSignals === 0 && !report.hasUnexplainedGap) return null;

  const isWarning = report.hasUnexplainedGap || report.totalGapSignals === 0;

  return (
    <aside
      className={`gap-explain-card${isWarning ? ' gap-explain-card--warning' : ''}`}
      aria-label="경력 공백 설명 분석"
    >
      <header className="gap-explain-card__head">
        <span className="gap-explain-card__eyebrow">공백 설명</span>
        <span
          className={`gap-explain-card__badge gap-explain-card__badge--${isWarning ? 'missing' : 'ok'}`}
        >
          {isWarning ? '미설명' : `${report.totalGapSignals}개 설명`}
        </span>
      </header>

      <p className="gap-explain-card__hint">{report.suggestion}</p>

      {report.explanationTypes.length > 0 && (
        <ul className="gap-explain-card__types" aria-label="감지된 공백 설명">
          {report.explanationTypes.map((t) => (
            <li key={t} className="gap-explain-card__type-item">
              <span className="gap-explain-card__icon">{TYPE_ICON[t]}</span>
              {TYPE_LABEL[t]}
            </li>
          ))}
        </ul>
      )}

      {report.tips.length > 0 && (
        <ul className="gap-explain-card__tips" aria-label="개선 제안">
          {report.tips.map((tip, i) => (
            <li key={i} className="gap-explain-card__tip">
              {tip}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
