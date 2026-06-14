import { useMemo } from 'react'

import { analyzeResumeLeadership, LEADERSHIP_TYPE_LABEL } from '@/lib/resumeLeadershipAnalyzer'
import { estimateJobLevel } from '@/lib/resumeScoring'

interface Props {
  text: string
}

const STRENGTH_LABEL: Record<string, string> = {
  strong: '강함',
  moderate: '보통',
  weak: '부족',
  none: '없음',
}

export default function ResumeLeadershipPanel({ text }: Props) {
  const report = useMemo(() => analyzeResumeLeadership(text), [text])
  const level = useMemo(() => estimateJobLevel(text), [text])

  if (text.trim().length < 80) return null
  // Only show for mid+ level resumes where leadership matters
  if (level.level === 'junior') return null
  // If already strong, nothing to flag
  if (report.strength === 'strong') return null

  const isWarning = report.strength === 'none' || report.strength === 'weak'

  return (
    <aside
      className={`leadership-card${isWarning ? ' leadership-card--warning' : ''}`}
      aria-label="리더십/관리 역량 분석"
    >
      <header className="leadership-card__head">
        <span className="leadership-card__eyebrow">리더십 신호</span>
        <span className={`leadership-card__badge leadership-card__badge--${report.strength}`}>
          {STRENGTH_LABEL[report.strength]}
        </span>
      </header>

      {report.signals.length > 0 && (
        <ul className="leadership-card__signals" aria-label="감지된 리더십 신호">
          {report.signals.slice(0, 5).map((s, i) => (
            <li key={i} className="leadership-card__signal-item">
              <span className="leadership-card__signal-type">{LEADERSHIP_TYPE_LABEL[s.type]}</span>
              <span className="leadership-card__signal-phrase">{s.phrase}</span>
            </li>
          ))}
        </ul>
      )}

      {report.suggestions.length > 0 && (
        <ul className="leadership-card__suggestions" aria-label="개선 제안">
          {report.suggestions.slice(0, 3).map((s, i) => (
            <li key={i} className="leadership-card__suggestion">
              {s}
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
