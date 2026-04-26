import { useState } from 'react';
import type { Resume } from '@/types/resume';

interface Props {
  resume: Resume;
}

function extractKeywords(text: string): Map<string, number> {
  const words = text
    .replace(/<[^>]*>/g, '')
    .toLowerCase()
    .split(/[\s,./·|()[\]{}]+/)
    .filter((w) => w.length >= 2);

  const stopWords = new Set([
    'the',
    'and',
    'for',
    'with',
    'from',
    'that',
    'this',
    'have',
    'been',
    'etc',
    '등',
    '및',
    '또는',
    '위한',
    '대한',
    '통해',
    '기반',
  ]);
  const counts = new Map<string, number>();

  for (const word of words) {
    if (stopWords.has(word) || /^\d+$/.test(word)) continue;
    counts.set(word, (counts.get(word) || 0) + 1);
  }

  return counts;
}

export default function KeywordAnalysis({ resume }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [jd, setJd] = useState('');
  const [showJd, setShowJd] = useState(false);

  const allText = JSON.stringify(resume);
  const keywords = extractKeywords(allText);
  const sorted = [...keywords.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);

  const jdKeywords = jd ? extractKeywords(jd) : null;
  const matchedKeys = jdKeywords
    ? [...jdKeywords.entries()]
        .filter(([k]) => keywords.has(k))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    : [];
  const missingKeys = jdKeywords
    ? [...jdKeywords.entries()]
        .filter(([k]) => !keywords.has(k) && k.length >= 3)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    : [];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 no-print">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">키워드 분석</h3>
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
        <div className="mt-3 space-y-3 animate-fade-in">
          {/* Top keywords */}
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              주요 키워드 (빈도순)
            </p>
            <div className="flex flex-wrap gap-2">
              {sorted.map(([word, count]) => (
                <span
                  key={word}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full"
                >
                  {word} <span className="text-slate-400 dark:text-slate-500">{count}</span>
                </span>
              ))}
            </div>
          </div>

          {/* JD comparison */}
          <div>
            <button
              onClick={() => setShowJd(!showJd)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showJd ? '채용공고 비교 닫기' : '채용공고와 키워드 비교'}
            </button>

            {showJd && (
              <div className="mt-2 space-y-2">
                <textarea
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  placeholder="채용공고 내용을 붙여넣으세요..."
                  rows={4}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />

                {jd && (
                  <div className="stagger-children grid grid-cols-2 gap-2">
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">
                        매칭 키워드 ({matchedKeys.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {matchedKeys.map(([k]) => (
                          <span
                            key={k}
                            className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">
                        누락 키워드 ({missingKeys.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {missingKeys.map(([k]) => (
                          <span
                            key={k}
                            className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
