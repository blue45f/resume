import { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CardGridSkeleton } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import { timeAgo } from '@/lib/time';
import {
  fetchNotifications as apiFetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  deleteNotification,
  deleteNotificationsBulk,
} from '@/lib/api';
import { getToken } from '@/lib/auth';
import { toast } from '@/components/Toast';

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

const FILTER_TABS: { key: FilterTab; label: string; icon: string }[] = [
  { key: 'all', label: '전체', icon: '🔔' },
  { key: 'unread', label: '안 읽음', icon: '🔴' },
  { key: 'system', label: '시스템', icon: '⚙️' },
  { key: 'social', label: '소셜', icon: '💬' },
];

const TYPE_META: Record<string, { icon: string; bg: string; label: string; color: string }> = {
  comment: {
    icon: '💬',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    label: '댓글',
    color: 'text-blue-600 dark:text-blue-400',
  },
  bookmark: {
    icon: '🔖',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    label: '북마크',
    color: 'text-amber-600 dark:text-amber-400',
  },
  scout: {
    icon: '📨',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    label: '스카우트',
    color: 'text-purple-600 dark:text-purple-400',
  },
  message: {
    icon: '✉️',
    bg: 'bg-green-100 dark:bg-green-900/30',
    label: '쪽지',
    color: 'text-green-600 dark:text-green-400',
  },
  application_comment: {
    icon: '📋',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    label: '지원',
    color: 'text-orange-600 dark:text-orange-400',
  },
  system: {
    icon: '⚙️',
    bg: 'bg-slate-100 dark:bg-slate-700',
    label: '시스템',
    color: 'text-slate-600 dark:text-slate-400',
  },
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
  const queryClient = useQueryClient();
  const { data: notifications = [], isLoading: loading } = useQuery({
    queryKey: ['notifications'],
    queryFn: apiFetchNotifications,
    enabled: !!getToken(),
    staleTime: 30_000,
  });
  const [filter, setFilter] = useState<FilterTab>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const navigate = useNavigate();

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    toast('모든 알림을 읽음 처리했습니다', 'success');
  }, [queryClient]);

  const handleMarkRead = useCallback(
    async (id: string) => {
      await markNotificationRead(id).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    [queryClient],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setExpandedAction(null);
      await deleteNotification(id).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    [queryClient],
  );

  const handleBulkDelete = useCallback(async () => {
    if (!selectedIds.size) return;
    const ids = [...selectedIds];
    setSelectedIds(new Set());
    setSelectMode(false);
    await deleteNotificationsBulk(ids).catch(() => {});
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    toast(`${ids.length}개 알림이 삭제되었습니다`, 'success');
  }, [selectedIds, queryClient]);

  const handleBulkMarkRead = useCallback(async () => {
    await Promise.all([...selectedIds].map((id) => markNotificationRead(id).catch(() => {})));
    setSelectedIds(new Set());
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    toast('선택한 알림을 읽음 처리했습니다', 'success');
  }, [selectedIds, queryClient]);

  const filtered = useMemo(() => {
    switch (filter) {
      case 'unread':
        return notifications.filter((n) => !n.read);
      case 'system':
        return notifications.filter((n) => SYSTEM_TYPES.includes(n.type));
      case 'social':
        return notifications.filter((n) => SOCIAL_TYPES.includes(n.type));
      default:
        return notifications;
    }
  }, [notifications, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, Notification[]>();
    for (const n of filtered) {
      const key = getDateGroup(n.createdAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(n);
    }
    const entries: [string, Notification[]][] = [];
    for (const g of GROUP_ORDER) {
      if (map.has(g)) entries.push([g, map.get(g)!]);
    }
    return entries;
  }, [filtered]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const totalCount = notifications.length;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const tabCounts = useMemo(
    () => ({
      all: notifications.length,
      unread: notifications.filter((n) => !n.read).length,
      system: notifications.filter((n) => SYSTEM_TYPES.includes(n.type)).length,
      social: notifications.filter((n) => SOCIAL_TYPES.includes(n.type)).length,
    }),
    [notifications],
  );

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8"
        role="main"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <div className="w-9 h-9 bg-neutral-900 dark:bg-white rounded-xl flex items-center justify-center shadow-sm">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              알���
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold bg-red-500 text-white rounded-full animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              총 {totalCount}개 알림 · {unreadCount}개 읽지 않음
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && !selectMode && (
              <button
                onClick={markAllRead}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
              >
                모두 읽음
              </button>
            )}
            <button
              onClick={() => {
                setSelectMode(!selectMode);
                setSelectedIds(new Set());
                setExpandedAction(null);
              }}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all font-medium ${
                selectMode
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {selectMode ? '완료' : '편집'}
            </button>
            <Link
              to="/settings"
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="알림 설정"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* Bulk actions bar */}
        {selectMode && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl animate-fade-in">
            <span className="text-sm text-indigo-700 dark:text-indigo-400 font-medium flex-1">
              {selectedIds.size > 0 ? `${selectedIds.size}개 선택됨` : '항목을 선택하세요'}
            </span>
            <button
              onClick={() =>
                selectedIds.size === filtered.length
                  ? setSelectedIds(new Set())
                  : setSelectedIds(new Set(filtered.map((n) => n.id)))
              }
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {selectedIds.size === filtered.length ? '선택 해제' : '전체 선택'}
            </button>
            {selectedIds.size > 0 && (
              <>
                <button
                  onClick={handleBulkMarkRead}
                  className="text-xs px-2.5 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                >
                  읽음 처리
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="text-xs px-2.5 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  삭제
                </button>
              </>
            )}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl whitespace-nowrap transition-all ${
                filter === tab.key
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
              }`}
            >
              <span className="text-sm">{tab.icon}</span>
              {tab.label}
              {tabCounts[tab.key] > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    filter === tab.key
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {tabCounts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <CardGridSkeleton count={5} />
        ) : !getToken() ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
              🔔
            </div>
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
              로그인이 필요합니다
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              알림을 확인하려면 로그인해주세요
            </p>
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
            >
              로그인
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState type="notification" />
        ) : (
          <div className="space-y-6">
            {grouped.map(([group, items]) => (
              <div key={group}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {group}
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-slate-200 dark:from-slate-700 to-transparent" />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {items.length}개
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map((n) => {
                    const meta = TYPE_META[n.type] || {
                      icon: '🔔',
                      bg: 'bg-slate-100 dark:bg-slate-700',
                      label: '알림',
                      color: 'text-slate-600',
                    };
                    const isSelected = selectedIds.has(n.id);
                    const isActionOpen = expandedAction === n.id;

                    return (
                      <div
                        key={n.id}
                        className={`group relative flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 ${
                          isSelected
                            ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-600'
                            : !n.read
                              ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800/60 shadow-sm shadow-indigo-100 dark:shadow-none'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        {/* Checkbox */}
                        {selectMode && (
                          <button
                            onClick={() => toggleSelect(n.id)}
                            className={`shrink-0 mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-600 shadow-sm'
                                : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400'
                            }`}
                          >
                            {isSelected && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </button>
                        )}

                        {/* Icon */}
                        <div
                          className={`shrink-0 w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center text-lg shadow-sm`}
                        >
                          {meta.icon}
                        </div>

                        {/* Content */}
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => {
                            if (selectMode) {
                              toggleSelect(n.id);
                              return;
                            }
                            if (!n.read) handleMarkRead(n.id);
                            if (n.link) navigate(n.link);
                          }}
                        >
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[10px] font-semibold ${meta.color}`}>
                              {meta.label}
                            </span>
                            {!n.read && <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
                          </div>
                          <p
                            className={`text-sm leading-relaxed ${!n.read ? 'font-medium text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}
                          >
                            {n.message}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                            {timeAgo(n.createdAt)}
                          </p>
                        </div>

                        {/* Actions */}
                        {!selectMode && (
                          <div className="shrink-0 flex items-center gap-1">
                            {/* Quick action button */}
                            <button
                              onClick={() => setExpandedAction(isActionOpen ? null : n.id)}
                              className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                />
                              </svg>
                            </button>

                            {/* Dropdown */}
                            {isActionOpen && (
                              <div className="absolute right-3 top-12 z-10 imp-card shadow-lg py-1 min-w-[120px] animate-fade-in">
                                {!n.read && (
                                  <button
                                    onClick={() => {
                                      handleMarkRead(n.id);
                                      setExpandedAction(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                  >
                                    <svg
                                      className="w-3.5 h-3.5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                    읽음 처리
                                  </button>
                                )}
                                {n.link && (
                                  <button
                                    onClick={() => {
                                      setExpandedAction(null);
                                      navigate(n.link!);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                  >
                                    <svg
                                      className="w-3.5 h-3.5"
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
                                    이동
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDelete(n.id)}
                                  className="w-full text-left px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                >
                                  <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                  삭제
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary footer */}
        {!loading && filtered.length > 0 && (
          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              최근 50개 알림이 표시됩니다 · 30일이 지난 읽은 알림은 자동 삭제됩니다
            </p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
