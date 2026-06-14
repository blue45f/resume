import { useMemo } from 'react'

import { analyzeInterviewBait, BAIT_TYPE_LABEL } from '@/lib/resumeInterviewBaitAnalyzer'

interface Props {
  text: string
}

const LEVEL_LABEL: Record<string, string> = {
  rich: '풍부',
  adequate: '보통',
  sparse: '부족',
  none: '없음',
}

export default function ResumeInterviewBaitPanel({ text }: Props) {
  const report = useMemo(() => analyzeInterviewBait(text), [text])

  if (text.trim().length < 100) return null
  // Don't show if already rich in story hooks
  if (report.level === 'rich') return null

  const isWarning = report.level === 'none' || report.level === 'sparse'

  return (
    <aside
      className={`interview-bait-card${isWarning ? ' interview-bait-card--warning' : ''}`}
      aria-label="면접 유도 소재 분석"
    >
      <header className="interview-bait-card__head">
        <span className="interview-bait-card__eyebrow">스토리 훅</span>
        <span className={`interview-bait-card__badge interview-bait-card__badge--${report.level}`}>
          {LEVEL_LABEL[report.level]}
        </span>
      </header>

      {report.baits.length > 0 && (
        <ul className="interview-bait-card__list" aria-label="감지된 스토리 소재">
          {report.baits.slice(0, 4).map((b, i) => (
            <li key={i} className="interview-bait-card__item">
              <span className="interview-bait-card__type">{BAIT_TYPE_LABEL[b.type]}</span>
              <span className="interview-bait-card__phrase">{b.phrase}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="interview-bait-card__tip">{report.tip}</p>
    </aside>
  )
}
