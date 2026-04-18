import { useState } from 'react';
import type { Resume } from '@/types/resume';
import { analyzeAtsCompatibility } from '@/lib/ats';
import type { AtsCheckItem } from '@/lib/ats';

interface Props {
  resume: Resume;
}

const severityColors = {
  error:
    'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400',
  warning:
    'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
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

const recommendationColors: Record<string, { bg: string; text: string; label: string }> = {
  good: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    label: '적정',
  },
  low: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    label: '부족',
  },
  high: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    label: '과다',
  },
};

type DetailTab = 'issues' | 'checklist' | 'keywords';

export default function AtsScorePanel({ resume }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTab>('checklist');
  const result = analyzeAtsCompatibility(resume);

  // Group checklist by category
  const checklistByCategory: Record<string, AtsCheckItem[]> = {};
  for (const item of result.checklist) {
    if (!checklistByCategory[item.category]) checklistByCategory[item.category] = [];
    checklistByCategory[item.category].push(item);
  }

  const passedCount = result.checklist.filter((c) => c.passed).length;
  const totalCount = result.checklist.length;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            ATS 호환성 점수
          </h3>
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${gradeColors[result.grade]}`}>
            {result.grade} ({result.score}점)
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">
            {passedCount}/{totalCount} 항목 통과
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4 animate-fade-in">
          {/* Progress bar */}
          <div className="bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                result.score >= 75
                  ? 'bg-green-500'
                  : result.score >= 50
                    ? 'bg-amber-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${result.score}%` }}
            />
          </div>

          {/* Passed items pills */}
          {result.passed.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {result.passed.map((p, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {p}
                </span>
              ))}
            </div>
          )}

          {/* Detail Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            {[
              { id: 'checklist' as DetailTab, label: '체크리스트' },
              { id: 'issues' as DetailTab, label: `문제점 (${result.issues.length})` },
              { id: 'keywords' as DetailTab, label: '키워드 밀도' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setDetailTab(t.id)}
                className={`flex-1 py-2 text-xs font-medium transition-colors ${
                  detailTab === t.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Checklist Tab */}
          {detailTab === 'checklist' && (
            <div className="space-y-4">
              {Object.entries(checklistByCategory).map(([category, items]) => (
                <div key={category}>
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    {category}
                  </h4>
                  <div className="space-y-1.5">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm ${
                          item.passed
                            ? 'bg-green-50/50 dark:bg-green-900/10'
                            : item.severity === 'error'
                              ? 'bg-red-50/50 dark:bg-red-900/10'
                              : item.severity === 'warning'
                                ? 'bg-amber-50/50 dark:bg-amber-900/10'
                                : 'bg-slate-50 dark:bg-slate-700/30'
                        }`}
                      >
                        {/* Status icon */}
                        {item.passed ? (
                          <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </span>
                        ) : (
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                              item.severity === 'error'
                                ? 'bg-red-500'
                                : item.severity === 'warning'
                                  ? 'bg-amber-500'
                                  : 'bg-slate-400'
                            }`}
                          >
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <span
                            className={`text-sm ${item.passed ? 'text-green-700 dark:text-green-400' : 'text-slate-700 dark:text-slate-300'}`}
                          >
                            {item.label}
                          </span>
                          {item.detail && (
                            <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
                              {item.detail}
                            </span>
                          )}
                        </div>
                        {!item.passed && (
                          <span
                            className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              item.severity === 'error'
                                ? 'bg-red-100 text-red-600'
                                : item.severity === 'warning'
                                  ? 'bg-amber-100 text-amber-600'
                                  : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {severityLabels[item.severity]}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Issues Tab */}
          {detailTab === 'issues' && (
            <div className="space-y-2">
              {result.issues.length > 0 ? (
                result.issues.map((issue, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border text-sm ${severityColors[issue.severity]}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase">
                        {severityLabels[issue.severity]}
                      </span>
                      <span className="text-xs opacity-70">{issue.section}</span>
                    </div>
                    <p className="font-medium">{issue.message}</p>
                    <p className="text-xs mt-1 opacity-80">{issue.tip}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-green-600 dark:text-green-400 text-center py-4">
                  모든 ATS 호환성 검사를 통과했습니다!
                </p>
              )}
            </div>
          )}

          {/* Keyword Density Tab */}
          {detailTab === 'keywords' && (
            <div className="space-y-3">
              {result.keywordDensity.length > 0 ? (
                <>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    기술 키워드가 이력서 전체에 얼마나 자주 등장하는지 분석합니다. 각 키워드가 최소
                    2회 이상 사용되는 것이 좋습니다.
                  </p>
                  <div className="space-y-1.5">
                    {result.keywordDensity.map((kd, i) => {
                      const rec = recommendationColors[kd.recommendation];
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg"
                        >
                          <span className="text-sm text-slate-700 dark:text-slate-300 font-medium flex-1 min-w-0 truncate">
                            {kd.keyword}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                            {kd.count}회
                          </span>
                          <div className="w-16 bg-slate-200 dark:bg-slate-600 rounded-full h-1.5 shrink-0">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                kd.recommendation === 'good'
                                  ? 'bg-green-500'
                                  : kd.recommendation === 'low'
                                    ? 'bg-red-400'
                                    : 'bg-amber-400'
                              }`}
                              style={{ width: `${Math.min(100, kd.count * 20)}%` }}
                            />
                          </div>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${rec.bg} ${rec.text}`}
                          >
                            {rec.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-400 space-y-1">
                    <p className="font-semibold">키워드 밀도 개선 팁:</p>
                    <ul className="space-y-0.5 pl-3">
                      <li>
                        - &quot;부족&quot; 키워드를 경력 설명이나 프로젝트에 자연스럽게 추가하세요
                      </li>
                      <li>- 기술 스택 섹션뿐 아니라 경력 설명에도 키워드를 포함하세요</li>
                      <li>
                        - &quot;과다&quot; 키워드는 자연스럽지 않게 보일 수 있으니 적절히 조절하세요
                      </li>
                    </ul>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                  기술 스택을 입력하면 키워드 밀도를 분석합니다.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
