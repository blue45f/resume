import { useMemo } from 'react'

import { detectCliches, detectJargon, detectExaggeration } from '@/lib/languageRisks'

interface Props {
  text: string
}

export default function ResumeLanguageRisksPanel({ text }: Props) {
  const cliches = useMemo(() => detectCliches(text), [text])
  const jargon = useMemo(() => detectJargon(text), [text])
  const exaggeration = useMemo(() => detectExaggeration(text), [text])

  const hasIssue =
    cliches.level !== 'none' || jargon.level !== 'none' || exaggeration.level !== 'none'

  if (!hasIssue) return null

  const totalIssues = cliches.count + jargon.totalCount + exaggeration.count
  const severity = exaggeration.level === 'many' || cliches.level === 'many' ? 'warning' : 'mild'

  return (
    <aside className={`lang-risk-card lang-risk-card--${severity}`} aria-label="언어 위험 분석">
      <header className="lang-risk-card__head">
        <span className="lang-risk-card__eyebrow">language risks</span>
        <span className="lang-risk-card__title">언어 위험 분석</span>
        <span className="lang-risk-card__badge">{totalIssues}건</span>
      </header>

      {cliches.level !== 'none' && (
        <div className="lang-risk-card__section">
          <p className="lang-risk-card__section-label">상투구 {cliches.count}건</p>
          <p className="lang-risk-card__hint">{cliches.suggestion}</p>
          <div className="lang-risk-card__chips">
            {Array.from(new Set(cliches.hits.map((h) => h.phrase)))
              .slice(0, 5)
              .map((phrase) => (
                <span key={phrase} className="lang-risk-card__chip">
                  {phrase}
                </span>
              ))}
          </div>
        </div>
      )}

      {jargon.level !== 'none' && (
        <div className="lang-risk-card__section">
          <p className="lang-risk-card__section-label">
            자곤 {jargon.distinctCount}종 · {jargon.totalCount}회
          </p>
          <p className="lang-risk-card__hint">{jargon.suggestion}</p>
          <div className="lang-risk-card__chips">
            {jargon.hits.slice(0, 6).map((h) => (
              <span key={h.word} className="lang-risk-card__chip lang-risk-card__chip--jargon">
                {h.word}
                <span className="lang-risk-card__chip-count">×{h.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {exaggeration.level !== 'none' && (
        <div className="lang-risk-card__section lang-risk-card__section--exag">
          <p className="lang-risk-card__section-label">과장 {exaggeration.count}건</p>
          <p className="lang-risk-card__hint">{exaggeration.suggestion}</p>
          <div className="lang-risk-card__chips">
            {Array.from(new Set(exaggeration.hits.map((h) => h.phrase)))
              .slice(0, 4)
              .map((phrase) => (
                <span key={phrase} className="lang-risk-card__chip lang-risk-card__chip--exag">
                  {phrase}
                </span>
              ))}
          </div>
        </div>
      )}
    </aside>
  )
}
