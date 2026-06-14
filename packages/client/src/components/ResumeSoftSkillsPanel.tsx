import { useMemo } from 'react'

import { detectSoftSkills, detectAbbreviations } from '@/lib/softSkills'

interface Props {
  text: string
}

export default function ResumeSoftSkillsPanel({ text }: Props) {
  const softSkills = useMemo(() => detectSoftSkills(text), [text])
  const abbrev = useMemo(() => detectAbbreviations(text), [text])

  const skillIssue = softSkills.distinctCount < 3
  const abbrevIssue = abbrev.unexplained.length > 0

  if (!skillIssue && !abbrevIssue) return null

  return (
    <aside className="soft-skills-card" aria-label="소프트 스킬 및 축약어 분석">
      <header className="soft-skills-card__head">
        <span className="soft-skills-card__eyebrow">soft skills</span>
        <span className="soft-skills-card__title">역량 표현 분석</span>
      </header>

      {/* Soft skills */}
      <div className="soft-skills-card__section">
        <div className="soft-skills-card__skill-row">
          <span className="soft-skills-card__section-label">소프트 스킬</span>
          <span
            className={`soft-skills-card__skill-count${softSkills.distinctCount < 3 ? ' soft-skills-card__skill-count--low' : ''}`}
          >
            {softSkills.distinctCount}종
          </span>
        </div>
        <p className="soft-skills-card__hint">{softSkills.suggestion}</p>
        {softSkills.hits.length > 0 && (
          <div className="soft-skills-card__chips">
            {softSkills.hits.map((h) => (
              <span key={h.skill} className="soft-skills-card__chip">
                {h.skill}
                {h.count > 1 && <span className="soft-skills-card__chip-count">×{h.count}</span>}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Unexplained abbreviations */}
      {abbrevIssue && (
        <div className="soft-skills-card__section soft-skills-card__section--abbrev">
          <p className="soft-skills-card__section-label">
            미설명 축약어 {abbrev.unexplained.length}건
          </p>
          <p className="soft-skills-card__hint">{abbrev.suggestion}</p>
          <div className="soft-skills-card__chips">
            {abbrev.unexplained.slice(0, 8).map((h) => (
              <code key={h.acronym} className="soft-skills-card__acronym">
                {h.acronym}
              </code>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
