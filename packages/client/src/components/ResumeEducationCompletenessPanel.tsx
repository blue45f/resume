import { useMemo } from 'react'

import type { EducationField } from '@/lib/resumeEducationCompletenessChecker'

import { checkResumeEducationCompleteness } from '@/lib/resumeEducationCompletenessChecker'

interface Props {
  text: string
}

const FIELD_LABEL: Record<EducationField, string> = {
  school: '학교',
  degree: '학위',
  major: '전공',
  graduation_date: '졸업시기',
  gpa: '학점',
}

const COMPLETENESS_LABEL: Record<string, string> = {
  complete: '완성',
  good: '양호',
  partial: '부분',
  minimal: '미흡',
  absent: '없음',
}

const ALL_FIELDS: EducationField[] = ['school', 'degree', 'major', 'graduation_date', 'gpa']

export default function ResumeEducationCompletenessPanel({ text }: Props) {
  const report = useMemo(() => checkResumeEducationCompleteness(text), [text])

  if (report.completeness === 'complete') return null
  if (text.trim().length < 20) return null

  const isWarn = report.completeness === 'minimal' || report.completeness === 'absent'

  return (
    <aside className={`edu-card${isWarn ? ' edu-card--warn' : ''}`} aria-label="학력 완성도 분석">
      <header className="edu-card__head">
        <span className="edu-card__eyebrow">학력</span>
        <span className={`edu-card__badge edu-card__badge--${report.completeness}`}>
          {COMPLETENESS_LABEL[report.completeness]}
        </span>
      </header>

      <div className="edu-card__fields" aria-label="학력 항목 현황">
        {ALL_FIELDS.map((field) => {
          const found = report.fields.find((f) => f.field === field)?.present ?? false
          return (
            <span
              key={field}
              className={`edu-card__field edu-card__field--${found ? 'found' : 'missing'}`}
            >
              {FIELD_LABEL[field]}
            </span>
          )
        })}
      </div>

      <p className="edu-card__hint">{report.summary}</p>

      {report.suggestions.length > 0 && (
        <ul className="edu-card__recs" aria-label="학력 보완 권장사항">
          {report.suggestions.slice(0, 3).map((rec, i) => (
            <li key={i} className="edu-card__rec">
              → {rec}
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
