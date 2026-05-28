import { useMemo } from 'react';
import { computeSectionHealth } from '@/lib/sectionAnalyzers';

interface Props {
  text: string;
}

const TIER_LABEL: Record<string, string> = {
  excellent: '우수',
  good: '양호',
  fair: '보통',
  poor: '개선 필요',
};

const SCORE_LABELS = [
  { key: 'balanceScore', label: '섹션 균형' },
  { key: 'orderScore', label: '배치 순서' },
  { key: 'densityScore', label: '내용 밀도' },
] as const;

export default function ResumeSectionHealthPanel({ text }: Props) {
  const report = useMemo(() => computeSectionHealth(text), [text]);

  if (report.tier === 'excellent') return null;
  if (report.overall === 0 && report.topHints.length === 0) return null;

  return (
    <aside
      className={`sec-health-card sec-health-card--${report.tier}`}
      aria-label="섹션 구조 건강도 분석"
    >
      <header className="sec-health-card__head">
        <span className="sec-health-card__eyebrow">section health</span>
        <span className="sec-health-card__title">섹션 구조 분석</span>
        <span className={`sec-health-card__tier sec-health-card__tier--${report.tier}`}>
          {TIER_LABEL[report.tier]}
        </span>
      </header>

      <div className="sec-health-card__meter-wrap" aria-label="섹션 건강도 종합 점수">
        <div
          className="sec-health-card__meter"
          style={{ '--sec-fill': `${report.overall}%` } as React.CSSProperties}
          role="progressbar"
          aria-valuenow={report.overall}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`종합 점수 ${report.overall}점`}
        />
        <span className="sec-health-card__score">{report.overall}점</span>
      </div>

      <div className="sec-health-card__breakdown" aria-label="세부 점수">
        {SCORE_LABELS.map(({ key, label }) => (
          <div key={key} className="sec-health-card__sub">
            <span className="sec-health-card__sub-label">{label}</span>
            <div
              className="sec-health-card__sub-bar"
              style={{ '--sub-fill': `${report[key]}%` } as React.CSSProperties}
              role="progressbar"
              aria-valuenow={report[key]}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${label} ${report[key]}점`}
            />
            <span className="sec-health-card__sub-score">{report[key]}</span>
          </div>
        ))}
      </div>

      {report.topHints.length > 0 && (
        <ul className="sec-health-card__hints" aria-label="개선 제안">
          {report.topHints.map((hint, i) => (
            <li key={i} className="sec-health-card__hint">
              {hint}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
