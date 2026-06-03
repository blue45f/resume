import { useMemo } from 'react';
import { extractResumeCoreMessages, type CoreMessageCategory } from '@/lib/koreanChecker';
import { tx } from '@/lib/i18n';

interface Props {
  text: string;
  topN?: number;
  minLength?: number;
  className?: string;
}

// 카테고리별 배지 색 — Impeccable 팔레트(neutral + blue/cyan + 상태색 emerald/amber). purple 금지.
const CATEGORY_STYLE: Record<CoreMessageCategory, string> = {
  achievement:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/40',
  leadership:
    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/40',
  impact:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/40',
  growth:
    'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-900/40',
  expertise:
    'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
};

/**
 * 이력서 핵심 메시지 패널 — 가장 강력한 메시지를 강도순으로 보여주고, 자기소개·경력
 * 첫 문단에 무엇을 앞세울지 제안한다. extractResumeCoreMessages 결과를 시각화.
 */
export default function ResumeCoreMessagesPanel({
  text,
  topN = 4,
  minLength = 200,
  className = '',
}: Props) {
  const analysis = useMemo(() => {
    if (!text || text.length < minLength) return null;
    return extractResumeCoreMessages(text, topN);
  }, [text, topN, minLength]);

  if (!analysis || analysis.top.length === 0) return null;

  const titleId = 'core-messages-title';
  return (
    <section className={`mt-3 ${className}`} aria-labelledby={titleId}>
      <div className="flex items-center justify-between mb-1.5">
        <h3 id={titleId} className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <span aria-hidden="true">🎯 </span>
          {tx('resumeAnalysis.coreMessages.title')}
        </h3>
        <span
          className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums"
          aria-label={`${tx('resumeAnalysis.coreMessages.avgStrength')} ${analysis.averageStrength}`}
        >
          {tx('resumeAnalysis.coreMessages.avgStrength')} {analysis.averageStrength}
        </span>
      </div>

      <ul className="space-y-1.5">
        {analysis.top.map((m, i) => (
          <li
            key={i}
            className="rounded-md bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 px-2.5 py-2"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className={`shrink-0 px-1.5 py-0.5 text-[9px] font-bold rounded-full border ${CATEGORY_STYLE[m.category]}`}
              >
                {tx(`resumeAnalysis.coreMessages.category.${m.category}`)}
              </span>
              <div
                className="flex-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={m.strength}
                aria-label={tx('resumeAnalysis.coreMessages.strengthAria', {
                  strength: m.strength,
                })}
              >
                <span
                  className="block h-full rounded-full bg-blue-500 dark:bg-blue-400"
                  style={{ width: `${m.strength}%` }}
                />
              </div>
              <span className="shrink-0 text-[9px] text-slate-400 dark:text-slate-500 tabular-nums w-6 text-right">
                {m.strength}
              </span>
            </div>
            <p className="text-[11.5px] leading-snug text-slate-800 dark:text-slate-100">
              {m.message}
            </p>
            <div className="mt-0.5 flex flex-wrap gap-1 text-[9px]">
              {m.signals.quantified && (
                <SignalChip>{tx('resumeAnalysis.coreMessages.signal.quantified')}</SignalChip>
              )}
              {m.signals.strongVerb && (
                <SignalChip>{tx('resumeAnalysis.coreMessages.signal.strongVerb')}</SignalChip>
              )}
              {m.signals.achievement && (
                <SignalChip>{tx('resumeAnalysis.coreMessages.signal.achievement')}</SignalChip>
              )}
              {m.signals.proper && (
                <SignalChip>{tx('resumeAnalysis.coreMessages.signal.proper')}</SignalChip>
              )}
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-1.5 text-[10.5px] leading-snug text-slate-500 dark:text-slate-400">
        {analysis.suggestion}
      </p>
    </section>
  );
}

function SignalChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-1 rounded bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
      {children}
    </span>
  );
}
