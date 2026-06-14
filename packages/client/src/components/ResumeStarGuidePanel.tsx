import { useMemo, useState } from 'react'

import { detectSkillMentions, generateStarBulletTemplate } from '@/lib/koreanChecker'
import { analyzeStarPattern } from '@/lib/starPattern'

interface Props {
  text: string
}

export default function ResumeStarGuidePanel({ text }: Props) {
  const star = useMemo(() => analyzeStarPattern(text), [text])
  const skills = useMemo(() => detectSkillMentions(text, 5), [text])
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  if (star.tier === 'excellent' || star.tier === 'good') return null
  if (skills.length === 0) return null

  const topSkills = skills.slice(0, 3)

  return (
    <aside className="star-guide-card" aria-label="STAR 불릿 작성 가이드">
      <header className="star-guide-card__head">
        <span className="star-guide-card__eyebrow">STAR guide</span>
        <span className="star-guide-card__label">불릿 구조 개선 가이드</span>
      </header>
      <p className="star-guide-card__desc">
        이력서 경력 불릿에 상황·과제·행동·결과(STAR) 구조를 적용하면 채용 담당자의 시선을 끕니다.
        스킬별 작성 템플릿을 참고하세요.
      </p>
      <ul className="star-guide-card__skills" aria-label="스킬별 STAR 템플릿">
        {topSkills.map((s, i) => {
          const tpl = generateStarBulletTemplate(s.skill)
          const isOpen = openIdx === i
          return (
            <li key={s.skill} className="star-guide-card__skill-item">
              <button
                type="button"
                className={`star-guide-card__skill-btn${isOpen ? ' star-guide-card__skill-btn--open' : ''}`}
                onClick={() => setOpenIdx(isOpen ? null : i)}
                aria-expanded={isOpen}
              >
                <code className="star-guide-card__skill-name">{s.skill}</code>
                <span className="star-guide-card__chevron" aria-hidden="true">
                  {isOpen ? '▲' : '▼'}
                </span>
              </button>
              {isOpen && (
                <div className="star-guide-card__template" role="region">
                  <p className="star-guide-card__tpl-text">{tpl.template}</p>
                  <dl className="star-guide-card__prompts">
                    <dt>S</dt>
                    <dd>{tpl.prompts.situation}</dd>
                    <dt>T</dt>
                    <dd>{tpl.prompts.task}</dd>
                    <dt>A</dt>
                    <dd>{tpl.prompts.action}</dd>
                    <dt>R</dt>
                    <dd>{tpl.prompts.result}</dd>
                  </dl>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
