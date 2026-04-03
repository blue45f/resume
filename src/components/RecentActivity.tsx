import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { timeAgo } from '@/lib/time';
import { API_URL } from '@/lib/config';


interface Activity {
  id: string;
  type: 'version' | 'transform' | 'share' | 'view' | 'edit' | 'comment';
  resumeId: string;
  resumeTitle?: string;
  description: string;
  createdAt: string;
}

const ACTIVITY_ICONS: Record<string, JSX.Element> = {
  view: (
    <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  edit: (
    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  version: (
    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  ),
  transform: (
    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  share: (
    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  ),
  comment: (
    <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
    </svg>
  ),
};

function getDateGroup(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const weekStart = new Date(todayStart.getTime() - todayStart.getDay() * 86400000);

  if (date >= todayStart) return '오늘';
  if (date >= yesterdayStart) return '어제';
  if (date >= weekStart) return '이번 주';
  return '이전';
}

const PAGE_SIZE = 5;

export default function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_URL}/api/resumes/dashboard/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const acts: Activity[] = [];
        // Convert recent versions to activities
        for (const v of data.recentVersions || []) {
          acts.push({
            id: v.id,
            type: 'version',
            resumeId: v.resumeId,
            description: `버전 ${v.versionNumber} 저장됨`,
            createdAt: v.createdAt,
          });
        }
        // Convert recent views if available
        for (const v of data.recentViews || []) {
          acts.push({
            id: `view-${v.id || v.resumeId}`,
            type: 'view',
            resumeId: v.resumeId,
            resumeTitle: v.resumeTitle,
            description: v.resumeTitle ? `"${v.resumeTitle}" 조회됨` : '이력서 조회됨',
            createdAt: v.createdAt,
          });
        }
        // Convert recent shares if available
        for (const s of data.recentShares || []) {
          acts.push({
            id: `share-${s.id || s.resumeId}`,
            type: 'share',
            resumeId: s.resumeId,
            description: s.resumeTitle ? `"${s.resumeTitle}" 공유됨` : '이력서 공유됨',
            createdAt: s.createdAt,
          });
        }
        // Sort by date desc
        acts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setActivities(acts);
      })
      .catch(() => {});
  }, []);

  // Group activities by date
  const grouped = useMemo(() => {
    const visible = activities.slice(0, visibleCount);
    const groups: { label: string; items: Activity[] }[] = [];
    const groupOrder = ['오늘', '어제', '이번 주', '이전'];

    for (const act of visible) {
      const label = getDateGroup(act.createdAt);
      let group = groups.find(g => g.label === label);
      if (!group) {
        group = { label, items: [] };
        groups.push(group);
      }
      group.items.push(act);
    }

    // Sort groups in correct order
    groups.sort((a, b) => groupOrder.indexOf(a.label) - groupOrder.indexOf(b.label));
    return groups;
  }, [activities, visibleCount]);

  if (activities.length === 0) return null;

  const hasMore = visibleCount < activities.length;

  return (
    <div className="mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors mb-2"
      >
        <span>최근 활동</span>
        <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full px-1.5 py-0.5">{activities.length}</span>
        <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="animate-fade-in">
          {grouped.map(group => (
            <div key={group.label} className="mb-3">
              <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 px-1">
                {group.label}
              </div>
              <div className="space-y-1.5">
                {group.items.map(act => (
                  <Link
                    key={act.id}
                    to={`/resumes/${act.resumeId}/preview`}
                    className="flex items-center gap-3 p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-sm transition-all duration-200 text-sm"
                  >
                    <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-700/50">
                      {ACTIVITY_ICONS[act.type] || ACTIVITY_ICONS.edit}
                    </span>
                    <span className="flex-1 text-slate-700 dark:text-slate-300 truncate">{act.description}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">{timeAgo(act.createdAt)}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
          {hasMore && (
            <button
              onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
              className="w-full mt-2 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              더보기 ({activities.length - visibleCount}건 남음)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
