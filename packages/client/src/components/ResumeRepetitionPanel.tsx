import { useMemo } from 'react'

import {
  analyzeLexicalDiversity,
  analyzeRedundancy,
  detectRepeatedPhrases,
  detectDuplicateSentences,
} from '@/lib/repetitionAnalyzers'

interface Props {
  text: string
}

export default function ResumeRepetitionPanel({ text }: Props) {
  const diversity = useMemo(() => analyzeLexicalDiversity(text), [text])
  const redundancy = useMemo(() => analyzeRedundancy(text), [text])
  const phrases = useMemo(() => detectRepeatedPhrases(text), [text])
  const duplicates = useMemo(() => detectDuplicateSentences(text), [text])

  const hasIssue =
    diversity.level === 'low' ||
    redundancy.hits.length > 0 ||
    phrases.length > 0 ||
    duplicates.length > 0

  if (!hasIssue) return null

  const ttrPercent = Math.round(diversity.ttr * 100)
  const ttrFill = Math.max(0.04, diversity.ttr)

  return (
    <aside className="rep-card" aria-label="반복 표현 분석">
      <header className="rep-card__head">
        <span className="rep-card__eyebrow">repetition</span>
        <span className="rep-card__title">반복 표현 분석</span>
      </header>

      {/* Lexical diversity meter */}
      <div className="rep-card__section">
        <div className="rep-card__metric-row">
          <span className="rep-card__metric-label">어휘 다양성</span>
          <span className={`rep-card__metric-value rep-card__metric-value--${diversity.level}`}>
            {ttrPercent}%
          </span>
        </div>
        <div
          className="rep-card__meter"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={ttrPercent}
          aria-label="어휘 다양성 지수"
        >
          <span
            className={`rep-card__meter-fill rep-card__meter-fill--${diversity.level}`}
            style={{ ['--rep-fill' as never]: String(ttrFill) }}
          />
        </div>
        <p className="rep-card__hint">{diversity.suggestion}</p>
      </div>

      {/* Near-repeat words */}
      {redundancy.hits.length > 0 && (
        <div className="rep-card__section">
          <p className="rep-card__section-label">근접 반복어</p>
          <div className="rep-card__chips">
            {redundancy.hits.slice(0, 5).map((h, i) => (
              <span key={i} className="rep-card__chip" title={`${h.distance}자 간격`}>
                {h.word}
              </span>
            ))}
          </div>
          {redundancy.worst && <p className="rep-card__hint">{redundancy.suggestion}</p>}
        </div>
      )}

      {/* Repeated phrases */}
      {phrases.length > 0 && (
        <div className="rep-card__section">
          <p className="rep-card__section-label">반복 구절</p>
          <div className="rep-card__chips">
            {phrases.slice(0, 5).map((p) => (
              <span key={p.phrase} className="rep-card__chip rep-card__chip--phrase">
                {p.phrase}
                <span className="rep-card__chip-count">×{p.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Duplicate sentences */}
      {duplicates.length > 0 && (
        <div className="rep-card__section rep-card__section--warn">
          <p className="rep-card__section-label">중복 문장 ({duplicates.length}건)</p>
          {duplicates.slice(0, 2).map((d, i) => (
            <p key={i} className="rep-card__dup-sentence">
              "{d.first.original.slice(0, 60)}
              {d.first.original.length > 60 ? '…' : ''}"
            </p>
          ))}
        </div>
      )}
    </aside>
  )
}
