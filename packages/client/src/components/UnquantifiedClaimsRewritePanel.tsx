import { useMemo, useState } from 'react';
import { detectUnquantifiedClaims } from '@/lib/koreanChecker';
import { aiInlineAssist } from '@/lib/api';

interface Props {
  resumeId: string;
  text: string;
  minLength?: number;
  className?: string;
}

type Status = 'idle' | 'loading' | 'ready' | 'error';

/**
 * 수치화가 필요한 문장을 검출하고, 각 문장을 AI(`inline-assist: quantify`)로 수치 보강 문장으로 리라이트.
 * EditResumePage 에서만 사용 — resumeId 필요.
 */
export default function UnquantifiedClaimsRewritePanel({
  resumeId,
  text,
  minLength = 200,
  className = '',
}: Props) {
  const claims = useMemo(() => {
    if (!text || text.length < minLength) return [];
    return detectUnquantifiedClaims(text).slice(0, 4);
  }, [text, minLength]);

  const [states, setStates] = useState<
    Record<number, { status: Status; improved?: string; err?: string }>
  >({});

  if (claims.length === 0) return null;

  const rewrite = async (i: number, sentence: string) => {
    setStates((s) => ({ ...s, [i]: { status: 'loading' } }));
    try {
      const r = await aiInlineAssist(resumeId, sentence, 'quantify');
      setStates((s) => ({ ...s, [i]: { status: 'ready', improved: r.improved } }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'AI 요청 실패';
      setStates((s) => ({ ...s, [i]: { status: 'error', err: msg } }));
    }
  };

  const copy = async (t: string) => {
    try {
      await navigator.clipboard.writeText(t);
    } catch {
      // ignore
    }
  };

  return (
    <section
      aria-labelledby="unquantified-rewrite-title"
      className={`rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-900/15 p-2.5 ${className}`}
    >
      <div className="flex items-baseline justify-between mb-1.5">
        <h3
          id="unquantified-rewrite-title"
          className="text-[11px] font-semibold text-amber-800 dark:text-amber-200"
        >
          <span aria-hidden="true">📈 </span>
          수치화 필요 문장 — AI 리라이트
        </h3>
        <span className="text-[10px] text-amber-600 dark:text-amber-400">{claims.length}건</span>
      </div>
      <ul className="space-y-1.5">
        {claims.map((c, i) => {
          const st = states[i];
          return (
            <li
              key={i}
              className="text-[11px] leading-snug text-slate-700 dark:text-slate-200 rounded bg-white/60 dark:bg-slate-900/40 p-1.5 border border-amber-100 dark:border-amber-900/40"
            >
              <div className="flex items-start gap-2">
                <span className="shrink-0 inline-flex items-center px-1 py-0 rounded text-[9px] font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200">
                  {c.verb}
                </span>
                <p className="flex-1 min-w-0 text-[10.5px]">
                  {c.sentence.length > 90 ? c.sentence.slice(0, 90) + '…' : c.sentence}
                </p>
                <button
                  type="button"
                  onClick={() => rewrite(i, c.sentence)}
                  disabled={st?.status === 'loading'}
                  className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {st?.status === 'loading' ? '…' : 'AI 수치화'}
                </button>
              </div>
              {st?.status === 'ready' && st.improved && (
                <div className="mt-1 pl-[18px] flex items-start gap-2">
                  <span className="shrink-0 text-[9.5px] font-semibold text-emerald-700 dark:text-emerald-300">
                    ✨ AI
                  </span>
                  <p className="flex-1 min-w-0 text-[10.5px] text-emerald-900 dark:text-emerald-100">
                    {st.improved}
                  </p>
                  <button
                    type="button"
                    onClick={() => copy(st.improved!)}
                    className="shrink-0 text-[9.5px] font-medium px-1.5 py-0 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    복사
                  </button>
                </div>
              )}
              {st?.status === 'error' && (
                <p className="mt-1 pl-[18px] text-[10px] text-rose-600 dark:text-rose-400">
                  {st.err}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
