import { useMemo } from 'react';
import { checkResumeProjectDescriptionQuality } from '@/lib/resumeProjectDescriptionQualityChecker';
import type { ProjectQualityDimension } from '@/lib/resumeProjectDescriptionQualityChecker';

interface Props {
  text: string;
}

const DIMENSION_LABEL: Record<ProjectQualityDimension, string> = {
  role_clarity: '역할 명시',
  tech_specificity: '기술 구체성',
  outcome_quantified: '수치 성과',
  problem_statement: '문제 서술',
  team_scale: '팀 규모',
  timeline: '기간',
};

const GRADE_LABEL: Record<string, string> = {
  excellent: '우수',
  good: '보통',
  weak: '부족',
  vague: '모호',
};

export default function ResumeProjectDescriptionPanel({ text }: Props) {
  const report = useMemo(() => checkResumeProjectDescriptionQuality(text), [text]);

  if (text.trim().length < 100) return null;
  if (report.grade === 'excellent') return null;

  const isWarning = report.grade === 'vague';

  return (
    <aside
      className={`proj-desc-card${isWarning ? ' proj-desc-card--warning' : ''}`}
      aria-label="프로젝트 설명 품질 분석"
    >
      <header className="proj-desc-card__head">
        <span className="proj-desc-card__eyebrow">프로젝트 품질</span>
        <span className={`proj-desc-card__badge proj-desc-card__badge--${report.grade}`}>
          {GRADE_LABEL[report.grade]}
        </span>
      </header>

      <p className="proj-desc-card__hint">{report.summary}</p>

      {report.qualitySignals.length > 0 && (
        <div className="proj-desc-card__chips" aria-label="품질 신호">
          {report.qualitySignals.map((sig, i) => (
            <span key={i} className="proj-desc-card__chip proj-desc-card__chip--good">
              {DIMENSION_LABEL[sig.dimension]}
            </span>
          ))}
        </div>
      )}

      {report.suggestions.length > 0 && (
        <ul className="proj-desc-card__suggestions" aria-label="개선 제안">
          {report.suggestions.map((s, i) => (
            <li key={i} className="proj-desc-card__suggestion">
              → {s}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
