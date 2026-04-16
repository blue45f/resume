import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { timeAgo } from '@/lib/time';
import { fetchNotifications as apiFetchNotifications, markAllNotificationsRead } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { API_URL } from '@/lib/config';


interface Notification {
  id: string;
  type: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchCount = () => {
    if (!getToken()) return;
    fetch(`${API_URL}/api/notifications/count`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.ok ? r.json() : { count: 0 })
      .then(d => setCount(d.count))
      .catch(() => {});
  };

  const fetchAll = () => {
    if (!getToken()) return;
    apiFetchNotifications()
      .then(all => setNotifications(all.filter((n: Notification) => !n.read)))
      .catch(() => {});
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000); // 30초마다 폴링
    return () => clearInterval(interval);
  }, []);

  const handleOpen = () => {
    setOpen(!open);
    if (!open) fetchAll();
  };

  const markAllRead = async () => {
    if (!getToken()) return;
    await markAllNotificationsRead();
    setCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getNotifIcon = (type: string) => {
    const icons: Record<string, { icon: string; color: string }> = {
      resume_viewed:  { icon: '👀', color: 'bg-blue-100 dark:bg-blue-900/30' },
      follow:         { icon: '👤', color: 'bg-indigo-100 dark:bg-indigo-900/30' },
      comment:        { icon: '💬', color: 'bg-green-100 dark:bg-green-900/30' },
      scout:          { icon: '🏢', color: 'bg-amber-100 dark:bg-amber-900/30' },
      message:        { icon: '✉️', color: 'bg-purple-100 dark:bg-purple-900/30' },
      endorsement:    { icon: '⭐', color: 'bg-yellow-100 dark:bg-yellow-900/30' },
      bookmark:       { icon: '🔖', color: 'bg-rose-100 dark:bg-rose-900/30' },
    };
    return icons[type] || { icon: '🔔', color: 'bg-slate-100 dark:bg-slate-700' };
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg transition-colors"
        aria-label="알림"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl z-50 animate-scale-in overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">알림</h3>
              {count > 0 && (
                <button onClick={markAllRead} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">모두 읽음</button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">알림이 없습니다</p>
              ) : (
                notifications.map(n => {
                const notifStyle = getNotifIcon(n.type);
                return (
                  <Link
                    key={n.id}
                    to={n.link || '#'}
                    onClick={() => setOpen(false)}
                    className={`flex items-start gap-3 px-3 py-2.5 text-sm border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                      !n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-base ${notifStyle.color}`} aria-hidden="true">
                      {notifStyle.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-700 dark:text-slate-300 line-clamp-2 text-[13px]">{n.message}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && <span className="shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5" aria-hidden="true" />}
                  </Link>
                );
              })
              )}
            </div>
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-center text-xs text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-t border-slate-100 dark:border-slate-700"
            >
              전체 보기
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
