import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchFollowers, fetchFollowing, fetchScouts } from '@/lib/api';
import { API_URL } from '@/lib/config';

interface NetworkData {
  followers: number;
  following: number;
  weeklyViews: number;
  scoutCount: number;
}

export default function NetworkStats() {
  const [data, setData] = useState<NetworkData | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetchFollowers().catch(() => []),
      fetchFollowing().catch(() => []),
      fetchScouts().catch(() => []),
      fetch(`${API_URL}/api/resumes/dashboard/analytics`, { headers })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([followers, following, scouts, analytics]) => {
      const weeklyViews = (analytics?.dailyViews || [])
        .slice(-7)
        .reduce((sum: number, v: number) => sum + v, 0);
      setData({
        followers: Array.isArray(followers) ? followers.length : 0,
        following: Array.isArray(following) ? following.length : 0,
        weeklyViews,
        scoutCount: Array.isArray(scouts) ? scouts.length : 0,
      });
    });
  }, []);

  if (!data) return null;

  const items = [
    {
      label: '팔로워',
      value: data.followers,
      suffix: '명',
      icon: (
        <svg
          className="w-4 h-4 text-blue-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      link: '/explore?tab=people',
    },
    {
      label: '팔로잉',
      value: data.following,
      suffix: '명',
      icon: (
        <svg
          className="w-4 h-4 text-indigo-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
      link: '/explore?tab=people',
    },
    {
      label: '이번 주 조회',
      value: data.weeklyViews,
      suffix: '회',
      icon: (
        <svg
          className="w-4 h-4 text-purple-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      ),
      link: '/',
    },
    {
      label: '받은 스카우트',
      value: data.scoutCount,
      suffix: '건',
      icon: (
        <svg
          className="w-4 h-4 text-emerald-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
      link: '/messages',
    },
  ];

  return (
    <div className="mb-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <svg
            className="w-4 h-4 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          내 네트워크
        </h3>
        <Link
          to="/explore?tab=people"
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          더보기
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((item) => (
          <Link
            key={item.label}
            to={item.link}
            className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
          >
            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm">
              {item.icon}
            </span>
            <div className="min-w-0">
              <div className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {item.value}
                <span className="text-xs font-normal text-slate-400 ml-0.5">{item.suffix}</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {item.label}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
