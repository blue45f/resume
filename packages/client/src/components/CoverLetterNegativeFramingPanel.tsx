import { useMemo } from 'react'

import type { NegativeFramingType } from '@/lib/coverLetterNegativeFramingDetector'

import { detectCoverLetterNegativeFraming } from '@/lib/coverLetterNegativeFramingDetector'

interface Props {
  text: string
}

const TYPE_LABEL: Record<NegativeFramingType, string> = {
  ex_employer_badmouth: '전 직장 비방',
  colleague_complaint: '상사·동료 불만',
  negative_resignation: '부정적 퇴사 사유',
  blame_excuse: '남·환경 탓',
}

const GRADE_LABEL: Record<string, string> = {
  minor: '주의',
  concerning: '개선 권장',
}

export default function CoverLetterNegativeFramingPanel({ text }: Props) {
  const report = useMemo(() => detectCoverLetterNegativeFraming(text), [text])

  if (text.trim().length < 50) return null
  if (report.grade === 'clean') return null

  const isConcerning = report.grade === 'concerning'

  return (
    <aside
      className={`cl-neg-card${isConcerning ? ' cl-neg-card--concerning' : ''}`}
      aria-label="부정 프레이밍 분석"
    >
      <header className="cl-neg-card__head">
        <span className="cl-neg-card__eyebrow">표현 톤</span>
        <span className={`cl-neg-card__badge cl-neg-card__badge--${report.grade}`}>
          {GRADE_LABEL[report.grade]}
        </span>
      </header>

      <div className="cl-neg-card__chips" aria-label="감지된 표현 유형">
        {report.matches.map((m, i) => (
          <span key={`${m.type}-${i}`} className="cl-neg-card__chip">
            {TYPE_LABEL[m.type]}
          </span>
        ))}
      </div>

      <p className="cl-neg-card__hint">{report.summary}</p>

      {report.suggestions.length > 0 && (
        <ul className="cl-neg-card__recs" aria-label="개선 제안">
          {report.suggestions.slice(0, 4).map((s, i) => (
            <li key={i} className="cl-neg-card__rec">
              → {s}
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
