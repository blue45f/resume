import { useMemo } from 'react';
import {
  computeSectionHealth,
  analyzeSectionDensity,
  splitByExperienceSection,
  analyzeStarPattern,
  type StarPatternReport,
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
  const { health, density, sections, star } = useMemo(() => {
    if (!text || text.length < minLength) {
      return { health: null, density: [], sections: [], star: null };
    }
    return {
      health: computeSectionHealth(text),
      density: analyzeSectionDensity(text),
      sections: splitByExperienceSection(text),
      star: analyzeStarPattern(text),
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
      {star && star.analyzed >= 2 && <StarSummary star={star} />}
      {health.topHints.length > 0 && (
        <ul className="space-y-0.5">
          {health.topHints.map((h, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-[11px] leading-snug text-slate-700 dark:text-slate-300"
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

const STAR_CUE_LABELS: Record<'S' | 'T' | 'A' | 'R', string> = {
  S: '상황',
  T: '과제',
  A: '행동',
  R: '결과',
};

const STAR_CUE_TIPS: Record<'S' | 'T' | 'A' | 'R', string> = {
  S: '당시 상황·문제·환경을 한 줄로 추가해보세요',
  T: '본인이 맡은 역할·목표·미션을 명시해보세요',
  A: '직접 한 행동(개발·개선·도입 등)을 적어보세요',
  R: '숫자·% 또는 절감·향상 같은 결과를 넣어보세요',
};

function StarSummary({ star }: { star: StarPatternReport }) {
  const missCount: Record<'S' | 'T' | 'A' | 'R', number> = { S: 0, T: 0, A: 0, R: 0 };
  for (const r of star.results) {
    if (!r.hasSituation) missCount.S++;
    if (!r.hasTask) missCount.T++;
    if (!r.hasAction) missCount.A++;
    if (!r.hasResult) missCount.R++;
  }
  const worst = (['S', 'T', 'A', 'R'] as const).reduce(
    (acc, k) => (missCount[k] > missCount[acc] ? k : acc),
    'S' as 'S' | 'T' | 'A' | 'R',
  );
  const chipClass =
    star.tier === 'excellent'
      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
      : star.tier === 'good'
        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
        : star.tier === 'fair'
          ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
          : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300';
  return (
    <div className="mb-1.5">
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          ⭐ STAR 커버리지
        </span>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${chipClass}`}>
          {star.coverage}% · {star.fullStarCount}/{star.analyzed}
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {(['S', 'T', 'A', 'R'] as const).map((k) => {
          const missed = missCount[k];
          const satisfied = star.analyzed - missed;
          const ok = missed === 0;
          return (
            <span
              key={k}
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] ${
                ok
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
              title={`${STAR_CUE_LABELS[k]} 충족 ${satisfied}/${star.analyzed}`}
            >
              <span className="font-semibold">{k}</span>
              <span className="text-[9px]">
                {satisfied}/{star.analyzed}
              </span>
            </span>
          );
        })}
      </div>
      {missCount[worst] > 0 && star.coverage < 75 && (
        <p className="mt-1 text-[11px] leading-snug text-slate-700 dark:text-slate-300">
          <span className="text-sky-600 dark:text-sky-400">💡</span> {STAR_CUE_LABELS[worst]} 누락{' '}
          {missCount[worst]}건 — {STAR_CUE_TIPS[worst]}
        </p>
      )}
    </div>
  );
}
