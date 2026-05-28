import { useMemo } from 'react';
import { detectCoverLetterEndingMonotony } from '@/lib/coverLetterEndingMonotonyDetector';

interface Props {
  text: string;
}

const GRADE_LABEL: Record<string, string> = {
  varied: '다양',
  adequate: '보통',
  monotonous: '단조',
};

export default function CoverLetterEndingMonotonyPanel({ text }: Props) {
  const report = useMemo(() => detectCoverLetterEndingMonotony(text), [text]);

  if (text.trim().length < 80) return null;
  if (report.sentenceCount < 4) return null;
  if (report.grade === 'varied') return null;

  const isWarning = report.grade === 'monotonous';

  return (
    <aside
      className={`cl-ending-card${isWarning ? ' cl-ending-card--warning' : ''}`}
      aria-label="문장 어미 단조성 분석"
    >
      <header className="cl-ending-card__head">
        <span className="cl-ending-card__eyebrow">문장 어미</span>
        <span className={`cl-ending-card__badge cl-ending-card__badge--${report.grade}`}>
          {GRADE_LABEL[report.grade]}
        </span>
      </header>

      <p className="cl-ending-card__hint">{report.suggestion}</p>

      {report.dominantEnding && (
        <div className="cl-ending-card__stat">
          <span className="cl-ending-card__stat-label">주요 어미</span>
          <span className="cl-ending-card__stat-value">
            "{report.dominantEnding}" × {report.dominantEndingCount}회
          </span>
          <span className="cl-ending-card__stat-sub">(전체 {report.sentenceCount}문장 중)</span>
        </div>
      )}

      {report.runs.length > 0 && (
        <ul className="cl-ending-card__runs" aria-label="연속 반복 구간">
          {report.runs.map((run, i) => (
            <li key={i} className="cl-ending-card__run">
              <span className="cl-ending-card__run-count">연속 {run.count}회</span>
              <span className="cl-ending-card__run-ending">"{run.ending}"</span>
              {run.samples[0] && (
                <span className="cl-ending-card__run-sample">…{run.samples[0]}…</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
