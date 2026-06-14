import { useMemo } from 'react'

import type { SoftSkillCategory } from '@/lib/resumeSoftSkillEvidenceChecker'

import { checkSoftSkillEvidence } from '@/lib/resumeSoftSkillEvidenceChecker'

interface Props {
  text: string
}

const CATEGORY_LABEL: Record<SoftSkillCategory, string> = {
  communication: '커뮤니케이션',
  teamwork: '협업/팀워크',
  leadership_soft: '주도성/적극성',
  problem_solving: '문제해결',
  responsibility: '책임감',
  adaptability: '적응력',
  creativity: '창의성',
}

const GRADE_LABEL: Record<string, string> = {
  good: '근거 충분',
  mixed: '근거 혼재',
  bare: '근거 미흡',
  none: '해당 없음',
}

export default function ResumeSoftSkillEvidencePanel({ text }: Props) {
  const report = useMemo(() => checkSoftSkillEvidence(text), [text])

  if (text.trim().length < 80) return null
  if (report.grade === 'none' || report.grade === 'good') return null

  const isWarning = report.grade === 'bare'

  return (
    <aside
      className={`softskill-ev-card${isWarning ? ' softskill-ev-card--warning' : ''}`}
      aria-label="소프트 스킬 근거 품질 분석"
    >
      <header className="softskill-ev-card__head">
        <span className="softskill-ev-card__eyebrow">소프트 스킬</span>
        <span className={`softskill-ev-card__badge softskill-ev-card__badge--${report.grade}`}>
          {GRADE_LABEL[report.grade]}
        </span>
      </header>

      <p className="softskill-ev-card__hint">{report.suggestion}</p>

      {report.bareClaims.length > 0 && (
        <section>
          <p className="softskill-ev-card__section-label">근거 없는 선언형 표현</p>
          <ul className="softskill-ev-card__claims" aria-label="근거 미흡 소프트 스킬 표현">
            {report.bareClaims.map((c, i) => (
              <li key={i} className="softskill-ev-card__claim softskill-ev-card__claim--bare">
                <span className="softskill-ev-card__claim-tag">{CATEGORY_LABEL[c.category]}</span>
                <span className="softskill-ev-card__claim-phrase">"{c.phrase}"</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {report.evidencedClaims.length > 0 && (
        <section>
          <p className="softskill-ev-card__section-label">잘 작성된 표현 (참고)</p>
          <ul className="softskill-ev-card__claims" aria-label="근거 충분 소프트 스킬 표현">
            {report.evidencedClaims.map((c, i) => (
              <li key={i} className="softskill-ev-card__claim softskill-ev-card__claim--evidenced">
                <span className="softskill-ev-card__claim-tag">{CATEGORY_LABEL[c.category]}</span>
                <span className="softskill-ev-card__claim-phrase">"{c.phrase}"</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  )
}
