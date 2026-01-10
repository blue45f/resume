import { useState } from 'react';
import type { Resume } from '@/types/resume';
import { analyzeAtsCompatibility } from '@/lib/ats';

interface Props {
  resume: Resume;
}

const severityColors = {
  error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400',
  warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
  info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400',
};

const severityLabels = { error: '필수', warning: '권장', info: '참고' };

const gradeColors: Record<string, string> = {
  A: 'text-green-600 bg-green-100 dark:bg-green-900/30',
  B: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  C: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
  D: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
  F: 'text-red-600 bg-red-100 dark:bg-red-900/30',
};

export default function AtsScorePanel({ resume }: Props) {
  const [expanded, setExpanded] = useState(false);
  const result = analyzeAtsCompatibility(resume);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">ATS 호환성 점수</h3>
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${gradeColors[result.grade]}`}>
            {result.grade} ({result.score}점)
          </span>
        </div>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3 animate-fade-in">
          {/* Progress bar */}
          <div className="bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                result.score >= 75 ? 'bg-green-500' : result.score >= 50 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${result.score}%` }}
            />
          </div>

          {/* Passed items */}
          {result.passed.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {result.passed.map((p, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  {p}
                </span>
              ))}
            </div>
          )}

          {/* Issues */}
          {result.issues.length > 0 && (
            <div className="space-y-2">
              {result.issues.map((issue, i) => (
                <div key={i} className={`p-3 rounded-lg border text-sm ${severityColors[issue.severity]}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase">{severityLabels[issue.severity]}</span>
                    <span className="text-xs opacity-70">{issue.section}</span>
                  </div>
                  <p className="font-medium">{issue.message}</p>
                  <p className="text-xs mt-1 opacity-80">{issue.tip}</p>
                </div>
              ))}
            </div>
          )}

          {result.issues.length === 0 && (
            <p className="text-sm text-green-600 dark:text-green-400 text-center py-2">
              모든 ATS 호환성 검사를 통과했습니다!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
