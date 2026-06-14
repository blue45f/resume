import { useMemo } from 'react'

import type { StarElement } from '@/lib/coverLetterStarPatternChecker'

import { checkCoverLetterStarPattern } from '@/lib/coverLetterStarPatternChecker'

interface Props {
  text: string
}

const ELEMENT_LABEL: Record<StarElement, string> = {
  situation: 'S 배경',
  task: 'T 역할',
  action: 'A 행동',
  result: 'R 결과',
}

const GRADE_LABEL: Record<string, string> = {
  strong: 'STAR 완성',
  partial: '부분 적용',
  weak: '미흡',
  absent: '없음',
}

export default function CoverLetterStarPatternPanel({ text }: Props) {
  const report = useMemo(() => checkCoverLetterStarPattern(text), [text])

  if (report.grade === 'strong') return null
  if (text.trim().length < 60) return null

  const isAbsent = report.grade === 'absent' || report.grade === 'weak'

  return (
    <aside
      className={`cl-star-card${isAbsent ? ' cl-star-card--weak' : ''}`}
      aria-label="STAR 구조 분석"
    >
      <header className="cl-star-card__head">
        <span className="cl-star-card__eyebrow">STAR 구조</span>
        <span className={`cl-star-card__badge cl-star-card__badge--${report.grade}`}>
          {GRADE_LABEL[report.grade]}
        </span>
      </header>

      <div className="cl-star-card__elements" aria-label="STAR 요소 현황">
        {(['situation', 'task', 'action', 'result'] as StarElement[]).map((el) => {
          const found = report.foundElements.includes(el)
          return (
            <span
              key={el}
              className={`cl-star-card__elem cl-star-card__elem--${found ? 'found' : 'missing'}`}
            >
              {ELEMENT_LABEL[el]}
            </span>
          )
        })}
      </div>

      <p className="cl-star-card__hint">{report.summary}</p>

      {report.tips.length > 0 && (
        <ul className="cl-star-card__tips" aria-label="작성 팁">
          {report.tips.map((tip, i) => (
            <li key={i} className="cl-star-card__tip">
              → {tip}
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
