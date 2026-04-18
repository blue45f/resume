import { useMemo, useState } from 'react';
import type { Resume } from '@/types/resume';
import { analyzeAtsCompatibility } from '@/lib/ats';

interface Props {
  resume: Partial<Resume>;
}

const gradeStyles: Record<string, { bar: string; chip: string; label: string }> = {
  A: {
    bar: '#22c55e',
    chip: 'text-green-700 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400',
    label: '우수',
  },
  B: {
    bar: '#3b82f6',
    chip: 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400',
    label: '양호',
  },
  C: {
    bar: '#f59e0b',
    chip: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400',
    label: '보통',
  },
  D: {
    bar: '#f97316',
    chip: 'text-orange-700 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400',
    label: '미흡',
  },
  F: {
    bar: '#ef4444',
    chip: 'text-red-700 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400',
    label: '부족',
  },
};

/**
 * 편집 중 실시간으로 ATS 호환성 점수·등급·주요 이슈 3건을 표시.
 * Preview 페이지의 AtsScorePanel 을 경량화한 버전 — 편집 동선에 최적화.
 */
export default function LiveAtsBadge({ resume }: Props) {
  const [expanded, setExpanded] = useState(false);
  const result = useMemo(() => {
    if (!resume.personalInfo) return null;
    return analyzeAtsCompatibility(resume as Resume);
  }, [resume]);

  if (!result) return null;

  const style = gradeStyles[result.grade] ?? gradeStyles.F;
  const topIssues = result.issues.slice(0, 3);

  return (
    <div className="mb-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
        aria-expanded={expanded}
      >
        <svg width="36" height="36" viewBox="0 0 36 36" className="shrink-0" aria-hidden="true">
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="3"
            className="dark:stroke-slate-700"
          />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke={style.bar}
            strokeWidth="3"
            strokeDasharray={`${(result.score / 100) * 94.2} 94.2`}
            strokeLinecap="round"
            transform="rotate(-90 18 18)"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
          <text x="18" y="22" textAnchor="middle" fontSize="9" fontWeight="bold" fill={style.bar}>
            {result.score}
          </text>
        </svg>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              ATS 호환성
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${style.chip}`}
            >
              {result.grade}등급 · {style.label}
            </span>
            {result.issues.length > 0 && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                개선점 {result.issues.length}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {result.issues.length === 0
              ? '모든 ATS 호환성 검사를 통과했습니다'
              : `${topIssues[0]?.message ?? ''}`}
          </p>
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
        <div className="border-t border-slate-100 dark:border-slate-700 p-3 space-y-2">
          {topIssues.length > 0 ? (
            topIssues.map((issue, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 text-xs rounded-lg px-2.5 py-2 ${
                  issue.severity === 'error'
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    : issue.severity === 'warning'
                      ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                      : 'bg-slate-50 dark:bg-slate-700/30 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="font-semibold uppercase text-[9px] tracking-wider mt-0.5 shrink-0">
                  {issue.section}
                </span>
                <div className="min-w-0">
                  <p className="font-medium">{issue.message}</p>
                  <p className="text-[10px] opacity-80 mt-0.5">{issue.tip}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-green-600 dark:text-green-400 text-center py-2">
              ✓ 지원 시스템 호환성 100점 — 저장 후 미리보기에서 전체 리포트 확인
            </p>
          )}
          {result.issues.length > 3 && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
              + {result.issues.length - 3}건 — 미리보기에서 전체 보기
            </p>
          )}
        </div>
      )}
    </div>
  );
}
