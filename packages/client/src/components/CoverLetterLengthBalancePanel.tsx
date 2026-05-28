import { useMemo } from 'react';
import {
  analyzeCoverLetterLengthBalance,
  type LengthGrade,
} from '@/lib/coverLetterLengthBalanceAnalyzer';

interface Props {
  text: string;
}

const GRADE_LABEL: Record<LengthGrade, string> = {
  optimal: '적정',
  acceptable: '양호',
  warning: '주의',
  poor: '개선 필요',
};

export default function CoverLetterLengthBalancePanel({ text }: Props) {
  const report = useMemo(() => analyzeCoverLetterLengthBalance(text), [text]);

  if (report.grade === 'optimal') return null;
  if (report.charCount === 0) return null;

  const isPoor = report.grade === 'poor';
  const visibleSuggestions = report.suggestions.slice(0, 3);

  return (
    <aside
      className={`cl-length-card${isPoor ? ' cl-length-card--poor' : ''}`}
      aria-label="자기소개서 길이·구성 분석"
    >
      <header className="cl-length-card__head">
        <span className="cl-length-card__eyebrow">길이·구성</span>
        <span className={`cl-length-card__badge cl-length-card__badge--${report.grade}`}>
          {GRADE_LABEL[report.grade]}
        </span>
        <span className="cl-length-card__stat">
          {report.charCount.toLocaleString()}자 · {report.paragraphCount}문단
        </span>
      </header>

      <p className="cl-length-card__hint">{report.summary}</p>

      {visibleSuggestions.length > 0 && (
        <ul className="cl-length-card__suggestions" aria-label="개선 제안">
          {visibleSuggestions.map((s, i) => (
            <li key={i} className="cl-length-card__suggestion">
              → {s}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
