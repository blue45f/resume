import { useMemo } from 'react'

import { detectInformalLanguage } from '@/lib/informalLanguage'

interface Props {
  text: string
}

const CATEGORY_LABEL: Record<string, string> = {
  emoticon: '이모지',
  chosung: '초성체',
  slang: '은어',
  casual: '구어체',
  exclaim: '반복 부호',
}

export default function CoverLetterInformalPanel({ text }: Props) {
  const analysis = useMemo(() => detectInformalLanguage(text), [text])

  if (analysis.level === 'none') return null

  const uniqueHits = Array.from(
    analysis.hits
      .reduce((m, h) => {
        const key = h.phrase
        if (!m.has(key)) m.set(key, h)
        return m
      }, new Map<string, (typeof analysis.hits)[0]>())
      .values()
  ).slice(0, 10)

  return (
    <aside
      className={`cl-informal-card${analysis.level === 'many' ? ' cl-informal-card--many' : ''}`}
      aria-label="비격식 표현 검출"
    >
      <header className="cl-informal-card__head">
        <span className="cl-informal-card__eyebrow">informal language</span>
        <span className="cl-informal-card__title">비격식 표현 감지</span>
        <span className="cl-informal-card__badge">{analysis.count}건</span>
      </header>

      <p className="cl-informal-card__suggestion">{analysis.suggestion}</p>

      <div className="cl-informal-card__hits" aria-label="감지된 표현">
        {uniqueHits.map((h, i) => (
          <span key={i} className="cl-informal-card__hit" title={h.reason}>
            {h.phrase}
            <span style={{ marginLeft: '0.25rem', opacity: 0.6, fontSize: '0.6875rem' }}>
              ({CATEGORY_LABEL[h.category] ?? h.category})
            </span>
          </span>
        ))}
      </div>

      {uniqueHits[0] && <p className="cl-informal-card__reason">{uniqueHits[0].reason}</p>}
    </aside>
  )
}
