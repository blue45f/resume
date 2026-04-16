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

const TYPE_ICONS: Record<string, { icon: string; bg: string }> = {
  comment: { icon: '💬', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  bookmark: { icon: '🔖', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  scout: { icon: '📨', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  message: { icon: '✉️', bg: 'bg-green-100 dark:bg-green-900/30' },
  application_comment: { icon: '📋', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  system: { icon: '⚙️', bg: 'bg-slate-100 dark:bg-slate-700' },
};

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return '이번 주';
  if (diffDays < 30) return '이번 달';
  return '이전';
}

const GROUP_ORDER = ['오늘', '어제', '이번 주', '이번 달', '이전'];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

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

  const filtered = useMemo(() => {
    switch (filter) {
      case 'unread': return notifications.filter(n => !n.read);
      case 'system': return notifications.filter(n => SYSTEM_TYPES.includes(n.type));
      case 'social': return notifications.filter(n => SOCIAL_TYPES.includes(n.type));
      default: return notifications;
    }
  }, [notifications, filter]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, Notification[]>();
    for (const n of filtered) {
      const key = getDateGroup(n.createdAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(n);
    }
    // Sort groups
    const entries: [string, Notification[]][] = [];
    for (const g of GROUP_ORDER) {
      if (map.has(g)) entries.push([g, map.get(g)!]);
    }
    return entries;
  }, [filtered]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(filtered.map(n => n.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const deleteSelected = () => {
    setNotifications(prev => prev.filter(n => !selectedIds.has(n.id)));
    setSelectedIds(new Set());
    if (selectedIds.size === filtered.length) setSelectMode(false);
  };

  const markSelectedRead = () => {
    setNotifications(prev => prev.map(n => selectedIds.has(n.id) ? { ...n, read: true } : n));
    setSelectedIds(new Set());
  };

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8" role="main">
        {/* Title bar */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            알림
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 text-xs font-bold bg-red-500 text-white rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </h1>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && !selectMode && (
              <button onClick={markAllRead} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                모두 읽음
              </button>
            )}
            <button
              onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${selectMode ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
            >
              {selectMode ? '선택 취소' : '선택'}
            </button>
          </div>
        </div>

        {/* Bulk actions bar */}
        {selectMode && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl animate-fade-in">
            <span className="text-sm text-indigo-700 dark:text-indigo-400 font-medium flex-1">
              {selectedIds.size > 0 ? `${selectedIds.size}개 선택됨` : '항목을 선택하세요'}
            </span>
            <button onClick={selectAll} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">전체 선택</button>
            {selectedIds.size > 0 && (
              <>
                <button onClick={deselectAll} className="text-xs text-slate-500 hover:underline">선택 해제</button>
                <button
                  onClick={markSelectedRead}
                  className="text-xs px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600"
                >
                  읽음 처리
                </button>
                <button
                  onClick={deleteSelected}
                  className="text-xs px-2.5 py-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                >
                  삭제
                </button>
              </>
            )}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors ${
                filter === tab.key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {tab.label}
              {tab.key === 'unread' && unreadCount > 0 && (
                <span className={`ml-1.5 text-xs ${filter === tab.key ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'}`}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <CardGridSkeleton count={4} />
        ) : filtered.length === 0 ? (
          <EmptyState type="notification" />
        ) : (
          <div className="space-y-6">
            {grouped.map(([group, items]) => (
              <div key={group}>
                {/* Date group label */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">{group}</span>
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700" />
                </div>
                <div className="space-y-2">
                  {items.map(n => {
                    const typeInfo = TYPE_ICONS[n.type] || { icon: '🔔', bg: 'bg-slate-100 dark:bg-slate-700' };
                    const isSelected = selectedIds.has(n.id);
                    return (
                      <div
                        key={n.id}
                        className={`flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 ${
                          isSelected
                            ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-600'
                            : !n.read
                            ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {/* Checkbox (select mode) */}
                        {selectMode && (
                          <button
                            onClick={() => toggleSelect(n.id)}
                            className={`shrink-0 mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-600'
                                : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400'
                            }`}
                          >
                            {isSelected && (
                              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        )}

                        {/* Icon */}
                        <span className={`shrink-0 w-8 h-8 rounded-xl ${typeInfo.bg} flex items-center justify-center text-base`}>
                          {typeInfo.icon}
                        </span>

                        {/* Content */}
                        <Link
                          to={selectMode ? '#' : (n.link || '#')}
                          onClick={selectMode ? (e) => { e.preventDefault(); toggleSelect(n.id); } : undefined}
                          className="flex-1 min-w-0 block"
                        >
                          <p className={`text-sm ${!n.read ? 'font-semibold text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}>
                            {n.message}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{timeAgo(n.createdAt)}</p>
                        </Link>

                        {/* Unread dot */}
                        {!n.read && !selectMode && (
                          <span className="shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2" aria-label="읽지 않음" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
