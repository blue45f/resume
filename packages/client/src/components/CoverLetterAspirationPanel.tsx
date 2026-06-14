import { useMemo } from 'react'

import { analyzeCoverLetterAspiration } from '@/lib/coverLetterAspirationAnalyzer'

interface Props {
  text: string
}

const CLARITY_LABEL: Record<string, string> = {
  specific: '구체적',
  vague: '막연함',
  absent: '없음',
}

const SIGNAL_TYPE_LABEL: Record<string, string> = {
  growth_goal: '성장 목표',
  company_contribution: '기여 계획',
  skill_development: '기술 개발',
  vague_pledge: '막연한 의지',
}

export default function CoverLetterAspirationPanel({ text }: Props) {
  const report = useMemo(() => analyzeCoverLetterAspiration(text), [text])

  if (text.trim().length < 60) return null
  if (report.clarity === 'specific') return null

  const isWarning = report.clarity === 'absent'

  return (
    <aside
      className={`cl-aspiration-card${isWarning ? ' cl-aspiration-card--warning' : ''}`}
      aria-label="입사 후 포부 분석"
    >
      <header className="cl-aspiration-card__head">
        <span className="cl-aspiration-card__eyebrow">입사 후 포부</span>
        <span className={`cl-aspiration-card__badge cl-aspiration-card__badge--${report.clarity}`}>
          {CLARITY_LABEL[report.clarity]}
        </span>
      </header>

      <p className="cl-aspiration-card__hint">{report.suggestion}</p>

      {report.signals.filter((s) => s.type === 'vague_pledge').length > 0 && (
        <ul className="cl-aspiration-card__vague-list" aria-label="막연한 표현">
          {report.signals
            .filter((s) => s.type === 'vague_pledge')
            .map((s, i) => (
              <li key={i} className="cl-aspiration-card__vague-item">
                <span className="cl-aspiration-card__warn-icon">▲</span>
                {s.phrase}
              </li>
            ))}
        </ul>
      )}

      {report.signals.filter((s) => s.type !== 'vague_pledge').length > 0 && (
        <ul className="cl-aspiration-card__specific-list" aria-label="구체적 포부">
          {report.signals
            .filter((s) => s.type !== 'vague_pledge')
            .map((s, i) => (
              <li key={i} className="cl-aspiration-card__specific-item">
                <span className="cl-aspiration-card__tag">{SIGNAL_TYPE_LABEL[s.type]}</span>
                {s.phrase}
              </li>
            ))}
        </ul>
      )}

      <p className="cl-aspiration-card__rewrite">{report.rewriteHint}</p>
    </aside>
  )
}
