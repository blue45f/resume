/**
 * ResumeHealthBoost — HomePage 진입 직후 보이는 "다음 한 걸음" 인사이트.
 *
 * Impeccable: 비대칭 grid (auto · 1fr), 12-tick refined dial, 진중한 타이포그래피.
 * 데이터 신뢰감 우선, glassy/gradient/purple 일체 없음.
 *
 * 좌측: 모든 이력서의 가중 평균 점수 (dial)
 * 우측: 가장 임팩트 큰 missing 항목 1개 + 채우면 예상 +X% + CTA
 */
import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import type { ResumeSummary } from '@/types/resume';
import { computeResumeCompletion, type CompletionItem } from '@/lib/resumeCompletion';
import { ROUTES } from '@/lib/routes';

interface Props {
  resumes: ResumeSummary[];
}

interface Snapshot {
  avgPct: number;
  totalCount: number;
  top: (CompletionItem & { resumeId: string; resumeTitle: string }) | null;
  projectedPct: number;
  delta: number;
  /** 카테고리별 평균 비율 (0..1) — segmented arc 시각화용 */
  categoryStats: Array<{ key: string; pct: number }>;
}

function buildSnapshot(resumes: ResumeSummary[]): Snapshot | null {
  if (resumes.length === 0) return null;
  const summaries = resumes.map((r) => ({ resume: r, c: computeResumeCompletion(r) }));
  const totalScore = summaries.reduce((s, x) => s + x.c.score, 0);
  const totalMax = summaries.reduce((s, x) => s + x.c.max, 0);
  const avgPct = Math.round((totalScore / totalMax) * 100);

  const allMissing = summaries.flatMap((s) =>
    s.c.missingItems.map((m) => ({
      ...m,
      resumeId: s.resume.id,
      resumeTitle: s.resume.title?.trim() || '제목 없음',
    })),
  );
  const top = allMissing.sort((a, b) => b.max - a.max)[0] || null;

  let projectedPct = avgPct;
  let delta = 0;
  if (top) {
    // Filling this single item on the relevant resume bumps that resume's score by item.max.
    const projectedScore = totalScore + top.max;
    projectedPct = Math.min(100, Math.round((projectedScore / totalMax) * 100));
    delta = Math.max(0, projectedPct - avgPct);
  }

  // 카테고리별 가중 평균 — segmented arc 시각화용
  const categories = ['identity', 'depth', 'web', 'discoverability'] as const;
  const categoryStats = categories.map((cat) => {
    let s = 0;
    let m = 0;
    summaries.forEach(({ c }) => {
      c.items
        .filter((i) => i.category === cat)
        .forEach((i) => {
          s += i.score;
          m += i.max;
        });
    });
    return { key: cat, pct: m > 0 ? s / m : 0 };
  });

  return { avgPct, totalCount: resumes.length, top, projectedPct, delta, categoryStats };
}

const RADIUS = 40;
const C = 2 * Math.PI * RADIUS;

