import { useMemo } from 'react';
import { checkCareerNarrative } from '@/lib/resumeCareerNarrativeChecker';
import type { NarrativeIssueType } from '@/lib/resumeCareerNarrativeChecker';

interface Props {
  text: string;
}

const ISSUE_LABEL: Record<NarrativeIssueType, string> = {
  frequent_job_switch: '잦은 이직',
  domain_scatter: '도메인 산만',
  role_regression: '역할 하강',
  tech_scatter: '기술 분산',
  no_progression: '성장 부재',
  strong_narrative: '강한 내러티브',
};

const COHESION_LABEL: Record<string, string> = {
  coherent: '일관됨',
  adequate: '보완 필요',
  fragmented: '산만',
};

export default function ResumeCareerNarrativePanel({ text }: Props) {
  const report = useMemo(() => checkCareerNarrative(text), [text]);

  if (text.trim().length < 100) return null;
  if (report.cohesion === 'coherent') return null;

  const isWarning = report.cohesion === 'fragmented';

  return (
    <aside
      className={`career-narrative-card${isWarning ? ' career-narrative-card--warning' : ''}`}
      aria-label="커리어 내러티브 일관성 분석"
    >
      <header className="career-narrative-card__head">
        <span className="career-narrative-card__eyebrow">내러티브</span>
        <span
          className={`career-narrative-card__badge career-narrative-card__badge--${report.cohesion}`}
        >
          {COHESION_LABEL[report.cohesion]}
        </span>
      </header>

      <p className="career-narrative-card__hint">{report.suggestion}</p>

      {report.issues.length > 0 && (
        <ul className="career-narrative-card__issues" aria-label="감지된 내러티브 문제">
          {report.issues.map((issue, i) => (
            <li key={i} className="career-narrative-card__issue">
              <span className="career-narrative-card__issue-tag">{ISSUE_LABEL[issue.type]}</span>
              <span className="career-narrative-card__issue-evidence">{issue.evidence}</span>
            </li>
          ))}
        </ul>
      )}

      {report.positives.length > 0 && (
        <ul className="career-narrative-card__positives" aria-label="강점 요소">
          {report.positives.map((p, i) => (
            <li key={i} className="career-narrative-card__positive">
              ✓ {p}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
