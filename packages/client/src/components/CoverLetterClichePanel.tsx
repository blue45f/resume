import { useMemo, useState } from 'react'

import { buildCoverLetterClicheReport } from '@/lib/coverLetterClicheDetector'

interface Props {
  text: string
}

export default function CoverLetterClichePanel({ text }: Props) {
  const report = useMemo(() => buildCoverLetterClicheReport(text), [text])
  const [expanded, setExpanded] = useState(false)

  if (!text?.trim() || (report.hits.length === 0 && report.score === 100)) {
    return null
  }

  const fill = Math.max(0.04, Math.min(1, report.score / 100))
  const visibleHits = expanded ? report.hits : report.hits.slice(0, 3)
  const remaining = report.hits.length - visibleHits.length

  return (
    <aside
      className={`cliche-card cliche-card--${report.tone}`}
      aria-label="자기소개서 클리셰 분석"
    >
      <header className="cliche-card__head">
        <span className="cliche-card__eyebrow">Cliche check</span>
        <span className="cliche-card__label">{report.label}</span>
      </header>

      <div
        className="cliche-card__meter"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={report.score}
        aria-label="클리셰 청결도"
      >
        <span
          className="cliche-card__meter-fill"
          style={{ ['--cliche-fill' as never]: String(fill) }}
        />
      </div>

      <p className="cliche-card__summary">{report.summary}</p>

      {report.topCategories.length > 0 && (
        <div className="cliche-card__chips" aria-label="자주 검출된 표현 유형">
          {report.topCategories.map((c) => (
            <span key={c.category} className="cliche-card__chip">
              {c.categoryLabel}
              <small>{c.count}</small>
            </span>
          ))}
        </div>
      )}

      {visibleHits.length > 0 && (
        <ul className="cliche-card__hits" aria-label="검출된 표현">
          {visibleHits.map((hit, i) => (
            <li
              key={`${hit.match}-${i}`}
              className={`cliche-card__hit cliche-card__hit--${hit.severity}`}
            >
              <div className="cliche-card__hit-head">
                <mark className="cliche-card__match">{hit.match}</mark>
                <span className="cliche-card__severity">
                  {hit.severity === 'high' ? '강' : hit.severity === 'medium' ? '중' : '약'}
                </span>
              </div>
              <p className="cliche-card__excerpt">{hit.excerpt}</p>
              <p className="cliche-card__suggestion">→ {hit.suggestion}</p>
            </li>
          ))}
        </ul>
      )}

      {remaining > 0 && (
        <button
          type="button"
          className="cliche-card__more"
          onClick={() => setExpanded(true)}
          aria-expanded={false}
        >
          + {remaining}개 더 보기
        </button>
      )}
      {expanded && report.hits.length > 3 && (
        <button
          type="button"
          className="cliche-card__more"
          onClick={() => setExpanded(false)}
          aria-expanded
        >
          접기
        </button>
      )}
    </aside>
  )
}
