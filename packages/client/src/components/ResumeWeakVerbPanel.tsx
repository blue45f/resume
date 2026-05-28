import { useMemo } from 'react';
import { suggestVerbReplacements, suggestSynonymsForOveruse } from '@/lib/wordSuggestions';

interface Props {
  text: string;
}

export default function ResumeWeakVerbPanel({ text }: Props) {
  const verbs = useMemo(() => {
    const hits = suggestVerbReplacements(text);
    const seen = new Set<string>();
    return hits
      .filter((h) => {
        if (seen.has(h.weak)) return false;
        seen.add(h.weak);
        return true;
      })
      .slice(0, 8);
  }, [text]);

  const overused = useMemo(() => suggestSynonymsForOveruse(text, 3).slice(0, 6), [text]);

  if (verbs.length === 0 && overused.length === 0) return null;

  return (
    <aside className="weak-verb-card" aria-label="단어 개선 제안">
      <header className="weak-verb-card__head">
        <span className="weak-verb-card__eyebrow">word suggestions</span>
        <span className="weak-verb-card__title">단어·동사 개선 제안</span>
        {verbs.length > 0 && (
          <span className="weak-verb-card__badge">{verbs.length}개 약한 동사</span>
        )}
      </header>

      {verbs.length > 0 && (
        <section aria-label="약한 동사 교체">
          <p className="weak-verb-card__section-label">약한 동사 → 강한 대안</p>
          <div className="weak-verb-card__rows">
            {verbs.map((hit) => (
              <div key={hit.weak} className="weak-verb-card__row">
                <span className="weak-verb-card__weak">{hit.weak}</span>
                <span className="weak-verb-card__arrow" aria-hidden="true">
                  →
                </span>
                <span className="weak-verb-card__alts">
                  {hit.alternatives.map((alt) => (
                    <span key={alt} className="weak-verb-card__alt">
                      {alt}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {overused.length > 0 && (
        <section aria-label="과용 단어 동의어">
          <p className="weak-verb-card__section-label">과용 단어 교체 제안</p>
          <div className="weak-verb-card__rows">
            {overused.map((item) => (
              <div key={item.word} className="weak-verb-card__row">
                <span className="weak-verb-card__weak">
                  {item.word}
                  <span className="weak-verb-card__count">×{item.count}</span>
                </span>
                <span className="weak-verb-card__arrow" aria-hidden="true">
                  →
                </span>
                <span className="weak-verb-card__alts">
                  {item.alternatives.map((alt) => (
                    <span key={alt} className="weak-verb-card__alt">
                      {alt}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </aside>
  );
}
