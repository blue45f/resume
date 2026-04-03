import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/config';


interface TrendPoint {
  version: number;
  sections: number;
  createdAt: string;
}

interface Props {
  resumeId: string;
}

export default function ResumeTrend({ resumeId }: Props) {
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_URL}/api/resumes/trend/${resumeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(setTrend)
      .catch(() => {});
  }, [resumeId]);

  if (trend.length < 2) return null;

  const maxSections = Math.max(...trend.map(t => t.sections), 1);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 no-print">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">변경 추이</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{trend.length}개 버전</span>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 animate-fade-in">
          {/* Mini bar chart */}
          <div className="flex items-end gap-1 h-16 mb-2">
            {trend.map((t, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div
                  className="w-full bg-blue-500 dark:bg-blue-400 rounded-t transition-all duration-300"
                  style={{ height: `${(t.sections / maxSections) * 100}%`, minHeight: '4px' }}
                  title={`v${t.version}: ${t.sections}개 섹션`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>v{trend[0].version}</span>
            <span>v{trend[trend.length - 1].version}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
            {trend[0].sections}개 → {trend[trend.length - 1].sections}개 섹션
            ({trend[trend.length - 1].sections >= trend[0].sections ? '↑' : '↓'}
            {Math.abs(trend[trend.length - 1].sections - trend[0].sections)}개)
          </p>
        </div>
      )}
    </div>
  );
}
