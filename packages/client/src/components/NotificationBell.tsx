import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Popover from '@/shared/ui/Popover';
import { timeAgo } from '@/lib/time';
import { fetchNotifications as apiFetchNotifications, markAllNotificationsRead } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { API_URL } from '@/lib/config';
import { ROUTES } from '@/lib/routes';
import { tx } from '@/lib/i18n';

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
      .then((r) => (r.ok ? r.json() : { count: 0 }))
      .then((d) => setCount(d.count))
      .catch(() => {});
  };

  const fetchAll = () => {
    if (!getToken()) return;
    apiFetchNotifications()
      .then((all) => setNotifications(all.filter((n: Notification) => !n.read)))
      .catch(() => {});
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) fetchAll();
  };

  const markAllRead = async () => {
    if (!getToken()) return;
    await markAllNotificationsRead();
    setCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getNotifIcon = (type: string) => {
    const icons: Record<string, { icon: string; color: string }> = {
      resume_viewed: { icon: '👀', color: 'bg-blue-100 dark:bg-blue-900/30' },
      resume_shared: { icon: '📨', color: 'bg-blue-100 dark:bg-blue-900/30' },
      coaching_nudge: { icon: '💡', color: 'bg-amber-100 dark:bg-amber-900/30' },
      announcement: { icon: '📢', color: 'bg-cyan-100 dark:bg-cyan-900/30' },
      coffee_chat_request: { icon: '☕', color: 'bg-amber-100 dark:bg-amber-900/30' },
      coffee_chat_response: { icon: '☕', color: 'bg-emerald-100 dark:bg-emerald-900/30' },
      coffee_chat_reminder: { icon: '⏰', color: 'bg-amber-100 dark:bg-amber-900/30' },
      coaching_review_request: { icon: '⭐', color: 'bg-yellow-100 dark:bg-yellow-900/30' },
      follow: { icon: '👤', color: 'bg-sky-100 dark:bg-sky-900/30' },
      comment: { icon: '💬', color: 'bg-green-100 dark:bg-green-900/30' },
      scout: { icon: '🏢', color: 'bg-amber-100 dark:bg-amber-900/30' },
      message: { icon: '✉️', color: 'bg-blue-100 dark:bg-blue-900/30' },
      endorsement: { icon: '⭐', color: 'bg-yellow-100 dark:bg-yellow-900/30' },
      bookmark: { icon: '🔖', color: 'bg-blue-100 dark:bg-blue-900/30' },
    };
    return icons[type] || { icon: '🔔', color: 'bg-neutral-100 dark:bg-neutral-700' };
  };

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <button className="relative icon-btn-sm" aria-label={tx('notification.title')}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Content align="end" className="w-80 p-0 overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b border-neutral-100 dark:border-neutral-700">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            {tx('notification.title')}
          </h3>
          {count > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              {tx('notification.markAllRead')}
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-sm text-neutral-400 dark:text-neutral-500 text-center py-8">
              {tx('empty.notifications')}
            </p>
          ) : (
            notifications.map((n) => {
              const notifStyle = getNotifIcon(n.type);
              return (
                <Link
                  key={n.id}
                  to={n.link || '#'}
                  onClick={() => setOpen(false)}
                  className={`flex items-start gap-3 px-3 py-2.5 text-sm border-b border-neutral-50 dark:border-neutral-700/50 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors ${
                    !n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                  }`}
                >
                  <span
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-base ${notifStyle.color}`}
                    aria-hidden="true"
                  >
                    {notifStyle.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-700 dark:text-neutral-300 line-clamp-2 text-[13px]">
                      {n.message}
                    </p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  {!n.read && (
                    <span
                      className="shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })
          )}
        </div>
        <Link
          to={ROUTES.notifications}
          onClick={() => setOpen(false)}
          className="block px-3 py-2 text-center text-xs text-blue-600 dark:text-blue-400 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 border-t border-neutral-100 dark:border-neutral-700"
        >
          전체 보기
        </Link>
      </Popover.Content>
    </Popover.Root>
  );
}
