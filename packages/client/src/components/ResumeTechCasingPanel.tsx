import { useMemo } from 'react'

import { detectInconsistentCasing } from '@/lib/techCasing'

interface Props {
  text: string
}

export default function ResumeTechCasingPanel({ text }: Props) {
  const analysis = useMemo(() => detectInconsistentCasing(text), [text])

  if (analysis.hits.length === 0) return null

  return (
    <aside className="tech-casing-card" aria-label="기술 용어 대소문자 분석">
      <header className="tech-casing-card__head">
        <span className="tech-casing-card__eyebrow">tech casing</span>
        <span className="tech-casing-card__title">기술 용어 표기 불일치</span>
        <span className="tech-casing-card__badge">{analysis.hits.length}건</span>
      </header>

      <p className="tech-casing-card__suggestion">{analysis.suggestion}</p>

      <ul className="tech-casing-card__list" aria-label="표기 불일치 목록">
        {analysis.hits.map((hit) => (
          <li key={hit.canonical} className="tech-casing-card__item">
            <div className="tech-casing-card__term-row">
              <code className="tech-casing-card__canonical">{hit.canonical}</code>
              <span className="tech-casing-card__arrow" aria-hidden="true">
                ←
              </span>
              <div className="tech-casing-card__variants">
                {hit.variants
                  .filter((v) => v.form !== hit.canonical)
                  .map((v) => (
                    <span key={v.form} className="tech-casing-card__variant">
                      {v.form}
                      <span className="tech-casing-card__variant-count">×{v.count}</span>
                    </span>
                  ))}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  )
}
