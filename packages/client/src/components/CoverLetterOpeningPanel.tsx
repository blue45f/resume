import { useMemo } from 'react';
import { analyzeCoverLetterOpening } from '@/lib/coverLetterOpeningAnalyzer';

interface Props {
  text: string;
}

export default function CoverLetterOpeningPanel({ text }: Props) {
  const report = useMemo(() => analyzeCoverLetterOpening(text), [text]);

  if (report.strength === 'strong') return null;
  if (!report.firstSentence || text.trim().length < 30) return null;

  const isWarning = report.strength === 'weak';

  return (
    <aside
      className={`cl-opening-card${isWarning ? ' cl-opening-card--warning' : ''}`}
      aria-label="자기소개서 첫 문장 강도 분석"
    >
      <header className="cl-opening-card__head">
        <span className="cl-opening-card__eyebrow">Opening hook</span>
        <span className={`cl-opening-card__badge cl-opening-card__badge--${report.strength}`}>
          {report.strength === 'weak' ? '약함' : '보통'}
        </span>
      </header>

      <blockquote className="cl-opening-card__quote">{report.firstSentence}</blockquote>

      {report.genericPhrases.length > 0 && (
        <ul className="cl-opening-card__flags" aria-label="주의 표현">
          {report.genericPhrases.map((phrase, i) => (
            <li key={i} className="cl-opening-card__flag">
              ▲ {phrase}
            </li>
          ))}
        </ul>
      )}

      <p className="cl-opening-card__hint">{report.suggestion}</p>
    </aside>
  );
}
