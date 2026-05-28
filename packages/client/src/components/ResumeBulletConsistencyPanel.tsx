import { useMemo } from 'react';
import {
  analyzeParallelism,
  analyzeBulletMarkerConsistency,
  analyzePunctuationBalance,
} from '@/lib/bulletStructure';

interface Props {
  text: string;
}

export default function ResumeBulletConsistencyPanel({ text }: Props) {
  const parallelism = useMemo(() => analyzeParallelism(text), [text]);
  const markerResult = useMemo(() => analyzeBulletMarkerConsistency(text), [text]);
  const punctuation = useMemo(() => analyzePunctuationBalance(text), [text]);

  const hasBullets = parallelism.lines >= 3 || markerResult.markers.length > 0;
  const hasPunctuationIssue =
    punctuation.total > 0 &&
    punctuation.suggestion !== '문장부호가 감지되지 않았습니다.' &&
    (punctuation.exclamations > 0 || punctuation.questions > punctuation.periods * 0.2);
  if (!hasBullets && !hasPunctuationIssue) return null;

  const parallelScore = Math.round(parallelism.consistency * 0.5);
  const markerScore =
    markerResult.markers.length === 0
      ? 25
      : markerResult.consistent
        ? 50
        : Math.max(10, Math.round((1 / markerResult.distinct) * 50));
  const score = parallelScore + markerScore;
  const tone = score >= 80 ? 'good' : score >= 55 ? 'neutral' : 'warning';
  const fill = Math.max(0.04, score / 100);

  return (
    <aside
      className={`bullet-cons-card bullet-cons-card--${tone}`}
      aria-label="이력서 불릿 일관성 분석"
    >
      <header className="bullet-cons-card__head">
        <span className="bullet-cons-card__eyebrow">Bullet consistency</span>
        <span className="bullet-cons-card__label">
          {score >= 80 ? '일관됨' : score >= 55 ? '부분 혼재' : '혼재'} · {score}점
        </span>
      </header>

      <div
        className="bullet-cons-card__meter"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
        aria-label="불릿 일관성 점수"
      >
        <span
          className="bullet-cons-card__meter-fill"
          style={{ ['--bullet-cons-fill' as never]: String(fill) }}
        />
      </div>

      {/* Parallelism section */}
      {parallelism.lines >= 3 && (
        <section className="bullet-cons-card__section" aria-label="종결어미 일관성">
          <h4 className="bullet-cons-card__section-title">종결어미 통일성</h4>
          <ul className="bullet-cons-card__style-bars" aria-label="어미 분포">
            {parallelism.styles.slice(0, 4).map((s) => (
              <li key={s.style} className="bullet-cons-card__style-bar-row">
                <span className="bullet-cons-card__style-name">{s.style}</span>
                <span
                  className="bullet-cons-card__style-bar"
                  style={{ ['--bar-w' as never]: `${s.percent}%` }}
                  aria-hidden="true"
                />
                <span className="bullet-cons-card__style-pct">{Math.round(s.percent)}%</span>
              </li>
            ))}
          </ul>
          <p className="bullet-cons-card__suggestion">{parallelism.suggestion}</p>
        </section>
      )}

      {/* Marker section */}
      {markerResult.markers.length > 0 && (
        <section className="bullet-cons-card__section" aria-label="불릿 기호 일관성">
          <h4 className="bullet-cons-card__section-title">불릿 기호</h4>
          <div className="bullet-cons-card__markers">
            {markerResult.markers.map((m) => (
              <span
                key={m.marker}
                className={`bullet-cons-card__marker-chip${m.marker === markerResult.dominant ? ' bullet-cons-card__marker-chip--dominant' : ''}`}
              >
                <code>{m.marker}</code>
                <span>{m.percent}%</span>
              </span>
            ))}
          </div>
          <p className="bullet-cons-card__suggestion">{markerResult.suggestion}</p>
        </section>
      )}

      {/* Punctuation section */}
      {hasPunctuationIssue && (
        <section className="bullet-cons-card__section" aria-label="문장부호 분포">
          <h4 className="bullet-cons-card__section-title">문장부호 분포</h4>
          <div className="bullet-cons-card__markers">
            {punctuation.exclamations > 0 && (
              <span className="bullet-cons-card__marker-chip">
                <code>!</code>
                <span>{punctuation.exclamations}개</span>
              </span>
            )}
            {punctuation.questions > 0 && (
              <span className="bullet-cons-card__marker-chip">
                <code>?</code>
                <span>{punctuation.questions}개</span>
              </span>
            )}
          </div>
          <p className="bullet-cons-card__suggestion">{punctuation.suggestion}</p>
        </section>
      )}
    </aside>
  );
}
