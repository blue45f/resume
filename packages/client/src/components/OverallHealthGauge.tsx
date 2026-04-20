import { useMemo } from 'react';
import { calculateOverallHealth } from '@/lib/koreanChecker';

interface Props {
  text: string;
  minLength?: number;
  className?: string;
}

const TIER_META: Record<
  'excellent' | 'good' | 'fair' | 'poor',
  { label: string; dot: string; bar: string; ring: string; text: string }
> = {
  excellent: {
    label: '우수',
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-500 dark:bg-emerald-400',
    ring: 'ring-emerald-400/60 dark:ring-emerald-500/60',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  good: {
    label: '양호',
    dot: 'bg-blue-500',
    bar: 'bg-blue-500 dark:bg-blue-400',
    ring: 'ring-blue-400/60 dark:ring-blue-500/60',
    text: 'text-blue-700 dark:text-blue-300',
  },
  fair: {
    label: '보통',
    dot: 'bg-amber-500',
    bar: 'bg-amber-500 dark:bg-amber-400',
    ring: 'ring-amber-400/60 dark:ring-amber-500/60',
    text: 'text-amber-700 dark:text-amber-300',
  },
  poor: {
    label: '취약',
    dot: 'bg-rose-500',
    bar: 'bg-rose-500 dark:bg-rose-400',
    ring: 'ring-rose-400/60 dark:ring-rose-500/60',
    text: 'text-rose-700 dark:text-rose-300',
  },
};

/**
 * 이력서·자소서 전반의 "준비도" 한눈 시각화 — 3축(문체 30%·완성도 30%·면접 40%) 가중 평균.
 * 링크드인 Profile Strength·원티드 "추천 점수" 벤치마크.
 */
export default function OverallHealthGauge({ text, minLength = 200, className = '' }: Props) {
  const health = useMemo(() => {
    if (!text || text.length < minLength) return null;
    return calculateOverallHealth(text);
  }, [text, minLength]);

  if (!health) return null;
  const meta = TIER_META[health.tier];

  return (
    <div
      className={`rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 ${className}`}
      role="status"
      aria-label={`이력서 종합 준비도 ${health.health}점 ${meta.label}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ring-4 ${meta.ring}`}
        >
          <span className={`text-[20px] font-bold tabular-nums ${meta.text}`}>{health.health}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              🎯 종합 준비도
            </span>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded ${meta.text} bg-slate-50 dark:bg-slate-800`}
            >
              {meta.label}
            </span>
          </div>
          <div className="mt-2 space-y-1">
            <AxisBar label="문체" value={health.quality} weight={30} tier={health.tier} />
            <AxisBar label="완성도" value={health.completeness} weight={30} tier={health.tier} />
            <AxisBar
              label="면접 적합도"
              value={health.interviewability}
              weight={40}
              tier={health.tier}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function AxisBar({
  label,
  value,
  weight,
  tier,
}: {
  label: string;
  value: number;
  weight: number;
  tier: 'excellent' | 'good' | 'fair' | 'poor';
}) {
  const meta = TIER_META[tier];
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-16 shrink-0 text-slate-600 dark:text-slate-400">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className={`h-full ${meta.bar} transition-[width] duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right tabular-nums text-slate-700 dark:text-slate-300 font-medium">
        {value}
      </span>
      <span className="w-8 shrink-0 text-right tabular-nums text-[9.5px] text-slate-400 dark:text-slate-500">
        ×{weight}%
      </span>
    </div>
  );
}
