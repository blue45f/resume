import { useMemo } from 'react'

import { analyzeStarPattern } from '@/lib/starPattern'

interface Props {
  text: string
}

const TIER_LABEL: Record<string, string> = {
  excellent: '우수',
  good: '양호',
  fair: '보통',
  poor: '미흡',
}

const ELEMENT_LABEL = [
  { key: 'hasSituation', label: 'S', title: '상황(Situation)' },
  { key: 'hasTask', label: 'T', title: '과제(Task)' },
  { key: 'hasAction', label: 'A', title: '행동(Action)' },
  { key: 'hasResult', label: 'R', title: '결과(Result)' },
] as const

export default function ResumeStarPatternPanel({ text }: Props) {
  const report = useMemo(() => analyzeStarPattern(text), [text])

  if (report.analyzed === 0 || report.tier === 'excellent') return null

  const fill = Math.max(0.04, report.coverage / 100)

  return (
    <aside className={`star-card star-card--${report.tier}`} aria-label="STAR 구조 분석">
      <header className="star-card__head">
        <span className="star-card__eyebrow">STAR pattern</span>
        <span className="star-card__title">STAR 구조 {TIER_LABEL[report.tier]}</span>
        <span className="star-card__badge">{report.coverage}%</span>
      </header>

      <div
        className="star-card__meter"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={report.coverage}
        aria-label="STAR 완성도"
      >
        <span
          className="star-card__meter-fill"
          style={{ ['--star-fill' as never]: String(fill) }}
        />
      </div>

      <p className="star-card__summary">
        분석된 불릿 {report.analyzed}개 중 {report.fullStarCount}개가 S·T·A·R 4요소 충족 (평균{' '}
        {report.avgScore}/4점)
      </p>

      {report.results.length > 0 && (
        <ul className="star-card__list" aria-label="불릿 STAR 점수">
          {report.results.slice(0, 4).map((r, i) => (
            <li key={i} className="star-card__item">
              <div className="star-card__elements">
                {ELEMENT_LABEL.map(({ key, label, title }) => (
                  <span
                    key={key}
                    className={`star-card__el${r[key] ? ' star-card__el--hit' : ''}`}
                    title={title}
                    aria-label={`${title} ${r[key] ? '있음' : '없음'}`}
                  >
                    {label}
                  </span>
                ))}
              </div>
              <span className="star-card__bullet-text">
                {r.bullet.slice(0, 60)}
                {r.bullet.length > 60 ? '…' : ''}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="star-card__tip">
        {report.tier === 'poor'
          ? '각 불릿에 상황·과제·행동·수치 결과를 함께 서술하세요.'
          : '미흡한 불릿에 구체적인 수치 결과를 추가하면 점수가 올라갑니다.'}
      </p>
    </aside>
  )
}
