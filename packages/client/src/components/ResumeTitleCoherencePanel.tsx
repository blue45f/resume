import { useMemo } from 'react';
import { analyzeResumeTitleCoherence } from '@/lib/resumeTitleCoherence';

interface Props {
  title: string;
  text: string;
}

export default function ResumeTitleCoherencePanel({ title, text }: Props) {
  const analysis = useMemo(
    () => analyzeResumeTitleCoherence({ title, experienceText: text }),
    [title, text],
  );

  // Hide when we have nothing meaningful to report (no title and no usable experience).
  if (!title?.trim() && analysis.experienceYears === 0) return null;

  return (
    <aside
      className={`title-coherence-card title-coherence-card--${analysis.tone}`}
      aria-label="이력서 타이틀 정합성"
    >
      <header className="title-coherence-card__head">
        <span className="title-coherence-card__eyebrow">Title coherence</span>
        <span className="title-coherence-card__label">{analysis.label}</span>
      </header>

      <p className="title-coherence-card__detail">{analysis.detail}</p>

      <dl className="title-coherence-card__grid">
        <div className="title-coherence-card__cell">
          <dt>타이틀</dt>
          <dd>{title?.trim() || '(미입력)'}</dd>
        </div>
        <div className="title-coherence-card__cell">
          <dt>경력</dt>
          <dd>
            {analysis.experienceYears}
            <small> 년</small>
          </dd>
        </div>
        <div className="title-coherence-card__cell">
          <dt>직무</dt>
          <dd>
            {analysis.experienceRoleFamily === 'unknown' ? '미지정' : analysis.experienceRoleFamily}
          </dd>
        </div>
      </dl>

      <p className="title-coherence-card__suggestion">→ {analysis.suggestion}</p>
    </aside>
  );
}
