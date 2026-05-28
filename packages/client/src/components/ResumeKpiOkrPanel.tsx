import { useMemo } from 'react';
import { analyzeKpiOkrAchievements } from '@/lib/resumeKpiOkrAnalyzer';

interface Props {
  text: string;
}

const GRADE_LABEL: Record<string, string> = {
  strong: '목표 연결',
  adequate: '수치 있음',
  weak: '근거 미흡',
  none: '해당 없음',
};

export default function ResumeKpiOkrPanel({ text }: Props) {
  const report = useMemo(() => analyzeKpiOkrAchievements(text), [text]);

  if (text.trim().length < 80) return null;
  if (report.grade === 'none' || report.grade === 'strong') return null;

  const isWarning = report.grade === 'weak';

  return (
    <aside
      className={`kpi-okr-card${isWarning ? ' kpi-okr-card--warning' : ''}`}
      aria-label="KPI/OKR 성과 분석"
    >
      <header className="kpi-okr-card__head">
        <span className="kpi-okr-card__eyebrow">KPI/OKR</span>
        <span className={`kpi-okr-card__badge kpi-okr-card__badge--${report.grade}`}>
          {GRADE_LABEL[report.grade]}
        </span>
      </header>

      <p className="kpi-okr-card__hint">{report.suggestion}</p>

      <div className="kpi-okr-card__stats">
        {report.kpiExplicitCount > 0 && (
          <span className="kpi-okr-card__stat kpi-okr-card__stat--good">
            KPI/OKR 명시 {report.kpiExplicitCount}건
          </span>
        )}
        {report.numericOutcomeCount > 0 && (
          <span className="kpi-okr-card__stat kpi-okr-card__stat--good">
            수치 성과 {report.numericOutcomeCount}건
          </span>
        )}
        {report.vagueCount > 0 && (
          <span className="kpi-okr-card__stat kpi-okr-card__stat--warn">
            모호한 성과 {report.vagueCount}건
          </span>
        )}
        {report.effortOnlyCount > 0 && (
          <span className="kpi-okr-card__stat kpi-okr-card__stat--bad">
            과정만 기술 {report.effortOnlyCount}건
          </span>
        )}
      </div>
    </aside>
  );
}
