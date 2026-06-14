import { useMemo } from 'react'

import type { CoverLetterBlock } from '@/lib/coverLetterCoverageChecker'

import {
  checkCoverLetterCoverage,
  COVER_LETTER_BLOCK_LABEL,
} from '@/lib/coverLetterCoverageChecker'

interface Props {
  text: string
}

const GRADE_LABEL: Record<string, string> = {
  good: '일부 누락',
  partial: '구성 부족',
  sparse: '구성 부실',
}

const ALL_BLOCKS: CoverLetterBlock[] = ['motivation', 'competency', 'experience', 'aspiration']

export default function CoverLetterCoveragePanel({ text }: Props) {
  const report = useMemo(() => checkCoverLetterCoverage(text), [text])

  if (text.trim().length < 80) return null
  if (report.grade === 'complete') return null

  const isWarn = report.grade === 'partial' || report.grade === 'sparse'

  return (
    <aside
      className={`cl-cov-card${isWarn ? ' cl-cov-card--warn' : ''}`}
      aria-label="자기소개서 구성 커버리지 분석"
    >
      <header className="cl-cov-card__head">
        <span className="cl-cov-card__eyebrow">구성 커버리지</span>
        <span className={`cl-cov-card__badge cl-cov-card__badge--${report.grade}`}>
          {GRADE_LABEL[report.grade]}
        </span>
        <span className="cl-cov-card__meta">{report.presentCount}/4 블록</span>
      </header>

      <div className="cl-cov-card__blocks" aria-label="내용 블록 현황">
        {ALL_BLOCKS.map((block) => {
          const present = report.presentBlocks.includes(block)
          return (
            <span
              key={block}
              className={`cl-cov-card__block cl-cov-card__block--${present ? 'present' : 'missing'}`}
            >
              {COVER_LETTER_BLOCK_LABEL[block]}
            </span>
          )
        })}
      </div>

      <p className="cl-cov-card__hint">{report.summary}</p>

      {report.suggestions.length > 0 && (
        <ul className="cl-cov-card__recs" aria-label="구성 보완 권장사항">
          {report.suggestions.slice(0, 3).map((s, i) => (
            <li key={i} className="cl-cov-card__rec">
              → {s}
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
