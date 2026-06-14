import { useState } from 'react'

import { buildRoadmap } from './roadmap'

import type { Resume } from '@/types/resume'

import { calculateCompleteness } from '@/lib/completeness'

/** Enhanced live completeness + roadmap widget */
export default function LiveCompletenessBar({ resume }: { resume: Partial<Resume> }) {
  const [expanded, setExpanded] = useState(false)
  if (!resume.personalInfo) return null
  const result = calculateCompleteness(resume as Resume)
  const pct = result.percentage
  const roadmap = buildRoadmap(resume)
  const pendingTasks = roadmap.filter((t) => !t.done)
  const potentialGain = pendingTasks.reduce((s, t) => s + t.gain, 0)

  const color = pct >= 80 ? '#3b82f6' : pct >= 60 ? '#22c55e' : pct >= 40 ? '#f97316' : '#ef4444'
  const label = pct >= 80 ? '우수' : pct >= 60 ? '양호' : pct >= 40 ? '보통' : '부족'
  const grade = result.grade

  const gradeColors: Record<string, string> = {
    S: 'text-sky-600 bg-sky-50 border-sky-200 dark:bg-sky-900/20 dark:border-sky-800 dark:text-sky-400',
    A: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400',
    B: 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400',
    C: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400',
    D: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400',
  }

  const sectionIcons: Record<string, string> = {
    summary: '✍️',
    links: '🔗',
    experience: '💼',
    education: '🎓',
    skills: '⚡',
    projects: '🚀',
    extras: '🏆',
  }

  return (
    <div className="mb-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
        aria-expanded={expanded}
      >
        {/* Circular mini-progress */}
        <svg width="36" height="36" viewBox="0 0 36 36" className="shrink-0">
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="3"
            className="dark:stroke-slate-700"
          />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={`${(pct / 100) * 94.2} 94.2`}
            strokeLinecap="round"
            transform="rotate(-90 18 18)"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
          <text x="18" y="22" textAnchor="middle" fontSize="9" fontWeight="bold" fill={color}>
            {pct}%
          </text>
        </svg>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              이력서 완성도
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${gradeColors[grade]}`}
            >
              {grade}등급 · {label}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-1.5 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${pct}%`, backgroundColor: color }}
            />
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {pendingTasks.length > 0 && (
            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
              +{potentialGain}점 가능
            </span>
          )}
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Roadmap panel */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-700 px-3 pb-3 pt-2 animate-fade-in">
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">
            개선 로드맵
          </p>
          <div className="space-y-1.5">
            {roadmap.slice(0, 6).map((task) => (
              <div
                key={task.sectionId}
                className={`flex items-start gap-2.5 p-2 rounded-lg ${
                  task.done
                    ? 'bg-slate-50 dark:bg-slate-700/30 opacity-60'
                    : 'bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30'
                }`}
              >
                <span className="text-sm shrink-0 mt-0.5">
                  {task.done ? '✅' : sectionIcons[task.sectionId]}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-[11px] font-medium leading-tight ${task.done ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'}`}
                  >
                    {task.label}
                  </p>
                  {!task.done && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {task.tip}
                    </p>
                  )}
                </div>
                {!task.done && (
                  <span className="shrink-0 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    +{task.gain}점
                  </span>
                )}
              </div>
            ))}
          </div>
          {pct === 100 && (
            <p className="mt-2 text-[11px] text-center text-sky-600 dark:text-sky-400 font-medium">
              🎉 완벽한 이력서! 이제 공개로 전환해 보세요.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
