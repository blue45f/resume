import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from '@/components/Toast';
import {
  updateCoachingSessionStatus,
  reviewCoachingSession,
  type CoachingSession,
  type CoachingSessionStatus,
  type MySessionsResponse,
} from '@/lib/api';
import { useMyCoachingSessions } from '@/hooks/useResources';
import { getUser } from '@/lib/auth';

type TabKey = 'client' | 'coach';

const STATUS_LABEL: Record<CoachingSessionStatus, { label: string; className: string }> = {
  requested: {
    label: '요청됨',
    className: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  },
  confirmed: {
    label: '확정',
    className: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  },
  completed: {
    label: '완료',
    className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  },
  cancelled: {
    label: '취소',
    className: 'bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400',
  },
  refunded: {
    label: '환불',
    className: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
  },
};

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

export default function CoachingSessionsPage() {
  const queryClient = useQueryClient();
  const sessionsQuery = useMyCoachingSessions();
  const data: MySessionsResponse | null =
    (sessionsQuery.data as MySessionsResponse | undefined) ?? null;
  const loading = sessionsQuery.isLoading;
  const error: string | null = sessionsQuery.error
    ? (sessionsQuery.error as any)?.message || '세션을 불러오지 못했습니다'
    : null;
  const [tab, setTab] = useState<TabKey>('client');
  const [reviewOpen, setReviewOpen] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const user = getUser();

  const load = () => {
    queryClient.invalidateQueries({ queryKey: ['coaching-sessions', 'my'] });
  };

  useEffect(() => {
    document.title = '내 코칭 세션 — 이력서공방';
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, []);

  const hasCoachTab = useMemo(
    () => (data?.asCoach?.length || 0) > 0 || user?.userType === 'coach',
    [data?.asCoach, user?.userType],
  );

  useEffect(() => {
    // Default: if user has no client sessions but is a coach, show coach tab
    if (!data) return;
    if (tab === 'client' && data.asClient.length === 0 && data.asCoach.length > 0) {
      setTab('coach');
    }
  }, [data, tab]);

  const sessions = tab === 'client' ? data?.asClient : data?.asCoach;

  const changeStatus = async (session: CoachingSession, status: CoachingSessionStatus) => {
    try {
      await updateCoachingSessionStatus(session.id, { status });
      toast('상태가 변경되었습니다', 'success');
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : '상태 변경에 실패했습니다', 'error');
    }
  };

  const submitReview = async (sessionId: string) => {
    if (reviewRating < 1 || reviewRating > 5) {
      toast('별점은 1~5 사이로 선택해주세요', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await reviewCoachingSession(sessionId, {
        rating: reviewRating,
        review: reviewText.trim() || undefined,
      });
      toast('리뷰가 등록되었습니다', 'success');
      setReviewOpen(null);
      setReviewText('');
      setReviewRating(5);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : '리뷰 등록에 실패했습니다', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        role="main"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              내 코칭 세션
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              예약하거나 진행 중인 세션을 관리하세요
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/coaches"
              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:from-rose-600 hover:to-pink-700 shadow-sm"
            >
              + 코치 찾기
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-600 p-0.5 mb-5 bg-white/60 dark:bg-slate-800/40 backdrop-blur">
          <button
            onClick={() => setTab('client')}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
              tab === 'client'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            내가 예약 ({data?.asClient.length || 0})
          </button>
          {hasCoachTab && (
            <button
              onClick={() => setTab('coach')}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
                tab === 'coach'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              내가 코치 ({data?.asCoach.length || 0})
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="imp-card p-5 animate-pulse">
                <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="imp-card p-8 text-center">
            <p className="text-sm text-red-500 mb-3">{error}</p>
            <button onClick={load} className="text-xs text-blue-600 hover:text-blue-800">
              다시 시도
            </button>
          </div>
        ) : !sessions || sessions.length === 0 ? (
          <div className="imp-card p-10 text-center">
            <p className="text-4xl mb-3">{tab === 'client' ? '🎓' : '🧑‍🏫'}</p>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
              {tab === 'client' ? '예약한 세션이 없습니다' : '코칭 요청이 없습니다'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {tab === 'client'
                ? '전문 코치와 1:1 세션을 시작해보세요'
                : '코치 프로필을 공개하면 요청이 들어옵니다'}
            </p>
            {tab === 'client' ? (
              <Link
                to="/coaches"
                className="inline-block px-4 py-2 text-xs font-medium rounded-lg bg-rose-500 hover:bg-rose-600 text-white"
              >
                코치 찾기
              </Link>
            ) : (
              <Link
                to="/coach/profile"
                className="inline-block px-4 py-2 text-xs font-medium rounded-lg bg-rose-500 hover:bg-rose-600 text-white"
              >
                코치 프로필 설정
              </Link>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {sessions.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                role={tab}
                onChangeStatus={changeStatus}
                onOpenReview={() => {
                  setReviewOpen(session.id);
                  setReviewRating(session.rating || 5);
                  setReviewText(session.review || '');
                }}
                reviewOpen={reviewOpen === session.id}
                onCloseReview={() => setReviewOpen(null)}
                reviewRating={reviewRating}
                setReviewRating={setReviewRating}
                reviewText={reviewText}
                setReviewText={setReviewText}
                submitting={submitting}
                onSubmitReview={() => submitReview(session.id)}
              />
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </>
  );
}

interface SessionRowProps {
  session: CoachingSession;
  role: TabKey;
  onChangeStatus: (s: CoachingSession, status: CoachingSessionStatus) => void;
  onOpenReview: () => void;
  reviewOpen: boolean;
  onCloseReview: () => void;
  reviewRating: number;
  setReviewRating: (n: number) => void;
  reviewText: string;
  setReviewText: (s: string) => void;
  submitting: boolean;
  onSubmitReview: () => void;
}

function SessionRow({
  session,
  role,
  onChangeStatus,
  onOpenReview,
  reviewOpen,
  onCloseReview,
  reviewRating,
  setReviewRating,
  reviewText,
  setReviewText,
  submitting,
  onSubmitReview,
}: SessionRowProps) {
  const badge = STATUS_LABEL[session.status] || STATUS_LABEL.requested;
  const coachName = session.coach?.user?.name || '코치';
  const clientName = session.client?.name || '고객';
  const counterpart =
    role === 'client'
      ? { name: coachName, avatar: session.coach?.user?.avatar, label: '코치' }
      : { name: clientName, avatar: session.client?.avatar, label: '고객' };

  const canCoachConfirm = role === 'coach' && session.status === 'requested';
  const canCoachComplete = role === 'coach' && session.status === 'confirmed';
  const canCancel = session.status === 'requested' || session.status === 'confirmed';
  const canClientReview = role === 'client' && session.status === 'completed';

  // 24시간 이내 취소 여부: 환불 불가 정책 적용 대상
  const scheduledMs = new Date(session.scheduledAt).getTime();
  const hoursUntil = Number.isFinite(scheduledMs)
    ? (scheduledMs - Date.now()) / (1000 * 60 * 60)
    : Infinity;
  const isLateCancellation = hoursUntil >= 0 && hoursUntil < 24;

  const initials = (counterpart.name || 'U').slice(0, 1).toUpperCase();

  return (
    <li className="imp-card p-5">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {counterpart.avatar ? (
            <img
              src={counterpart.avatar}
              alt={counterpart.name}
              className="w-12 h-12 rounded-full object-cover bg-slate-100 dark:bg-slate-700"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center text-white font-bold shadow-sm">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {counterpart.label}
              </span>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                {counterpart.name}
              </h3>
              <span
                className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${badge.className}`}
              >
                {badge.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {formatDate(session.scheduledAt)} · {session.duration}분 ·{' '}
              {session.totalPrice.toLocaleString()}원
            </p>
            {session.note && (
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 bg-slate-50 dark:bg-slate-800/50 rounded-md px-2.5 py-1.5">
                요청: {session.note}
              </p>
            )}
            {session.meetingUrl && (
              <a
                href={session.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                미팅 링크 열기 ↗
              </a>
            )}
            {session.resumeId && (
              <Link
                to={`/resumes/${session.resumeId}/preview`}
                className="inline-flex items-center gap-1 mt-2 ml-2 text-xs font-medium text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-900/20 px-2 py-0.5 rounded-full hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-colors"
              >
                📄 공유 이력서 열람
              </Link>
            )}
            {session.status === 'completed' && session.rating && (
              <div className="mt-2 flex items-center gap-1 text-xs text-amber-500">
                <span aria-hidden="true">
                  {'★'.repeat(session.rating)}
                  {'☆'.repeat(Math.max(0, 5 - session.rating))}
                </span>
                {session.review && (
                  <span className="text-slate-500 dark:text-slate-400 ml-2 truncate max-w-[240px]">
                    "{session.review}"
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end shrink-0">
          {canCoachConfirm && (
            <button
              onClick={() => onChangeStatus(session, 'confirmed')}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              요청 수락
            </button>
          )}
          {canCoachComplete && (
            <button
              onClick={() => onChangeStatus(session, 'completed')}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
            >
              완료 처리
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => {
                const msg = isLateCancellation
                  ? '세션 시작 24시간 이내 취소는 환불이 불가합니다.\n정말 취소하시겠습니까?'
                  : '세션을 취소하시겠습니까?';
                if (confirm(msg)) onChangeStatus(session, 'cancelled');
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${
                isLateCancellation
                  ? 'border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                  : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
              title={isLateCancellation ? '24시간 이내 취소는 환불 불가' : undefined}
            >
              {isLateCancellation ? '취소 (환불 불가)' : '취소'}
            </button>
          )}
          {canClientReview && !session.rating && (
            <button
              onClick={onOpenReview}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              리뷰 작성
            </button>
          )}
        </div>
      </div>

      {/* Review form */}
      {reviewOpen && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60 animate-fade-in">
          <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
            리뷰 작성
          </h4>
          <div className="mb-3 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setReviewRating(n)}
                className={`text-2xl transition-colors ${n <= reviewRating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600 hover:text-amber-300'}`}
                aria-label={`${n}점`}
              >
                ★
              </button>
            ))}
            <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
              {reviewRating}점
            </span>
          </div>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="코칭 세션은 어떠셨나요? (선택 사항)"
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100 resize-none focus:ring-2 focus:ring-amber-500"
          />
          <div className="flex justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={onCloseReview}
              className="px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              취소
            </button>
            <button
              type="button"
              onClick={onSubmitReview}
              disabled={submitting}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50"
            >
              {submitting ? '등록 중...' : '리뷰 등록'}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
