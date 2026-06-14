import { useMemo } from 'react'

import { checkCoverLetterFirstPerson } from '@/lib/coverLetterFirstPersonChecker'

interface Props {
  text: string
}

const GRADE_LABEL: Record<string, string> = {
  varied: '다양함',
  adequate: '적절',
  repetitive: '반복적',
  monotone: '단조로움',
}

export default function CoverLetterFirstPersonPanel({ text }: Props) {
  const report = useMemo(() => checkCoverLetterFirstPerson(text), [text])

  if (report.grade === 'varied' || report.grade === 'adequate') return null
  if (text.trim().length < 80) return null

  const isMonotone = report.grade === 'monotone'

  return (
    <aside
      className={`cl-1p-card${isMonotone ? ' cl-1p-card--monotone' : ''}`}
      aria-label="1인칭 사용 분석"
    >
      <header className="cl-1p-card__head">
        <span className="cl-1p-card__eyebrow">문장 시작</span>
        <span className={`cl-1p-card__badge cl-1p-card__badge--${report.grade}`}>
          {GRADE_LABEL[report.grade]}
        </span>
        <span className="cl-1p-card__ratio">{report.firstPersonRatio}%</span>
      </header>

      <p className="cl-1p-card__hint">{report.summary}</p>

      {report.alternatives.length > 0 && (
        <div className="cl-1p-card__alts" aria-label="다양한 문장 시작 예시">
          <p className="cl-1p-card__alts-label">다양한 시작 예시:</p>
          <ul className="cl-1p-card__alt-list">
            {report.alternatives.slice(0, 3).map((alt, i) => (
              <li key={i} className="cl-1p-card__alt">
                → {alt}
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}
