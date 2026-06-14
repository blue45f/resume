import { useMemo } from 'react'

import type { DisclosureCategory } from '@/lib/resumePersonalInfoDisclosureChecker'

import { checkResumePersonalInfoDisclosure } from '@/lib/resumePersonalInfoDisclosureChecker'

interface Props {
  text: string
}

const CATEGORY_LABEL: Record<DisclosureCategory, string> = {
  resident_id: '주민등록번호',
  family_info: '가족관계',
  financial: '재산/소득',
  marital: '결혼 여부',
  physical: '신체 정보',
  origin: '본적/출신지',
  religion: '종교',
  photo: '증명사진',
}

const GRADE_LABEL: Record<string, string> = {
  caution: '확인 필요',
  risky: '삭제 권장',
}

export default function ResumePersonalInfoDisclosurePanel({ text }: Props) {
  const report = useMemo(() => checkResumePersonalInfoDisclosure(text), [text])

  if (text.trim().length < 20) return null
  if (report.grade === 'clean') return null

  const isRisky = report.grade === 'risky'

  return (
    <aside
      className={`pii-card${isRisky ? ' pii-card--risky' : ''}`}
      aria-label="개인정보 과다 기재 점검"
    >
      <header className="pii-card__head">
        <span className="pii-card__eyebrow">개인정보 점검</span>
        <span className={`pii-card__badge pii-card__badge--${report.grade}`}>
          {GRADE_LABEL[report.grade]}
        </span>
      </header>

      <div className="pii-card__chips" aria-label="감지된 항목">
        {report.findings.map((f, i) => (
          <span
            key={`${f.category}-${i}`}
            className={`pii-card__chip pii-card__chip--${f.severity}`}
          >
            {CATEGORY_LABEL[f.category]}
          </span>
        ))}
      </div>

      <p className="pii-card__hint">{report.summary}</p>

      {report.recommendations.length > 0 && (
        <ul className="pii-card__recs" aria-label="권장사항">
          {report.recommendations.slice(0, 4).map((rec, i) => (
            <li key={i} className="pii-card__rec">
              → {rec}
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
