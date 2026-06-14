import { useMemo } from 'react'

import { estimateJobLevel, analyzeActivityChronology } from '@/lib/resumeScoring'

interface Props {
  text: string
}

const LEVEL_LABEL: Record<string, string> = {
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior',
  lead: 'Lead',
}

const LEVEL_COLOR: Record<string, string> = {
  junior: 'var(--color-accent)',
  mid: 'color-mix(in oklab, var(--color-accent) 70%, var(--color-success))',
  senior: 'var(--color-success)',
  lead: 'color-mix(in oklab, var(--color-success) 80%, var(--color-text))',
}

export default function ResumeJobLevelPanel({ text }: Props) {
  const level = useMemo(() => estimateJobLevel(text), [text])
  const chrono = useMemo(() => analyzeActivityChronology(text), [text])

  if (level.years === 0 && chrono.order === 'single-or-none') return null
  if (text.trim().length < 60) return null

  const chronoIssue = chrono.order === 'mixed' || chrono.order === 'oldest-first'

  return (
    <aside className="job-level-card" aria-label="경력 레벨 및 시간순 분석">
      <header className="job-level-card__head">
        <span className="job-level-card__eyebrow">Career level</span>
        {level.years > 0 && (
          <span
            className="job-level-card__badge"
            style={{ ['--level-color' as never]: LEVEL_COLOR[level.level] }}
          >
            {LEVEL_LABEL[level.level]}
            {level.years > 0 && ` · ${level.years}년`}
          </span>
        )}
      </header>

      {level.years > 0 && <p className="job-level-card__hint">{level.suggestion}</p>}

      {level.level === 'senior' && !level.hasLeadKeyword && (
        <p className="job-level-card__tip">
          💡 리딩·멘토링 경험이 있다면 "팀 리드", "테크 리드" 등의 키워드를 추가하면 Lead 레벨로
          어필할 수 있습니다.
        </p>
      )}

      {chrono.order !== 'single-or-none' && (
        <div
          className={`job-level-card__chrono${chronoIssue ? ' job-level-card__chrono--warn' : ''}`}
        >
          <span className="job-level-card__chrono-label">
            {chrono.order === 'newest-first'
              ? '✓ 최신순 정렬'
              : chrono.order === 'oldest-first'
                ? '⚠ 과거→최신 순'
                : '⚠ 혼재된 순서'}
          </span>
          <span className="job-level-card__chrono-hint">{chrono.suggestion}</span>
        </div>
      )}
    </aside>
  )
}
