import { useMemo } from 'react'

import type { GapFillerCategory } from '@/lib/resumeGapFillerLanguageDetector'

import { detectResumeGapFillerLanguage } from '@/lib/resumeGapFillerLanguageDetector'

interface Props {
  text: string
}

const CATEGORY_LABEL: Record<GapFillerCategory, string> = {
  vague_effort: '노력·성실 클리셰',
  hollow_diversity: '"다양한" 남용',
  responsibility_dodge: '역할 회피',
  vague_contribution: '기여 모호화',
  generic_teamwork: '팀워크 클리셰',
  growth_cliche: '성장 공허 표현',
  vague_experience: '"경험 쌓기" 류',
}

const SEVERITY_LABEL: Record<string, string> = {
  heavy: '클리셰 다수',
  moderate: '일부 클리셰',
  light: '경미',
  clean: '깔끔',
}

export default function ResumeGapFillerLanguagePanel({ text }: Props) {
  const report = useMemo(() => detectResumeGapFillerLanguage(text), [text])

  if (report.severity === 'clean') return null
  if (text.trim().length < 80) return null

  const isHeavy = report.severity === 'heavy'

  return (
    <aside
      className={`gap-filler-card${isHeavy ? ' gap-filler-card--heavy' : ''}`}
      aria-label="공허 표현 분석"
    >
      <header className="gap-filler-card__head">
        <span className="gap-filler-card__eyebrow">클리셰 탐지</span>
        <span className={`gap-filler-card__badge gap-filler-card__badge--${report.severity}`}>
          {SEVERITY_LABEL[report.severity]}
        </span>
        <span className="gap-filler-card__count">{report.matches.length}건</span>
      </header>

      <p className="gap-filler-card__hint">{report.summary}</p>

      <div className="gap-filler-card__phrases" aria-label="감지된 표현">
        {report.matches.slice(0, 6).map((m, i) => (
          <div key={i} className="gap-filler-card__phrase-row">
            <span className="gap-filler-card__phrase-cat">{CATEGORY_LABEL[m.category]}</span>
            <span className="gap-filler-card__phrase-text">"{m.phrase}"</span>
          </div>
        ))}
      </div>

      {report.rewriteGuide.length > 0 && (
        <ul className="gap-filler-card__guide" aria-label="재작성 가이드">
          {report.rewriteGuide.map((g, i) => (
            <li key={i} className="gap-filler-card__guide-item">
              → {g}
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
