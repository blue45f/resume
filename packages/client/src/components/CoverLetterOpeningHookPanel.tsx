import { useMemo } from 'react'

import { analyzeCoverLetterOpeningHook } from '@/lib/coverLetterOpeningHookAnalyzer'

interface Props {
  text: string
}

const GRADE_LABEL: Record<string, string> = {
  strong: '강한 훅',
  adequate: '무난',
  weak: '약함',
  generic: '천편일률',
}

export default function CoverLetterOpeningHookPanel({ text }: Props) {
  const report = useMemo(() => analyzeCoverLetterOpeningHook(text), [text])

  if (text.trim().length < 30) return null
  if (report.grade === 'strong') return null

  const isWarning = report.grade === 'generic'

  return (
    <aside
      className={`cl-hook-card${isWarning ? ' cl-hook-card--warning' : ''}`}
      aria-label="도입부 훅 강도 분석"
    >
      <header className="cl-hook-card__head">
        <span className="cl-hook-card__eyebrow">도입부 훅</span>
        <span className={`cl-hook-card__badge cl-hook-card__badge--${report.grade}`}>
          {GRADE_LABEL[report.grade]}
        </span>
      </header>

      <p className="cl-hook-card__hint">{report.summary}</p>

      {report.genericSignals.length > 0 && (
        <div className="cl-hook-card__chips" aria-label="클리셰 감지">
          {report.genericSignals.map((sig, i) => (
            <span key={i} className="cl-hook-card__chip cl-hook-card__chip--warn">
              {sig.excerpt.slice(0, 18)}
            </span>
          ))}
        </div>
      )}

      {report.suggestions.length > 0 && (
        <ul className="cl-hook-card__suggestions" aria-label="개선 제안">
          {report.suggestions.map((s, i) => (
            <li key={i} className="cl-hook-card__suggestion">
              → {s}
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
