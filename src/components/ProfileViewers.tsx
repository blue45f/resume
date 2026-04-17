import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/config';
import { timeAgo } from '@/lib/time';

interface Viewer {
  id: string;
  label: string;
  viewedAt: string;
  type: 'recruiter' | 'company' | 'personal' | 'anonymous';
}

interface ViewerStats {
  viewers: Viewer[];
  thisWeek: number;
  lastWeek: number;
}

const VIEWER_ICONS: Record<string, string> = {
  recruiter: '👤',
  company: '🏢',
  personal: '🧑',
  anonymous: '👁',
};

export default function ProfileViewers() {
  const [data, setData] = useState<ViewerStats | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`${API_URL}/api/resumes/dashboard/viewers`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d) {
          setData(d);
        } else {
          // Fallback: display view count stats from analytics without random data
          fetch(`${API_URL}/api/resumes/dashboard/analytics`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then(r => (r.ok ? r.json() : null))
            .then(analytics => {
              if (!analytics) return;
              const totalViews = analytics.summary?.totalViews || 0;
              const thisWeek = analytics.summary?.thisWeekViews ?? Math.min(totalViews, 0);
              const lastWeek = analytics.summary?.lastWeekViews ?? 0;
              setData({ viewers: [], thisWeek, lastWeek });
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  if (!data) return null;

  const { viewers, thisWeek, lastWeek } = data;
  const diff = thisWeek - lastWeek;
  const diffPct = lastWeek === 0 ? (thisWeek > 0 ? 100 : 0) : Math.round((diff / lastWeek) * 100);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6 animate-fade-in">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">이번 주 프로필을 본 사람</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {thisWeek}회 조회
              {diffPct !== 0 && (
                <span className={`ml-1.5 ${diff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                  {diff >= 0 ? '+' : ''}{diffPct}% vs 지난 주
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <WeekTrendBars thisWeek={thisWeek} lastWeek={lastWeek} />
          </div>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="mt-4 space-y-2 animate-fade-in">
          {viewers.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
              아직 이번 주 조회 기록이 없습니다
            </p>
          ) : (
            viewers.map(viewer => (
              <div
                key={viewer.id}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700"
              >
                <span className="text-lg shrink-0">{VIEWER_ICONS[viewer.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                    {viewer.label}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    {timeAgo(viewer.viewedAt)}
                  </p>
                </div>
                {viewer.type === 'recruiter' && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded border border-emerald-200 dark:border-emerald-800">
                    채용담당자
                  </span>
                )}
                {viewer.type === 'company' && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded border border-blue-200 dark:border-blue-800">
                    기업
                  </span>
                )}
              </div>
            ))
          )}

          {/* Weekly comparison */}
          <div className="flex items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-700 mt-2">
            <div className="flex-1 text-center">
              <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{thisWeek}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">이번 주</p>
            </div>
            <div className="text-slate-300 dark:text-slate-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
            <div className="flex-1 text-center">
              <p className="text-lg font-bold text-slate-400 dark:text-slate-500">{lastWeek}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">지난 주</p>
            </div>
            <div className="flex-1 text-center">
              {diff > 0 ? (
                <p className="text-lg font-bold text-green-600 dark:text-green-400">+{diff}</p>
              ) : diff < 0 ? (
                <p className="text-lg font-bold text-red-500 dark:text-red-400">{diff}</p>
              ) : (
                <p className="text-lg font-bold text-slate-400">0</p>
              )}
              <p className="text-[10px] text-slate-500 dark:text-slate-400">변화</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WeekTrendBars({ thisWeek, lastWeek }: { thisWeek: number; lastWeek: number }) {
  const max = Math.max(thisWeek, lastWeek, 1);
  return (
    <div className="flex items-end gap-0.5" style={{ height: '20px' }}>
      <div
        className="w-2 bg-slate-300 dark:bg-slate-600 rounded-t-sm transition-all duration-300"
        style={{ height: `${Math.max((lastWeek / max) * 100, 10)}%` }}
        title={`지난 주: ${lastWeek}`}
      />
      <div
        className="w-2 bg-indigo-500 dark:bg-indigo-400 rounded-t-sm transition-all duration-300"
        style={{ height: `${Math.max((thisWeek / max) * 100, 10)}%` }}
        title={`이번 주: ${thisWeek}`}
      />
    </div>
  );
}
