import { useState } from 'react'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/lib/routes'

/* ── 주간 지원 목표 위젯 ─────────────────────────────── */
function getWeekKey(): string {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const week = Math.floor((now.getTime() - startOfYear.getTime()) / (7 * 86400000))
  return `${now.getFullYear()}-W${week}`
}

export default function WeeklyGoalWidget() {
  const [goal, setGoal] = useState<number>(() => {
    return parseInt(localStorage.getItem('weekly-goal') || '5', 10)
  })
  const [applied, setApplied] = useState<number>(() => {
    const stored = localStorage.getItem(`weekly-applied-${getWeekKey()}`)
    return stored ? parseInt(stored, 10) : 0
  })
  const [editingGoal, setEditingGoal] = useState(false)
  const [tempGoal, setTempGoal] = useState(goal)

  const pct = Math.min(100, Math.round((applied / goal) * 100))
  const r = 28
  const circumference = 2 * Math.PI * r
  const offset = circumference - (pct / 100) * circumference

  const addOne = () => {
    const next = applied + 1
    setApplied(next)
    localStorage.setItem(`weekly-applied-${getWeekKey()}`, String(next))
  }

  const saveGoal = () => {
    if (tempGoal > 0 && tempGoal <= 50) {
      setGoal(tempGoal)
      localStorage.setItem('weekly-goal', String(tempGoal))
    }
    setEditingGoal(false)
  }

  const goalColor =
    pct >= 100 ? '#10b981' : pct >= 60 ? '#2563eb' : pct >= 30 ? '#f59e0b' : '#ef4444'

  return (
    <div className="mb-6 imp-card p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <span className="text-base">🎯</span> 이번 주 지원 목표
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} 주 기준
          </p>
        </div>
        {editingGoal ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={50}
              value={tempGoal}
              onChange={(e) => setTempGoal(Number(e.target.value))}
              className="home-field-control w-16 px-2 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100"
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveGoal()
                if (e.key === 'Escape') setEditingGoal(false)
              }}
              autoFocus
            />
            <button
              onClick={saveGoal}
              className="home-hover-dim text-xs px-2 py-1 bg-sky-700 text-white rounded-lg"
            >
              저장
            </button>
            <button
              onClick={() => setEditingGoal(false)}
              className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg"
            >
              취소
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setTempGoal(goal)
              setEditingGoal(true)
            }}
            className="home-quiet-link text-xs text-slate-500 dark:text-slate-400"
          >
            목표 변경
          </button>
        )}
      </div>

      <div className="flex items-center gap-5">
        {/* Circular progress */}
        <div className="relative shrink-0">
          <svg width="72" height="72" viewBox="0 0 72 72" className="rotate-[-90deg]">
            <circle
              cx="36"
              cy="36"
              r={r}
              fill="none"
              stroke="rgba(148,163,184,0.2)"
              strokeWidth="6"
            />
            <circle
              cx="36"
              cy="36"
              r={r}
              fill="none"
              stroke={goalColor}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="home-goal-ring"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{applied}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">/{goal}</span>
          </div>
        </div>

        {/* Info and CTA */}
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            {pct >= 100 ? (
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                🎉 이번 주 목표 달성!
              </p>
            ) : (
              <p className="text-sm text-slate-700 dark:text-slate-300">
                <strong className="text-sky-700 dark:text-sky-400">
                  {Math.max(0, goal - applied)}건
                </strong>{' '}
                더 지원하면 목표 달성!
              </p>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{pct}% 진행됨</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addOne}
              className="home-hover-dim px-3 py-1.5 text-xs font-medium bg-sky-700 text-white rounded-lg"
            >
              + 지원 추가
            </button>
            <Link
              to={ROUTES.jobs.applications}
              className="home-hover-dim px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg"
            >
              지원 관리
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
