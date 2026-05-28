import { useState, useMemo } from 'react';
import { detectEmptyClaims, analyzeVerbTense } from '@/lib/qualitySignals';

interface Props {
  text: string;
}

export default function ResumeQualitySignalsPanel({ text }: Props) {
  const emptyClaims = useMemo(() => detectEmptyClaims(text), [text]);
  const tense = useMemo(() => analyzeVerbTense(text), [text]);
  const [expanded, setExpanded] = useState(false);

  const hasIssues =
    emptyClaims.level !== 'none' || tense.dominant === 'mixed' || tense.dominant === 'present';
  if (!hasIssues) return null;

  const tenseGood = tense.dominant === 'past' || tense.dominant === 'none';
  const claimsGood = emptyClaims.level === 'none';
  const issueCount = [!tenseGood, !claimsGood].filter(Boolean).length;
  const tone =
    issueCount === 0
      ? 'good'
      : emptyClaims.level === 'many' || tense.dominant === 'mixed'
        ? 'warning'
        : 'neutral';

  const visibleHits = expanded ? emptyClaims.hits : emptyClaims.hits.slice(0, 2);
  const remaining = emptyClaims.hits.length - visibleHits.length;

  return (
    <aside
      className={`quality-signals-card quality-signals-card--${tone}`}
      aria-label="이력서 품질 신호 분석"
    >
      <header className="quality-signals-card__head">
        <span className="quality-signals-card__eyebrow">Quality signals</span>
        <span className="quality-signals-card__label">
          {issueCount === 0 ? '이상 없음' : `${issueCount}가지 개선점`}
        </span>
      </header>

      <ul className="quality-signals-card__checks" aria-label="품질 항목">
        {/* Verb tense */}
        <li
          className={`quality-signals-card__check${tenseGood ? '' : ' quality-signals-card__check--warn'}`}
          aria-label="시제 일관성"
        >
          <span className="quality-signals-card__icon" aria-hidden="true">
            {tenseGood ? '✓' : '▲'}
          </span>
          <div>
            <strong>시제 일관성</strong>
            {tense.total > 0 && (
              <span className="quality-signals-card__meta">
                과거 {tense.past} · 현재 {tense.present} · 미래 {tense.future}
              </span>
            )}
            <p className="quality-signals-card__hint">{tense.suggestion}</p>
          </div>
        </li>

        {/* Empty claims */}
        {emptyClaims.level !== 'none' && (
          <li
            className={`quality-signals-card__check quality-signals-card__check--warn`}
            aria-label="빈 주장"
          >
            <span className="quality-signals-card__icon" aria-hidden="true">
              ▲
            </span>
            <div>
              <strong>빈 주장</strong>
              <span className="quality-signals-card__meta">{emptyClaims.count}건</span>
              <p className="quality-signals-card__hint">{emptyClaims.suggestion}</p>
              {visibleHits.length > 0 && (
                <ul className="quality-signals-card__hits" aria-label="빈 주장 목록">
                  {visibleHits.map((h, i) => (
                    <li key={`${h.phrase}-${i}`} className="quality-signals-card__hit">
                      <mark className="quality-signals-card__hit-phrase">{h.phrase}</mark>
                      <span className="quality-signals-card__hit-reason">{h.reason}</span>
                    </li>
                  ))}
                </ul>
              )}
              {remaining > 0 && (
                <button
                  type="button"
                  className="quality-signals-card__toggle"
                  onClick={() => setExpanded((v) => !v)}
                >
                  {expanded ? '접기' : `+${remaining}개 더 보기`}
                </button>
              )}
            </div>
          </li>
        )}
      </ul>
    </aside>
  );
}
