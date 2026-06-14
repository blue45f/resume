import { useMemo } from 'react'

import { analyzeCoverLetterMotivation } from '@/lib/coverLetterMotivationAnalyzer'

interface Props {
  text: string
}

const CLARITY_LABEL: Record<string, string> = {
  specific: '구체적',
  generic: '막연함',
  missing: '없음',
}

export default function CoverLetterMotivationPanel({ text }: Props) {
  const report = useMemo(() => analyzeCoverLetterMotivation(text), [text])

  if (text.trim().length < 60) return null
  if (report.clarity === 'specific') return null

  const isWarning = report.clarity === 'missing'

  return (
    <aside
      className={`cl-motivation-card${isWarning ? ' cl-motivation-card--warning' : ''}`}
      aria-label="지원 동기 분석"
    >
      <header className="cl-motivation-card__head">
        <span className="cl-motivation-card__eyebrow">지원 동기</span>
        <span className={`cl-motivation-card__badge cl-motivation-card__badge--${report.clarity}`}>
          {CLARITY_LABEL[report.clarity]}
        </span>
      </header>

      <p className="cl-motivation-card__hint">{report.suggestion}</p>

      {report.genericCount > 0 && (
        <ul className="cl-motivation-card__generic-list" aria-label="막연한 표현">
          {report.signals
            .filter((s) => s.type === 'generic')
            .map((s, i) => (
              <li key={i} className="cl-motivation-card__generic-item">
                <span className="cl-motivation-card__warn-icon">▲</span>
                {s.phrase}
              </li>
            ))}
        </ul>
      )}

      <p className="cl-motivation-card__tip">{report.tip}</p>
    </aside>
  )
}
