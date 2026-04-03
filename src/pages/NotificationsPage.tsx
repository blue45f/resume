import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { timeAgo } from '@/lib/time';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Notification {
  id: string;
  type: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = '알림 — 이력서공방';
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    fetch(`${API_URL}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);

  const markAllRead = async () => {
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/api/notifications/read-all`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const typeIcons: Record<string, string> = {
    comment: '💬', bookmark: '🔖', scout: '📨', message: '✉️', application_comment: '📋',
  };

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8" role="main">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">알림</h1>
          {notifications.some(n => !n.read) && (
            <button onClick={markAllRead} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">모두 읽음</button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">불러오는 중...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-slate-500 dark:text-slate-400">알림이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
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