function gradeRingClass(pct: number): string {
  if (pct >= 85) return 'text-emerald-600 dark:text-emerald-400';
  if (pct >= 65) return 'text-sky-700 dark:text-sky-400';
  if (pct >= 40) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

export default function ResumeHealthBoost({ resumes }: Props) {
  const snap = useMemo(() => buildSnapshot(resumes), [resumes]);
  if (!snap) return null;

  const ring = gradeRingClass(snap.avgPct);

  return (
    <section
      aria-label="이력서 건강도 진단"
      className="relative mb-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm"
    >
      {/* vertical accent band — anchors the asymmetric grid without using gradients */}
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1 bg-sky-700 dark:bg-sky-400"
      />

      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 sm:gap-7 p-5 sm:p-7 pl-6 sm:pl-9">
        {/* ── left: dial ──────────────────────────────────────────── */}
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <svg
              width="104"
              height="104"
              viewBox="0 0 104 104"
              className="-rotate-90"
              aria-hidden="true"
            >
              {/* track */}
              <circle
                cx="52"
                cy="52"
                r={RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-slate-100 dark:text-slate-800"
              />
              {/* segmented progress — 4 카테고리 호 (각 90°, 2° gap).
                  Identity / Depth / Web / Discoverability 가 동시에 visualized. */}
              {(() => {
                const segColors = ['#0c4a6e', '#0891b2', '#10b981', '#f59e0b'];
                const segLen = C / 4 - 2; // 90° per segment, with 1° gap each side
                return snap.categoryStats.map((stat, i) => {
                  const segOffset = -i * (C / 4) + 1;
                  const filledLen = segLen * stat.pct;
                  return (
                    <circle
                      key={stat.key}
                      cx="52"
                      cy="52"
                      r={RADIUS}
                      fill="none"
                      stroke={segColors[i]}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${filledLen} ${C - filledLen}`}
                      strokeDashoffset={segOffset}
                      style={{
                        transition: 'stroke-dasharray 1.1s cubic-bezier(0.25, 1, 0.5, 1)',
                      }}
                    />
                  );
                });
              })()}
              {/* fallback overall ring (lower opacity) — average baseline 시각 표시 */}
              <circle
                cx="52"
                cy="52"
                r={RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                className={ring}
                strokeDasharray={C}
                strokeDashoffset={C * (1 - snap.avgPct / 100)}
                style={{
                  transition: 'stroke-dashoffset 1.1s cubic-bezier(0.25, 1, 0.5, 1)',
                  opacity: 0,
                }}
              />
              {/* tick marks — refined dial vibe (12 ticks, every 30°) */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i / 12) * 2 * Math.PI;
                const x1 = 52 + Math.cos(angle) * 30;
                const y1 = 52 + Math.sin(angle) * 30;
                const x2 = 52 + Math.cos(angle) * 33;
                const y2 = 52 + Math.sin(angle) * 33;
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-slate-300 dark:text-slate-700"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span
                className={`text-[28px] font-black leading-none tracking-tight tabular-nums ${ring}`}
              >
                {snap.avgPct}
              </span>
              <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] mt-1">
                평균
              </span>
            </div>
          </div>

          <div className="hidden sm:flex flex-col min-w-0">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 font-semibold mb-1">
              이력서 건강도
            </div>
            <div className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
              <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {snap.totalCount}
              </span>
              개 이력서 가중 평균
            </div>
            {snap.top && (
              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                채우면{' '}
                <span className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                  +{snap.delta}%
                </span>{' '}
                예상
              </div>
            )}
          </div>
        </div>

        {/* ── right: recommendation + CTA ─────────────────────────── */}
        {snap.top ? (
          <div className="flex flex-col gap-3 min-w-0 sm:border-l sm:border-slate-200 dark:sm:border-slate-700 sm:pl-7">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-400 font-bold mb-1.5">
                <span className="w-1 h-1 rounded-full bg-emerald-500" aria-hidden="true" />
                다음 한 걸음 · +{snap.delta}%
              </div>
              <h3 className="text-[15px] sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  &ldquo;{snap.top.resumeTitle}&rdquo;
                </span>
                <span className="px-1 text-slate-400">·</span>
                <span className="text-sky-700 dark:text-sky-400">{snap.top.label}</span>
                <span className="text-slate-700 dark:text-slate-300"> 채우기</span>
              </h3>
              {snap.top.hint && (
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {snap.top.hint}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                to={ROUTES.resume.edit(snap.top.resumeId)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold rounded-lg hover:bg-slate-800 dark:hover:bg-white transition-colors"
              >
                지금 채우기
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                → {snap.projectedPct}%로 도약
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 min-w-0 sm:border-l sm:border-slate-200 dark:sm:border-slate-700 sm:pl-7 justify-center">
            <div className="text-[10px] uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-400 font-bold">
              완료
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              모든 이력서가 만점입니다.
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              새 이력서를 추가하거나, 면접 준비로 넘어가세요.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
