import { useMemo } from 'react'

import { checkResumeFormattingConsistency } from '@/lib/resumeFormattingConsistencyChecker'

interface Props {
  text: string
}

const ISSUE_LABEL: Record<string, string> = {
  mixed_date_formats: '날짜 형식 혼용',
  mixed_bullet_styles: '불릿 기호 혼용',
  mixed_sentence_endings: '마침표 비일관',
  mixed_number_formats: '숫자 표기 혼용',
}

const CONSISTENCY_LABEL: Record<string, string> = {
  consistent: '일관됨',
  minor_issues: '소폭 불일치',
  inconsistent: '불일치 다수',
}

export default function ResumeFormattingConsistencyPanel({ text }: Props) {
  const report = useMemo(() => checkResumeFormattingConsistency(text), [text])

  if (report.consistency === 'consistent') return null
  if (text.trim().length < 80) return null

  const isWarn = report.consistency === 'inconsistent'

  return (
    <aside
      className={`fmt-consistency-card${isWarn ? ' fmt-consistency-card--warn' : ''}`}
      aria-label="포맷 일관성 분석"
    >
      <header className="fmt-consistency-card__head">
        <span className="fmt-consistency-card__eyebrow">포맷 일관성</span>
        <span
          className={`fmt-consistency-card__badge fmt-consistency-card__badge--${report.consistency}`}
        >
          {CONSISTENCY_LABEL[report.consistency]}
        </span>
        <span className="fmt-consistency-card__count">{report.issues.length}건</span>
      </header>

      <p className="fmt-consistency-card__hint">{report.summary}</p>

      <div className="fmt-consistency-card__issues" aria-label="감지된 불일치">
        {report.issues.map((issue, i) => (
          <div key={i} className="fmt-consistency-card__issue-row">
            <span className="fmt-consistency-card__issue-type">
              {ISSUE_LABEL[issue.type] ?? issue.type}
            </span>
            <span className="fmt-consistency-card__issue-detail">{issue.detail}</span>
          </div>
        ))}
      </div>

      {report.fixGuide.length > 0 && (
        <ul className="fmt-consistency-card__guide" aria-label="수정 가이드">
          {report.fixGuide.map((g, i) => (
            <li key={i} className="fmt-consistency-card__guide-item">
              → {g}
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
