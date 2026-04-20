import { useMemo } from 'react';
import { extractQuotableLines } from '@/lib/koreanChecker';

interface Props {
  text: string;
  topN?: number;
  minLength?: number;
  className?: string;
}

/**
 * 이력서에서 임팩트 있는 문장(수치·고유명사·강한 동사)을 Top-N 강조.
 * 소셜 카드·추천사·포트폴리오 헤드라인 후보로 바로 활용 가능.
 */
export default function QuotableHighlights({
  text,
  topN = 3,
  minLength = 200,
  className = '',
}: Props) {
  const lines = useMemo(() => {
    if (!text || text.length < minLength) return [];
    return extractQuotableLines(text, topN);
  }, [text, topN, minLength]);

  if (lines.length === 0) return null;

  return (
    <div className={`mt-3 ${className}`}>
      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
        💬 인용할 만한 문장
      </div>
      <ul className="space-y-1">
        {lines.map((q, i) => (
          <li
            key={i}
            className="flex items-start gap-2 rounded-md bg-cyan-50/70 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-900/40 px-2 py-1.5"
          >
            <span className="shrink-0 inline-flex items-center justify-center w-4 h-4 rounded-full bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 text-[9px] font-bold mt-0.5">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[11.5px] leading-snug text-slate-800 dark:text-slate-100">
                "{q.sentence}"
              </p>
              <div className="mt-0.5 flex gap-1 text-[9px]">
                {q.signals.hasNumber && (
                  <span className="px-1 rounded bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    수치
                  </span>
                )}
                {q.signals.hasStrongVerb && (
                  <span className="px-1 rounded bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    강한 동사
                  </span>
                )}
                {q.signals.hasProper && (
                  <span className="px-1 rounded bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    고유명사
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
