import { useMemo, useState } from 'react';
import type { Resume } from '@/types/resume';
import { analyzeJdMatch } from '@/lib/jdMatch';

interface Props {
  resume: Resume;
}

/**
 * JdMatchPanel — JD 텍스트 붙여넣기 → 즉시 매칭/누락 키워드 분석.
 * 기존 AI 기반 JDMatch 와 달리 LLM 호출 없이 화이트리스트+정규식으로
 * 기술·도구·프레임워크·도메인 키워드를 추출해 교집합 계산.
 */
export default function JdMatchPanel({ resume }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [jd, setJd] = useState('');

  const result = useMemo(() => analyzeJdMatch(jd, resume), [jd, resume]);

  return (
    <div className="imp-card bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 no-print">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 rounded-[var(--radius-sm)]"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span aria-hidden="true" className="text-base">
            🎯
          </span>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 shrink-0">
            JD 키워드 즉시 매칭
          </h3>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
            채용공고 붙여넣기로 즉시 분석 (LLM 불필요)
          </span>
          {result.totalKeywords > 0 && (
            <span
              className={`text-xs font-bold shrink-0 ${
                result.matchRate >= 70
                  ? 'text-green-600'
                  : result.matchRate >= 40
                    ? 'text-amber-600'
                    : 'text-red-600'
              }`}
            >
              매칭 {result.matchRate}%
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3 animate-in fade-in-0 duration-200">
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="채용공고 전문을 붙여넣으세요. 기술·도구·도메인 키워드를 자동 추출해 이력서와 교집합을 계산합니다."
            rows={6}
            className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 resize-y"
          />

          {result.totalKeywords > 0 ? (
            <div className="space-y-3">
              {/* 요약 */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700">
                <div className="flex-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400">매칭률</div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span
                      className={`text-2xl font-bold ${
                        result.matchRate >= 70
                          ? 'text-green-600'
                          : result.matchRate >= 40
                            ? 'text-amber-600'
                            : 'text-red-600'
                      }`}
                    >
                      {result.matchRate}%
                    </span>
                    <span className="text-xs text-slate-500">
                      {result.matched.length} / {result.totalKeywords} 키워드
                    </span>
                  </div>
                </div>
                <div className="bg-slate-200 dark:bg-slate-600 rounded-full h-2 w-32 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${result.matchRate}%`,
                      backgroundColor:
                        result.matchRate >= 70
                          ? '#16a34a'
                          : result.matchRate >= 40
                            ? '#d97706'
                            : '#dc2626',
                    }}
                  />
                </div>
              </div>

              {/* 매칭 키워드 */}
              {result.matched.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider mb-1.5">
                    ✅ 이미 보유 ({result.matched.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.matched.map((k) => (
                      <span
                        key={k}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 누락 키워드 */}
              {result.missing.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider mb-1.5">
                    ⚠️ 이력서에 없음 ({result.missing.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.missing.map((k) => (
                      <span
                        key={k}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 border-dashed"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    💡 실제 경험이 있다면 이력서에 명시적으로 추가하세요. 같은 기술을 다른 이름으로
                    적었을 수도 있으니 확인 필요 (예: "Next.js" vs "Nextjs").
                  </p>
                </div>
              )}
            </div>
          ) : jd.trim() ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-3 text-center">
              추출 가능한 키워드가 없습니다. 더 긴 공고 전문을 붙여넣어 보세요.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
