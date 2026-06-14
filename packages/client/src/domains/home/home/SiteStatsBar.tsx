import { useEffect, useState } from 'react'

import { useSiteStatsPublic } from '@/hooks/useResources'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target <= 0) return
    let start = 0
    let raf = 0
    // Honor reduced-motion: collapse duration so the first frame lands on target.
    const effectiveDuration = prefersReducedMotion() ? 0 : duration
    const startTime = performance.now()
    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = effectiveDuration <= 0 ? 1 : Math.min(elapsed / effectiveDuration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(eased * target)
      if (current !== start) {
        start = current
        setValue(current)
      }
      if (progress < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

function AnimatedStat({ value, label }: { value: number; label: string }) {
  const animated = useCountUp(value)
  return (
    <div className="flex flex-col items-center px-4 py-3 imp-card shadow-sm min-w-[100px]">
      <strong className="text-lg font-bold text-slate-800 dark:text-slate-200 tabular-nums">
        {animated.toLocaleString()}
      </strong>
      <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</span>
    </div>
  )
}

function StatSkeleton({ label }: { label: string }) {
  return (
    <div
      className="flex flex-col items-center px-4 py-3 imp-card shadow-sm min-w-[100px]"
      aria-hidden="true"
    >
      <span className="h-[1.6rem] w-12 rounded-md bg-slate-200 dark:bg-slate-700 animate-pulse" />
      <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</span>
    </div>
  )
}

const STAT_LABELS = ['회원', '이력서', '조회', '템플릿'] as const

export default function SiteStatsBar() {
  const { data: d } = useSiteStatsPublic()
  const stats: { users: number; resumes: number; views: number; templates: number } | null = d
    ? {
        users: d.users.total,
        resumes: d.resumes.total,
        views: d.activity.totalViews,
        templates: d.content.templates,
      }
    : null

  return (
    <div className="flex flex-wrap justify-center gap-3 mt-8" aria-busy={!stats}>
      {stats ? (
        <>
          <AnimatedStat value={stats.users} label="회원" />
          <AnimatedStat value={stats.resumes} label="이력서" />
          <AnimatedStat value={stats.views} label="조회" />
          <AnimatedStat value={stats.templates} label="템플릿" />
        </>
      ) : (
        STAT_LABELS.map((label) => <StatSkeleton key={label} label={label} />)
      )}
    </div>
  )
}
