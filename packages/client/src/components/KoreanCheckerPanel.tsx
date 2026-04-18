import { useMemo, useState } from 'react';
import type { Resume } from '@/types/resume';
import { checkKorean } from '@/lib/koreanChecker';

interface Props {
  resume: Resume;
}

/**
 * KoreanCheckerPanel — 한국어 이력서 맞춤법·문체 감수.
 * LLM 없이 정규식 기반 25+ 규칙으로 일반 오류·약한 표현·띄어쓰기·
 * 문체 혼용(합니다체 vs 해요체)를 감지.
 */
export default function KoreanCheckerPanel({ resume }: Props) {
  const [expanded, setExpanded] = useState(false);
  const result = useMemo(() => checkKorean(resume), [resume]);

  const errorCount = result.issues.filter((i) => i.severity === 'error').length;
  const warningCount = result.issues.filter((i) => i.severity === 'warning').length;
  const infoCount = result.issues.filter((i) => i.severity === 'info').length;

  const toneLabel = {
    formal: '합니다체',
    polite: '해요체',
    mixed: '혼용',
    none: '판정 불가',
  }[result.toneMix.dominant];

  const toneColor =
    result.toneMix.dominant === 'mixed'
      ? 'text-amber-700 bg-amber-50'
      : result.toneMix.dominant === 'none'
        ? 'text-slate-500 bg-slate-50'
        : 'text-green-700 bg-green-50';

  return (
    <div className="imp-card bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 no-print">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 rounded-[var(--radius-sm)]"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span aria-hidden="true" className="text-base">
            🔤
          </span>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 shrink-0">
            한국어 맞춤법 · 문체 감수
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {result.issues.length === 0
              ? '깔끔합니다'
              : `${errorCount ? `❌${errorCount} ` : ''}${warningCount ? `⚠️${warningCount} ` : ''}${infoCount ? `💡${infoCount}` : ''}`.trim()}
            {' · '}
            <span className={`inline-block px-1.5 py-px rounded ${toneColor}`}>{toneLabel}</span>
          </span>
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
          {/* 문체 요약 */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700">
            <div className="flex-1">
              <div className="text-xs text-slate-500 dark:text-slate-400">문체 분석</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  주 문체: {toneLabel}
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${toneColor}`}>
                  합니다체 {result.toneMix.formal} · 해요체 {result.toneMix.polite}
                </span>
              </div>
              {result.toneMix.dominant === 'mixed' && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                  💡 이력서는 "합니다체" 통일 권장
                </p>
              )}
            </div>
          </div>

          {/* 이슈 리스트 */}
          {result.issues.length > 0 ? (
            <div className="space-y-2">
              {result.issues.map((issue, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border text-xs ${
                    issue.severity === 'error'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : issue.severity === 'warning'
                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                        : 'bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider shrink-0 mt-0.5 opacity-70">
                      {issue.section}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-1.5">
                        <span className="font-mono text-[11px] line-through text-red-600 dark:text-red-400">
                          {issue.wrong}
                        </span>
                        <span className="text-slate-400">→</span>
                        <span className="font-mono text-[11px] font-bold text-green-700 dark:text-green-400">
                          {issue.suggestion}
                        </span>
                      </div>
                      <p
                        className={`mt-1 ${
                          issue.severity === 'error'
                            ? 'text-red-700 dark:text-red-400'
                            : issue.severity === 'warning'
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {issue.reason}
                      </p>
                      {issue.context && issue.context !== issue.wrong && (
                        <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 italic">
                          "...{issue.context}..."
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-green-600 dark:text-green-400 text-center py-3">
              ✓ 감지된 맞춤법·문체 이슈가 없습니다
            </p>
          )}

          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
            💡 자동 감지한 일반적인 오류만 표시 — 고유명사·인용문은 오탐 가능. LLM 호출 없이 패턴
            기반 25+ 규칙으로 즉시 검사합니다.
          </p>
        </div>
      )}
    </div>
  );
}
