import { useMemo } from 'react';
import {
  buildResumeImprovementPlan,
  type ImprovementSeverity,
  type ResumeImprovementPlan,
} from '@/lib/koreanChecker';

interface Props {
  text: string;
  topN?: number;
  minLength?: number;
  className?: string;
}

const SEVERITY_BADGE: Record<ImprovementSeverity, string> = {
  high: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-900/40',
  medium:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/40',
  low: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
};

const SEVERITY_LABEL: Record<ImprovementSeverity, string> = {
  high: '높음',
  medium: '중간',
  low: '낮음',
};

const TIER: Record<ResumeImprovementPlan['tier'], { label: string; cls: string }> = {
  'call-back': {
    label: '콜백 유력',
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/40',
  },
  promising: {
    label: '유망',
    cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/40',
  },
  'needs-work': {
    label: '보완 필요',
    cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/40',
  },
  'below-bar': {
    label: '문턱 미달',
    cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-900/40',
  },
};

/**
 * 이력서 우선 개선 과제 패널 — 면접 적합도 breakdown 을 임팩트순으로 재가공해
 * "지금 가장 효과 큰 개선 3가지"를 헤드라인 결정 지원으로 제시한다.
 */
export default function ResumeImprovementPlanPanel({
  text,
  topN = 3,
  minLength = 200,
  className = '',
}: Props) {
  const plan = useMemo(() => {
    if (!text || text.length < minLength) return null;
    return buildResumeImprovementPlan(text, topN);
  }, [text, topN, minLength]);

  if (!plan) return null;

  const tier = TIER[plan.tier];
  const titleId = 'improvement-plan-title';
  return (
    <section
      className={`rounded-xl border border-blue-200/70 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-900/10 p-3.5 ${className}`}
      aria-labelledby={titleId}
    >
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <h3 id={titleId} className="text-[13px] font-bold text-slate-800 dark:text-slate-100">
          <span aria-hidden="true">🎯 </span>우선 개선 과제
        </h3>
        <div className="flex items-center gap-1.5">
          <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full border ${tier.cls}`}>
            {tier.label}
          </span>
          <span
            className="text-[12px] font-bold tabular-nums text-slate-700 dark:text-slate-200"
            aria-label={`면접 적합도 ${plan.overall}점`}
          >
            {plan.overall}
            <span className="text-[9px] font-normal text-slate-400">/100</span>
          </span>
        </div>
      </div>

      {plan.hasRoom ? (
        <ol className="space-y-1.5">
          {plan.items.map((item, i) => (
            <li
              key={item.axis}
              className="rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-2.5 py-2"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="shrink-0 inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <span className="text-[11.5px] font-semibold text-slate-800 dark:text-slate-100">
                  {item.axis}
                </span>
                <span
                  className={`px-1 py-0.5 text-[8.5px] font-bold rounded border ${SEVERITY_BADGE[item.severity]}`}
                >
                  {SEVERITY_LABEL[item.severity]}
                </span>
                <span className="ml-auto text-[10px] font-bold tabular-nums text-blue-600 dark:text-blue-400">
                  +{item.impact}점
                </span>
              </div>
              <p className="text-[10.5px] leading-snug text-slate-600 dark:text-slate-300">
                {item.advice}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-[11px] leading-snug text-slate-600 dark:text-slate-300">
          {plan.topAdvice}
        </p>
      )}
    </section>
  );
}
