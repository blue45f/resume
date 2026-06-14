import { useState, useMemo } from 'react'

import { buildQuantReport } from '@/lib/resumeQuantificationRate'

interface Props {
  text: string
}

export default function ResumeQuantificationPanel({ text }: Props) {
  const report = useMemo(() => buildQuantReport(text), [text])
  const [expanded, setExpanded] = useState(false)

  if (report.bullets.length === 0) return null

  const fill = Math.max(0.04, Math.min(1, report.score / 100))
  const visibleSuggestions = expanded ? report.suggestions : report.suggestions.slice(0, 2)

  return (
    <aside className={`quant-card quant-card--${report.tone}`} aria-label="이력서 수치화 비율">
      <header className="quant-card__head">
        <span className="quant-card__eyebrow">Quantification rate</span>
        <span className="quant-card__label">{report.label}</span>
      </header>

      <div
        className="quant-card__meter"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={report.score}
        aria-label="수치화 비율"
      >
        <span
          className="quant-card__meter-fill"
          style={{ ['--quant-fill' as never]: String(fill) }}
        />
      </div>

      <dl className="quant-card__grid">
        <div className="quant-card__cell">
          <dt>총 문장</dt>
          <dd>{report.bullets.length}</dd>
        </div>
        <div className="quant-card__cell">
          <dt>수치 포함</dt>
          <dd>{report.quantifiedCount}</dd>
        </div>
        <div className="quant-card__cell">
          <dt>수치 없음</dt>
          <dd>{report.bullets.length - report.quantifiedCount}</dd>
        </div>
        <div className="quant-card__cell">
          <dt>비율</dt>
          <dd>{report.score}%</dd>
        </div>
      </dl>

      <p className="quant-card__summary">{report.summary}</p>

      {report.suggestions.length > 0 && (
        <section className="quant-card__suggestions" aria-label="수치 추가 제안">
          <h4 className="quant-card__suggestions-title">수치 추가가 필요한 문장</h4>
          <ul>
            {visibleSuggestions.map((s, i) => (
              <li key={i} className="quant-card__suggestion-item">
                {s}
              </li>
            ))}
          </ul>
          {report.suggestions.length > 2 && (
            <button
              type="button"
              className="quant-card__toggle"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? '접기' : `+${report.suggestions.length - 2}개 더 보기`}
            </button>
          )}
        </section>
      )}
    </aside>
  )
}
