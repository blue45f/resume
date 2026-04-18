import { useMemo, useState } from 'react';
import type { Resume } from '@/types/resume';
import { checkKorean, autoFixResume } from '@/lib/koreanChecker';
import { toast } from '@/components/Toast';
import { aiSpellCheck, type AiSpellIssue } from '@/lib/api';

interface Props {
  resume: Resume;
  resumeId?: string;
  /** 자동 수정 적용을 허용하는 부모 핸들러. 전달 시 '전체 자동 수정' 버튼 표시. */
  onApplyFix?: (fixed: Resume) => Promise<void> | void;
}

/**
 * KoreanCheckerPanel — 한국어 이력서 맞춤법·문체 감수.
 * LLM 없이 정규식 기반 25+ 규칙으로 일반 오류·약한 표현·띄어쓰기·
 * 문체 혼용(합니다체 vs 해요체)를 감지.
 */
export default function KoreanCheckerPanel({ resume, resumeId, onApplyFix }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [applying, setApplying] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [aiIssues, setAiIssues] = useState<AiSpellIssue[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const result = useMemo(() => checkKorean(resume), [resume]);

  const runAiCheck = async () => {
    if (!resumeId) {
      toast('AI 체크를 사용하려면 저장된 이력서여야 합니다', 'info');
      return;
    }
    setAiLoading(true);
    try {
      const r = await aiSpellCheck(resumeId);
      setAiIssues(r.issues);
      setAiMode(true);
      toast(`AI 검사 완료 — ${r.issues.length}건 검출 (${r.provider})`, 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'AI 맞춤법 검사 실패', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAutoFix = async () => {
    if (!onApplyFix) return;
    const { resume: fixed, totalChanges } = autoFixResume(resume, 'error');
    if (totalChanges === 0) {
      toast('자동 수정할 오타가 없습니다.', 'info');
      return;
    }
    if (
      !confirm(
        `${totalChanges}개의 맞춤법 오타를 자동 수정할까요?\n(경력·자기소개·프로젝트 설명 대상)`,
      )
    )
      return;
    setApplying(true);
    try {
      await onApplyFix(fixed);
      toast(`${totalChanges}개 오타 자동 수정 완료`, 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : '자동 수정 실패', 'error');
    } finally {
      setApplying(false);
    }
  };

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

          {/* AI vs 규칙 기반 토글 + AI 검사 버튼 */}
          {resumeId && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700">
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setAiMode(false)}
                  className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                    !aiMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  규칙 기반 ({result.issues.length})
                </button>
                <button
                  type="button"
                  onClick={() => aiIssues && setAiMode(true)}
                  disabled={!aiIssues}
                  className={`px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-40 ${
                    aiMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  AI 검수 ({aiIssues?.length ?? '?'})
                </button>
              </div>
              <button
                type="button"
                onClick={runAiCheck}
                disabled={aiLoading}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700 disabled:opacity-50"
              >
                {aiLoading ? (
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      opacity="0.3"
                    />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" fill="none" />
                  </svg>
                ) : (
                  <span aria-hidden>✨</span>
                )}
                {aiLoading ? 'AI 분석 중…' : 'AI 맞춤법 재검사'}
              </button>
            </div>
          )}

          {/* 원클릭 자동 수정 */}
          {onApplyFix && result.issues.some((i) => i.severity === 'error') && (
            <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  명확한 맞춤법 오류 {result.issues.filter((i) => i.severity === 'error').length}건
                </p>
                <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                  한 번의 클릭으로 모두 수정 — 되요/됬/컨텐츠/몇일 등
                </p>
              </div>
              <button
                type="button"
                onClick={handleAutoFix}
                disabled={applying}
                className="shrink-0 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {applying ? '수정 중…' : '전체 자동 수정'}
              </button>
            </div>
          )}

          {/* AI 모드 이슈 */}
          {aiMode && aiIssues && (
            <div className="space-y-2">
              {aiIssues.length === 0 ? (
                <p className="text-xs text-green-600 dark:text-green-400 text-center py-3">
                  ✓ AI 검사 완료 — 맥락상 맞춤법·문체 문제가 없습니다
                </p>
              ) : (
                aiIssues.map((issue, i) => (
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
                          <span className="font-mono text-[11px] line-through text-red-600 dark:text-red-400 break-all">
                            {issue.wrong}
                          </span>
                          <span className="text-slate-400">→</span>
                          <span className="font-mono text-[11px] font-bold text-green-700 dark:text-green-400 break-all">
                            {issue.suggestion}
                          </span>
                        </div>
                        <p
                          className={`mt-1 leading-relaxed ${
                            issue.severity === 'error'
                              ? 'text-red-700 dark:text-red-400'
                              : issue.severity === 'warning'
                                ? 'text-amber-700 dark:text-amber-400'
                                : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {issue.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 이슈 리스트 (규칙 기반) */}
          {!aiMode && result.issues.length > 0 ? (
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
          ) : !aiMode ? (
            <p className="text-xs text-green-600 dark:text-green-400 text-center py-3">
              ✓ 규칙 기반 검사 — 감지된 맞춤법·문체 이슈가 없습니다
            </p>
          ) : null}

          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
            💡 <strong>규칙 기반</strong>: 66+ 정규식 규칙으로 즉시 검사 (무료·오프라인).{' '}
            <strong>AI 검수</strong>: LLM 이 문맥까지 분석 (고정밀·유료). 고유명사·인용문은 오탐
            가능.
          </p>
        </div>
      )}
    </div>
  );
}
