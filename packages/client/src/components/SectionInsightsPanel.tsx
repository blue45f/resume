import { useMemo } from 'react';
import {
  computeSectionHealth,
  analyzeSectionDensity,
  splitByExperienceSection,
} from '@/lib/koreanChecker';

interface Props {
  text: string;
  minLength?: number;
  className?: string;
}

const TIER_COLORS: Record<'excellent' | 'good' | 'fair' | 'poor', string> = {
  excellent: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20',
  good: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20',
  fair: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20',
  poor: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/20',
};

const TIER_LABELS: Record<'excellent' | 'good' | 'fair' | 'poor', string> = {
  excellent: '우수',
  good: '양호',
  fair: '보통',
  poor: '취약',
};

/**
 * 이력서 섹션 분석 패널 — 균형·순서·밀도 3축 종합 점수와 섹션별 밀도 + 개선 힌트 노출.
 * 섹션이 2개 미만이거나 min 미달 텍스트면 숨김.
 */
export default function SectionInsightsPanel({ text, minLength = 200, className = '' }: Props) {
  const { health, density, sections } = useMemo(() => {
    if (!text || text.length < minLength) {
      return { health: null, density: [], sections: [] };
    }
    return {
      health: computeSectionHealth(text),
      density: analyzeSectionDensity(text),
      sections: splitByExperienceSection(text),
    };
  }, [text, minLength]);

  if (!health || sections.length < 2) return null;

  const tierColor = TIER_COLORS[health.tier];
  const tierLabel = TIER_LABELS[health.tier];

  return (
    <div className={`mt-3 ${className}`}>
      <div className="flex items-baseline justify-between mb-1.5">
        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          🧩 섹션 분석
        </div>
        <span
          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${tierColor}`}
          title={`균형 ${health.balanceScore} · 순서 ${health.orderScore} · 밀도 ${health.densityScore}`}
        >
          {health.overall}점 · {tierLabel}
        </span>
      </div>
      {density.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {density.map((d) => {
            const ok = !d.needsBoost;
            const chipClass = ok
              ? 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/40';
            return (
              <span
                key={d.key}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] ${chipClass}`}
                title={d.hint ?? `숫자 ${d.numbers} · 동사 ${d.actionVerbs} · 불릿 ${d.bullets}`}
              >
                {ok ? '✓' : '⚠'} {d.key}
                <span className="text-[9px] text-slate-400 dark:text-slate-500">{d.chars}자</span>
              </span>
            );
          })}
        </div>
      )}
      {health.topHints.length > 0 && (
        <ul className="space-y-0.5">
          {health.topHints.map((h, i) => (
            <li
              key={i}
              className="flex items-start gap-1.5 text-[11px] leading-snug text-slate-700 dark:text-slate-300"
            >
              <span className="mt-0.5 text-amber-500 dark:text-amber-400">•</span>
              <span>{h}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
