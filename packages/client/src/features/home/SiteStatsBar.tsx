import { useEffect, useState } from 'react';
import { useSiteStatsPublic } from '@/hooks/useResources';

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target <= 0) return;
    let start = 0;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      if (current !== start) {
        start = current;
        setValue(current);
      }
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

function AnimatedStat({ value, label }: { value: number; label: string }) {
  const animated = useCountUp(value);
  return (
    <div className="flex flex-col items-center px-4 py-3 imp-card shadow-sm min-w-[100px]">
      <strong className="text-lg font-bold text-slate-800 dark:text-slate-200 tabular-nums">
        {value > 0 ? animated.toLocaleString() : '—'}
      </strong>
      <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</span>
    </div>
  );
}

export default function SiteStatsBar() {
  const { data: d } = useSiteStatsPublic();
  const stats: { users: number; resumes: number; views: number; templates: number } | null = d
    ? {
        users: d.users.total,
        resumes: d.resumes.total,
        views: d.activity.totalViews,
        templates: d.content.templates,
      }
    : null;

  return (
    <div className="flex flex-wrap justify-center gap-3 mt-8">
      <AnimatedStat value={stats?.users || 0} label="회원" />
      <AnimatedStat value={stats?.resumes || 0} label="이력서" />
      <AnimatedStat value={stats?.views || 0} label="조회" />
      <AnimatedStat value={stats?.templates || 0} label="템플릿" />
    </div>
  );
}
