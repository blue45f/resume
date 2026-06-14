import { useMemo } from 'react'

import { checkResumeSkillsOrganization } from '@/lib/resumeSkillsOrganizationChecker'

interface Props {
  text: string
}

const GRADE_LABEL: Record<string, string> = {
  organized: '잘 정리됨',
  partial: '부분 정리',
  jumbled: '혼재',
  minimal: '미작성',
}

const CATEGORY_LABEL: Record<string, string> = {
  language: '언어',
  framework_frontend: 'FE 프레임워크',
  framework_backend: 'BE 프레임워크',
  database: '데이터베이스',
  devops_cloud: 'DevOps/Cloud',
  mobile: '모바일',
  data_ml: '데이터/ML',
  testing: '테스트',
  tool_other: '기타',
}

export default function ResumeSkillsOrganizationPanel({ text }: Props) {
  const report = useMemo(() => checkResumeSkillsOrganization(text), [text])

  if (report.grade === 'organized' || report.grade === 'minimal') return null
  if (report.skillCount < 4) return null

  const isWarning = report.grade === 'jumbled'

  // Group detected skills by category for display
  const byCategory: Record<string, string[]> = {}
  for (const { name, category } of report.detectedSkills) {
    if (!byCategory[category]) byCategory[category] = []
    byCategory[category].push(name)
  }

  return (
    <aside
      className={`skill-org-card${isWarning ? ' skill-org-card--warning' : ''}`}
      aria-label="기술 스택 구성 분석"
    >
      <header className="skill-org-card__head">
        <span className="skill-org-card__eyebrow">기술 구성</span>
        <span className={`skill-org-card__badge skill-org-card__badge--${report.grade}`}>
          {GRADE_LABEL[report.grade]}
        </span>
        <span className="skill-org-card__count">{report.skillCount}개</span>
      </header>

      <p className="skill-org-card__hint">{report.summary}</p>

      <div className="skill-org-card__categories" aria-label="감지된 카테고리">
        {Object.entries(byCategory)
          .slice(0, 5)
          .map(([cat, skills]) => (
            <div key={cat} className="skill-org-card__category">
              <span className="skill-org-card__cat-label">{CATEGORY_LABEL[cat] ?? cat}</span>
              <span className="skill-org-card__cat-skills">
                {skills.slice(0, 4).join(', ')}
                {skills.length > 4 ? ` +${skills.length - 4}` : ''}
              </span>
            </div>
          ))}
      </div>

      {report.suggestions.length > 0 && (
        <ul className="skill-org-card__suggestions" aria-label="개선 제안">
          {report.suggestions.map((s, i) => (
            <li key={i} className="skill-org-card__suggestion">
              → {s}
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
