import { useMemo } from 'react'

import type { ContactField } from '@/lib/resumeContactInfoChecker'

import { checkResumeContactInfo } from '@/lib/resumeContactInfoChecker'

interface Props {
  text: string
}

const FIELD_LABEL: Record<ContactField, string> = {
  phone: '전화',
  email: '이메일',
  linkedin: 'LinkedIn',
  github: 'GitHub',
  location: '지역',
  portfolio: '포트폴리오',
}

const COMPLETENESS_LABEL: Record<string, string> = {
  complete: '완성',
  good: '양호',
  partial: '부분',
  minimal: '미흡',
}

export default function ResumeContactInfoPanel({ text }: Props) {
  const report = useMemo(() => checkResumeContactInfo(text), [text])

  if (report.completeness === 'complete') return null
  if (text.trim().length < 20) return null

  const isMinimal = report.completeness === 'minimal' || report.completeness === 'partial'

  const ALL_FIELDS: ContactField[] = ['phone', 'email', 'linkedin', 'github', 'location']

  return (
    <aside
      className={`contact-info-card${isMinimal ? ' contact-info-card--warn' : ''}`}
      aria-label="연락처 완성도 분석"
    >
      <header className="contact-info-card__head">
        <span className="contact-info-card__eyebrow">연락처</span>
        <span
          className={`contact-info-card__badge contact-info-card__badge--${report.completeness}`}
        >
          {COMPLETENESS_LABEL[report.completeness]}
        </span>
      </header>

      <div className="contact-info-card__fields" aria-label="연락처 항목 현황">
        {ALL_FIELDS.map((field) => {
          const found = report.foundFields.includes(field)
          return (
            <span
              key={field}
              className={`contact-info-card__field contact-info-card__field--${found ? 'found' : 'missing'}`}
            >
              {FIELD_LABEL[field]}
            </span>
          )
        })}
      </div>

      <p className="contact-info-card__hint">{report.summary}</p>

      {report.recommendations.length > 0 && (
        <ul className="contact-info-card__recs" aria-label="추가 권장사항">
          {report.recommendations.slice(0, 3).map((rec, i) => (
            <li key={i} className="contact-info-card__rec">
              → {rec}
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
