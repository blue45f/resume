import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { timeAgo } from '@/lib/time';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Activity {
  id: string;
  type: 'version' | 'transform' | 'share';
  resumeId: string;
  resumeTitle?: string;
  description: string;
  createdAt: string;
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [expanded, setExpanded] = useState(false);

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
        // Sort by date desc
        acts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setActivities(acts.slice(0, 5));
      })
      .catch(() => {});
  }, []);

  if (activities.length === 0) return null;

  const icons: Record<string, string> = {
    version: '💾',
    transform: '🤖',
    share: '🔗',
  };

  return (
    <div className="mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors mb-2"
      >
        <span>최근 활동</span>
        <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="space-y-2 animate-fade-in">
          {activities.map(act => (
            <Link
              key={act.id}
              to={`/resumes/${act.resumeId}/preview`}
              className="flex items-center gap-3 p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-sm transition-all duration-200 text-sm"
            >
              <span>{icons[act.type] || '📝'}</span>
              <span className="flex-1 text-slate-700 dark:text-slate-300 truncate">{act.description}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">{timeAgo(act.createdAt)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
