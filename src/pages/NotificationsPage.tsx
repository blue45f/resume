import { getUser } from '@/lib/auth';
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CardGridSkeleton } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import { timeAgo } from '@/lib/time';
import { fetchNotifications as apiFetchNotifications, markAllNotificationsRead } from '@/lib/api';
import { getToken } from '@/lib/auth';


interface Notification {
  id: string;
  type: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

type FilterTab = 'all' | 'unread' | 'system' | 'social';

const SYSTEM_TYPES = ['system', 'scout', 'application_comment'];
const SOCIAL_TYPES = ['comment', 'bookmark', 'message'];

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'unread', label: '안 읽음' },
  { key: 'system', label: '시스템' },
  { key: 'social', label: '소셜' },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('all');

  useEffect(() => {
    document.title = '알림 — 이력서공방';
    if (!getToken()) { setLoading(false); return; }
    apiFetchNotifications()
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);

  const markAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const typeIcons: Record<string, string> = {
    comment: '💬', bookmark: '🔖', scout: '📨', message: '✉️', application_comment: '📋', system: '⚙️',
  };

  const filtered = useMemo(() => {
    switch (filter) {
      case 'unread': return notifications.filter(n => !n.read);
      case 'system': return notifications.filter(n => SYSTEM_TYPES.includes(n.type));
      case 'social': return notifications.filter(n => SOCIAL_TYPES.includes(n.type));
      default: return notifications;
    }
  }, [notifications, filter]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8" role="main">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            알림
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">모두 읽음</button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                filter === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {tab.label}
              {tab.key === 'unread' && unreadCount > 0 && (
                <span className={`ml-1 ${filter === tab.key ? 'text-blue-200' : 'text-slate-400 dark:text-slate-500'}`}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <CardGridSkeleton count={3} />
        ) : filtered.length === 0 ? (
          <EmptyState type="notification" />
        ) : (
          <div className="space-y-2">
            {filtered.map(n => (
              <Link
                key={n.id}
                to={n.link || '#'}
                className={`block p-4 rounded-xl border transition-all duration-200 ${
                  !n.read
                    ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg shrink-0">{typeIcons[n.type] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-300">{n.message}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2" />}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
