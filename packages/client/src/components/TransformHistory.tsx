import { useState, useEffect } from 'react';
import { fetchTransformHistory } from '@/lib/api';
import { timeAgo } from '@/lib/time';
import type { TransformResult } from '@/types/resume';

interface Props {
  resumeId: string;
}

export default function TransformHistory({ resumeId }: Props) {
  const [history, setHistory] = useState<TransformResult[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchTransformHistory(resumeId)
      .then(setHistory)
      .catch(() => {});
  }, [resumeId]);

  if (history.length === 0) return null;

  const selected = history.find((h) => h.id === selectedId);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 no-print">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          AI 변환 이력 ({history.length})
        </h3>
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
        <div className="mt-3 space-y-2 animate-fade-in">
          {history.map((h) => (
            <button
              key={h.id}
              onClick={() => setSelectedId(selectedId === h.id ? null : h.id)}
              className={`w-full text-left p-3 rounded-lg border transition-colors text-sm ${
                selectedId === h.id
                  ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {h.model || 'AI'}
                </span>
                <span className="text-xs text-slate-400">{timeAgo(h.createdAt)}</span>
              </div>
              {h.tokensUsed > 0 && (
                <span className="text-xs text-slate-400">{h.tokensUsed.toLocaleString()} 토큰</span>
              )}
            </button>
          ))}

          {selected && (
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 animate-fade-in">
              <div className="flex justify-between mb-2">
                <span className="text-xs font-medium text-slate-500">변환 결과</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selected.text);
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  복사
                </button>
              </div>
              <pre className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap max-h-60 overflow-y-auto">
                {selected.text}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
