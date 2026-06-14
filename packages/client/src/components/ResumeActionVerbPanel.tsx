import { useMemo } from 'react'

import { buildResumeActionVerbReport } from '@/lib/resumeActionVerbAnalyzer'

interface Props {
  text: string
}

export default function ResumeActionVerbPanel({ text }: Props) {
  const report = useMemo(() => buildResumeActionVerbReport(text), [text])

  if (report.totalHits === 0) return null

  const fill = Math.max(0.04, Math.min(1, report.score / 100))

  return (
    <aside className={`verb-card verb-card--${report.tone}`} aria-label="이력서 실행 동사 다양도">
      <header className="verb-card__head">
        <span className="verb-card__eyebrow">Action verbs</span>
        <span className="verb-card__label">{report.label}</span>
      </header>

      <div
        className="verb-card__meter"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={report.score}
        aria-label="동사 다양도"
      >
        <span
          className="verb-card__meter-fill"
          style={{ ['--verb-fill' as never]: String(fill) }}
        />
      </div>

      <dl className="verb-card__grid">
        <div className="verb-card__cell">
          <dt>총 동사</dt>
          <dd>{report.totalHits}</dd>
        </div>
        <div className="verb-card__cell">
          <dt>다양도</dt>
          <dd>{(report.diversityRatio * 100).toFixed(0)}%</dd>
        </div>
        <div className="verb-card__cell">
          <dt>강한 동사</dt>
          <dd>{report.strongCount}</dd>
        </div>
        <div className="verb-card__cell">
          <dt>약한 동사</dt>
          <dd>{report.weakCount}</dd>
        </div>
      </dl>

      {report.topVerbs.length > 0 && (
        <div className="verb-card__chips" aria-label="자주 쓰인 동사">
          {report.topVerbs.map((v) => (
            <span
              key={v.verb}
              className={`verb-card__chip verb-card__chip--${v.strength}`}
              title={`${v.verb} · ${v.count}회`}
            >
              {v.verb}
              <small>{v.count}</small>
            </span>
          ))}
        </div>
      )}

      <p className="verb-card__summary">{report.summary}</p>

      {report.weakVerbs.length > 0 && report.weakVerbs[0]?.alternatives && (
        <p className="verb-card__suggestion">
          → {report.weakVerbs[0].verb} 대신:{' '}
          <strong>{report.weakVerbs[0].alternatives.join(' · ')}</strong>
        </p>
      )}
    </aside>
  )
}
