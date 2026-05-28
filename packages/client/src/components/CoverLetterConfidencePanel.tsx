import { useMemo } from 'react';
import { detectSelfDeprecation, analyzeCallToAction } from '@/lib/coverLetterHelpers';

interface Props {
  text: string;
}

export default function CoverLetterConfidencePanel({ text }: Props) {
  const selfDep = useMemo(() => detectSelfDeprecation(text), [text]);
  const cta = useMemo(() => analyzeCallToAction(text), [text]);

  const hasSelfDepIssue = selfDep.level !== 'none';
  const hasCtaIssue = !cta.hasCTA && text.trim().length > 80;

  if (!hasSelfDepIssue && !hasCtaIssue) return null;

  const issueCount = [hasSelfDepIssue, hasCtaIssue].filter(Boolean).length;
  const tone = selfDep.level === 'many' ? 'warning' : 'neutral';

  return (
    <aside
      className={`cl-confidence-card cl-confidence-card--${tone}`}
      aria-label="자기소개서 자신감·마무리 분석"
    >
      <header className="cl-confidence-card__head">
        <span className="cl-confidence-card__eyebrow">Confidence &amp; CTA</span>
        <span className="cl-confidence-card__label">
          {issueCount === 0 ? '이상 없음' : `${issueCount}가지 개선점`}
        </span>
      </header>

      {/* Self-deprecation */}
      {hasSelfDepIssue && (
        <section className="cl-confidence-card__section" aria-label="자기비하 표현">
          <h4 className="cl-confidence-card__section-title">겸양 과다</h4>
          <p className="cl-confidence-card__hint">{selfDep.suggestion}</p>
          {selfDep.hits.length > 0 && (
            <ul className="cl-confidence-card__hits" aria-label="자기비하 표현 목록">
              {selfDep.hits.slice(0, 4).map((h, i) => (
                <li key={`${h.phrase}-${i}`} className="cl-confidence-card__hit">
                  <mark className="cl-confidence-card__hit-phrase">{h.phrase}</mark>
                  <span className="cl-confidence-card__hit-reason">{h.reason}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* CTA */}
      {hasCtaIssue && (
        <section className="cl-confidence-card__section" aria-label="마무리 CTA">
          <h4 className="cl-confidence-card__section-title">마무리 CTA 없음</h4>
          <p className="cl-confidence-card__hint">
            마지막 문단에 "함께 성장하겠습니다", "기여하고 싶습니다" 같은 행동 유발 표현을 넣으면
            마무리가 강해집니다.
          </p>
          {cta.lastParagraph && (
            <blockquote className="cl-confidence-card__last-para">
              {cta.lastParagraph.slice(0, 100)}
              {cta.lastParagraph.length > 100 && '…'}
            </blockquote>
          )}
        </section>
      )}
    </aside>
  );
}
