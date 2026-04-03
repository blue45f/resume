import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { timeAgo } from '@/lib/time';
import { API_URL } from '@/lib/config';


interface Activity {
  id: string;
  type: 'version' | 'transform' | 'share' | 'view' | 'edit' | 'comment' | 'follow' | 'social_comment' | 'scout';
  resumeId: string;
  resumeTitle?: string;
  description: string;
  createdAt: string;
  actorName?: string;
  isSocial?: boolean;
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
  follow: (
    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  social_comment: (
    <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  scout: (
    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
};

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500',
  'bg-cyan-500', 'bg-rose-500', 'bg-amber-500', 'bg-teal-500',
];

function getAvatarBg(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

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

    // Fetch social activities (followers, comments, scouts)
    const socialEndpoints = [
      { url: `${API_URL}/api/social/followers`, type: 'follow' as const, msgFn: (item: any) => `${item.name || '사용자'}님이 당신을 팔로우했습니다` },
      { url: `${API_URL}/api/social/scouts`, type: 'scout' as const, msgFn: (item: any) => `${item.senderName || item.companyName || '기업'}님이 스카우트를 보냈습니다` },
    ];

    for (const ep of socialEndpoints) {
      fetch(ep.url, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then((items: any[]) => {
          if (!Array.isArray(items) || items.length === 0) return;
          const socialActs: Activity[] = items.slice(0, 5).map((item, i) => ({
            id: `${ep.type}-${item.id || i}`,
            type: ep.type,
            resumeId: item.resumeId || '',
            description: ep.msgFn(item),
            createdAt: item.createdAt || new Date().toISOString(),
            actorName: item.name || item.senderName || item.companyName || '사용자',
            isSocial: true,
          }));
          setActivities(prev => {
            const merged = [...prev, ...socialActs];
            merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return merged;
          });
        })
        .catch(() => {});
    }

    // Fetch recent comments on user's resumes
    fetch(`${API_URL}/api/resumes`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then((resumes: any[]) => {
        if (!Array.isArray(resumes)) return;
        const commentPromises = resumes.slice(0, 5).map(resume =>
          fetch(`${API_URL}/api/resumes/${resume.id}/comments`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : [])
            .then((comments: any[]) =>
              (Array.isArray(comments) ? comments : [])
                .filter((c: any) => c.userId !== JSON.parse(localStorage.getItem('user') || '{}').id)
                .slice(0, 3)
                .map((c: any) => ({
                  id: `social_comment-${c.id}`,
                  type: 'social_comment' as const,
                  resumeId: resume.id,
                  resumeTitle: resume.title,
                  description: `${c.userName || c.name || '사용자'}님이 이력서에 댓글을 남겼습니다`,
                  createdAt: c.createdAt || new Date().toISOString(),
                  actorName: c.userName || c.name || '사용자',
                  isSocial: true,
                }))
            )
            .catch(() => [] as Activity[])
        );
        Promise.all(commentPromises).then(results => {
          const allComments = results.flat();
          if (allComments.length === 0) return;
          setActivities(prev => {
            const merged = [...prev, ...allComments];
            merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return merged;
          });
        });
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
                {group.items.map(act => {
                  const isSocial = act.isSocial || ['follow', 'social_comment', 'scout'].includes(act.type);
                  const linkTo = act.resumeId ? `/resumes/${act.resumeId}/preview` : '/explore';

                  return (
                    <Link
                      key={act.id}
                      to={linkTo}
                      className="flex items-center gap-3 p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-sm transition-all duration-200 text-sm"
                    >
                      {isSocial && act.actorName ? (
                        <span className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-white text-xs font-bold ${getAvatarBg(act.actorName)}`}>
                          {act.actorName.charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-700/50">
                          {ACTIVITY_ICONS[act.type] || ACTIVITY_ICONS.edit}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-slate-700 dark:text-slate-300 truncate block">{act.description}</span>
                        {isSocial && act.resumeTitle && (
                          <span className="text-xs text-slate-400 dark:text-slate-500 truncate block">"{act.resumeTitle}"</span>
                        )}
                      </div>
                      {isSocial && (
                        <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                          {ACTIVITY_ICONS[act.type]}
                        </span>
                      )}
                      <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">{timeAgo(act.createdAt)}</span>
                    </Link>
                  );
                })}
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
