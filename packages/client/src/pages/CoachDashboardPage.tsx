import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  type CoachingSession,
  type MySessionsResponse,
  type CoffeeChat,
  fetchCoffeeChats,
} from '@/lib/api';
import { useMyCoachingSessions } from '@/hooks/useResources';
import { getUser } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';
import { tx } from '@/lib/i18n';
import SendMessageButton from '@/components/SendMessageButton';

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatRelative(iso: string) {
  try {
    const d = new Date(iso).getTime();
    const now = Date.now();
    const diff = d - now;
    const abs = Math.abs(diff);
    const min = 60 * 1000;
    const hour = 60 * min;
    const day = 24 * hour;
    if (abs < hour) return `${Math.round(diff / min)}분 ${diff >= 0 ? '후' : '전'}`;
    if (abs < day) return `${Math.round(diff / hour)}시간 ${diff >= 0 ? '후' : '전'}`;
    return `${Math.round(diff / day)}일 ${diff >= 0 ? '후' : '전'}`;
  } catch {
    return '';
  }
}

export default function CoachDashboardPage() {
  const navigate = useNavigate();
  const user = getUser();
  const isCoach = !!user && user.userType === 'coach';
  const sessionsQuery = useMyCoachingSessions();
  const data: MySessionsResponse | null =
    (sessionsQuery.data as MySessionsResponse | undefined) ?? null;
  const loading = isCoach && sessionsQuery.isLoading;
  const error: string | null = sessionsQuery.error
    ? (sessionsQuery.error as any)?.message || '데이터를 불러오지 못했습니다'
    : null;
  const [coffeeChats, setCoffeeChats] = useState<CoffeeChat[]>([]);
  const [coffeeChatsLoading, setCoffeeChatsLoading] = useState(false);
  const [unreadReviewNotifs, setUnreadReviewNotifs] = useState<number>(0);

  useEffect(() => {
    if (!isCoach) return;
    // 받은 평점/리뷰 알림 미읽음 count
    fetch('/api/notifications', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: any[]) => {
        const cnt = rows.filter((n) => n?.type === 'coaching_review_received' && !n.read).length;
        setUnreadReviewNotifs(cnt);
      })
      .catch(() => setUnreadReviewNotifs(0));
  }, [isCoach]);

  useEffect(() => {
    if (!isCoach) return;
    let cancelled = false;
    setCoffeeChatsLoading(true);
    fetchCoffeeChats('received', 'pending')
      .then((rows) => {
        if (!cancelled) setCoffeeChats(rows || []);
      })
      .catch(() => {
        if (!cancelled) setCoffeeChats([]);
      })
      .finally(() => {
        if (!cancelled) setCoffeeChatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isCoach]);

  useEffect(() => {
    document.title = '코치 대시보드 — 이력서공방';
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, []);

  useEffect(() => {
    if (!user) {
      navigate(ROUTES.login);
      return;
    }
    if (user.userType !== 'coach') {
      navigate(ROUTES.coaching.profileEdit);
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const coachSessions: CoachingSession[] = data?.asCoach || [];

  const stats = useMemo(() => {
    const total = coachSessions.length;
    const now = new Date();
    const thisMonth = coachSessions.filter((s) => {
      if (s.status !== 'completed') return false;
      const d = new Date(s.updatedAt || s.scheduledAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    const monthEarnings = thisMonth.reduce((sum, s) => sum + (s.coachEarn || 0), 0);
    const rated = coachSessions.filter((s) => s.rating != null && s.rating > 0);
    const avgRating =
      rated.length > 0 ? rated.reduce((sum, s) => sum + (s.rating || 0), 0) / rated.length : 0;
    const pending = coachSessions.filter((s) => s.status === 'requested').length;
    return { total, monthEarnings, avgRating, pending };
  }, [coachSessions]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return coachSessions
      .filter(
        (s) =>
          (s.status === 'confirmed' || s.status === 'requested') &&
          new Date(s.scheduledAt).getTime() >= now - 60 * 60 * 1000,
      )
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .slice(0, 8);
  }, [coachSessions]);

  const recentReviews = useMemo(() => {
    return coachSessions
      .filter((s) => s.rating != null && s.rating > 0)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6);
  }, [coachSessions]);

  if (!user) return null;

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        role="main"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-700 rounded-xl flex items-center justify-center shadow-sm">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <h1 className="heading-accent text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                {tx('nav.coaching')} · {tx('admin.dashboard')}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {user.name}님의 코칭 현황
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={ROUTES.coaching.profileEdit}
              className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              프로필 수정
            </Link>
            <Link
              to={ROUTES.coaching.sessions}
              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-sky-700 text-white hover:from-blue-700 hover:to-cyan-700 shadow-sm"
            >
              세션 내역
            </Link>
          </div>
        </div>

        {error ? (
          <div className="imp-card p-8 text-center">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            <div className="stagger-children grid grid-cols-2 sm:grid-cols-4 gap-3">
              {loading
                ? [1, 2, 3, 4].map((i) => (
                    <div key={i} className="imp-card p-4 animate-pulse">
                      <div className="h-4 w-6 bg-slate-200 dark:bg-slate-700 rounded mb-2 mx-auto" />
                      <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded mx-auto mb-1" />
                      <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded mx-auto" />
                    </div>
                  ))
                : [
                    { label: '총 세션 수', value: stats.total, icon: '📚', color: 'text-blue-600' },
                    {
                      label: '이번 달 수익',
                      value: `${stats.monthEarnings.toLocaleString()}원`,
                      icon: '💰',
                      color: 'text-emerald-600',
                    },
                    {
                      label: '평균 평점',
                      value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—',
                      icon: '⭐',
                      color: 'text-amber-500',
                    },
                    {
                      label: '대기 중 요청',
                      value: stats.pending,
                      icon: '⏳',
                      color: 'text-blue-700',
                    },
                  ].map((s) => (
                    <div key={s.label} className="imp-card p-4 text-center">
                      <span className="text-lg block mb-1">{s.icon}</span>
                      <span className={`text-2xl font-bold ${s.color} block`}>{s.value}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{s.label}</span>
                    </div>
                  ))}
            </div>

            {/* Pending coffee chat requests */}
            {(coffeeChatsLoading || coffeeChats.length > 0) && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <span className="text-amber-500" aria-hidden="true">
                      ☕
                    </span>
                    받은 커피챗 신청
                    {coffeeChats.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-full">
                        {coffeeChats.length}
                      </span>
                    )}
                  </h2>
                  <Link
                    to={ROUTES.social.coffeeChats}
                    className="text-xs text-blue-700 hover:underline"
                  >
                    전체 보기
                  </Link>
                </div>
                {coffeeChatsLoading ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="imp-card p-4 animate-pulse">
                        <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                        <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-700 rounded" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {coffeeChats.slice(0, 5).map((c) => {
                      const modalityLabel =
                        c.modality === 'video'
                          ? '🎥 화상'
                          : c.modality === 'voice'
                            ? '🎙 음성'
                            : '💬 채팅';
                      return (
                        <li key={c.id}>
                          <Link
                            to={ROUTES.social.coffeeChats}
                            className="imp-card p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                                  {modalityLabel} · {c.durationMin}분
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {formatRelative(c.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {c.requester.name}
                                {c.topic ? (
                                  <span className="text-slate-500"> · {c.topic}</span>
                                ) : null}
                              </p>
                              {c.message && (
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                                  {c.message}
                                </p>
                              )}
                            </div>
                            <span className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500 text-white hover:bg-amber-600 self-start">
                              응답하기 →
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}

            {/* Upcoming sessions timeline */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  예정된 세션
                </h2>
                <Link
                  to={ROUTES.coaching.sessions}
                  className="text-xs text-blue-700 hover:underline"
                >
                  전체 보기
                </Link>
              </div>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="imp-card p-4 animate-pulse">
                      <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                      <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-700 rounded" />
                    </div>
                  ))}
                </div>
              ) : upcoming.length === 0 ? (
                <div className="imp-card p-8 text-center">
                  <p className="text-3xl mb-2">🗓</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    예정된 세션이 없습니다
                  </p>
                </div>
              ) : (
                <ol className="relative border-l-2 border-blue-100 dark:border-blue-900/40 ml-3 space-y-3">
                  {upcoming.map((s) => {
                    const statusBadge =
                      s.status === 'requested'
                        ? {
                            label: '요청됨',
                            cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
                          }
                        : {
                            label: '확정',
                            cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
                          };
                    const clientName = s.client?.name || '고객';
                    return (
                      <li key={s.id} className="ml-4">
                        <span
                          className="absolute -left-[7px] w-3 h-3 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900"
                          aria-hidden="true"
                        />
                        <div className="imp-card p-4">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${statusBadge.cls}`}
                                >
                                  {statusBadge.label}
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {formatRelative(s.scheduledAt)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                  {clientName} · {s.duration}분
                                </p>
                                <SendMessageButton
                                  variant="mini"
                                  targetUserId={s.client?.id || s.clientId}
                                  targetUserName={clientName}
                                />
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {formatDate(s.scheduledAt)}
                              </p>
                              {s.note && (
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 bg-slate-50 dark:bg-slate-800/50 rounded-md px-2.5 py-1.5">
                                  요청: {s.note}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-medium text-emerald-600">
                                +{(s.coachEarn || 0).toLocaleString()}원
                              </span>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>

            {/* Recent reviews */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  최근 리뷰
                  {unreadReviewNotifs > 0 && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 rounded-full animate-pulse"
                      title="새로운 리뷰가 있어요"
                    >
                      ⭐ NEW {unreadReviewNotifs}
                    </span>
                  )}
                </h2>
              </div>
              {loading ? (
                <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="imp-card p-4 animate-pulse">
                      <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                      <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded" />
                    </div>
                  ))}
                </div>
              ) : recentReviews.length === 0 ? (
                <div className="imp-card p-8 text-center">
                  <p className="text-3xl mb-2">💬</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">아직 리뷰가 없습니다</p>
                </div>
              ) : (
                <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {recentReviews.map((r) => (
                    <div key={r.id} className="imp-card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-sky-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {(r.client?.name || 'U').slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                {r.client?.name || '익명'}
                              </p>
                              <SendMessageButton
                                variant="mini"
                                targetUserId={r.client?.id || r.clientId}
                                targetUserName={r.client?.name || '고객'}
                              />
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              {formatDate(r.updatedAt)}
                            </p>
                          </div>
                        </div>
                        <span
                          className="text-sm text-amber-500 shrink-0"
                          aria-label={`${r.rating}점`}
                        >
                          {'★'.repeat(r.rating || 0)}
                          {'☆'.repeat(Math.max(0, 5 - (r.rating || 0)))}
                        </span>
                      </div>
                      {r.review ? (
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 bg-slate-50 dark:bg-slate-800/50 rounded-md px-2.5 py-2">
                          "{r.review}"
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                          코멘트 없음
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Quick actions */}
            <section>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                빠른 액션
              </h2>
              <div className="stagger-children grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: '프로필 수정', to: '/coach/profile', icon: '✏️' },
                  { label: '세션 내역', to: '/coaching/sessions', icon: '📋' },
                  { label: '코치 목록', to: '/coaches', icon: '🧑‍🏫' },
                  { label: '쪽지함', to: '/messages', icon: '💬' },
                ].map((a) => (
                  <Link
                    key={a.to}
                    to={a.to}
                    className="flex items-center gap-2 p-3 min-h-[44px] imp-card hover:shadow-sm transition-all duration-200 text-sm text-slate-700 dark:text-slate-300"
                  >
                    <span>{a.icon}</span>
                    {a.label}
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
