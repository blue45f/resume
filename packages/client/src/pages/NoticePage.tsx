import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { usePublicGet } from '@/hooks/useResources';
import { ROUTES } from '@/lib/routes';
import { tx } from '@/lib/i18n';

const TYPE_COLOR: Record<string, { color: string; icon: string }> = {
  GENERAL: {
    icon: '📢',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  },
  MAINTENANCE: {
    icon: '🔧',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
  EVENT: {
    icon: '🎉',
    color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  },
};
const getTYPE_INFO = (): Record<string, { label: string; color: string; icon: string }> => ({
  GENERAL: { label: tx('notice.types.GENERAL'), ...TYPE_COLOR.GENERAL },
  MAINTENANCE: { label: tx('notice.types.MAINTENANCE'), ...TYPE_COLOR.MAINTENANCE },
  EVENT: { label: tx('notice.types.EVENT'), ...TYPE_COLOR.EVENT },
});

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return '오늘';
  if (days < 7) return `${days}일 전`;
  return new Date(date).toLocaleDateString('ko-KR');
}

interface Notice {
  id: string;
  title: string;
  content: string;
  type: string;
  isPinned: boolean;
  isPopup: boolean;
  startAt?: string;
  endAt?: string;
  createdAt: string;
}

function NoticeList() {
  const [type, setType] = useState('all');
  const [page, setPage] = useState(1);

  const queryParams = new URLSearchParams({ page: String(page), limit: '20' });
  if (type !== 'all') queryParams.set('type', type);

  const { data, isLoading: loading } = usePublicGet<any>(
    ['notices', type, page],
    `/api/notices?${queryParams}`,
    { staleTime: 30_000 },
  );
  const notices: Notice[] = Array.isArray(data) ? data : data?.items || [];
  const total: number = data?.total || 0;

  const totalPages = Math.ceil(total / 20);

  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {tx('nav.notices')}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              서비스 공지 및 업데이트를 확인하세요
            </p>
          </div>
          <Link
            to={ROUTES.community.notice}
            className="text-xs text-sky-700 dark:text-sky-400 hover:underline flex items-center gap-1"
          >
            커뮤니티 공지 보기
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Type tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'all', label: '전체', icon: '📋' },
            { id: 'GENERAL', label: '공지', icon: '📢' },
            { id: 'MAINTENANCE', label: '점검', icon: '🔧' },
            { id: 'EVENT', label: '이벤트', icon: '🎉' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setType(t.id);
                setPage(1);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-xl transition-all ${
                type === t.id
                  ? 'bg-sky-700 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-14 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : notices.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-slate-500 dark:text-slate-400">공지사항이 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
              {notices.map((notice) => {
                const typeInfo = getTYPE_INFO()[notice.type] || getTYPE_INFO().GENERAL;
                return (
                  <Link
                    key={notice.id}
                    to={ROUTES.notice(notice.id)}
                    className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg ${typeInfo.color}`}
                    >
                      {typeInfo.icon} {typeInfo.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {notice.isPinned && (
                          <span className="text-xs text-amber-500 font-bold">📌</span>
                        )}
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate hover:text-sky-700 transition-colors">
                          {notice.title}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">
                      {timeAgo(notice.createdAt)}
                    </span>
                  </Link>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-40"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm ${p === page ? 'bg-sky-700 text-white' : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-40"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

function NoticeDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: notice, isLoading: loading } = usePublicGet<Notice>(
    ['notice', id],
    `/api/notices/${id}`,
    { enabled: !!id, staleTime: 60_000 },
  );

  const typeInfo = notice ? getTYPE_INFO()[notice.type] || getTYPE_INFO().GENERAL : null;

  return (
    <>
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
        <Link
          to={ROUTES.notices}
          className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-sky-700 transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          공지사항 목록
        </Link>

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
            <div className="h-40 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        ) : !notice ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🚫</div>
            <p className="text-slate-500">공지사항을 찾을 수 없습니다.</p>
          </div>
        ) : (
          <article className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 sm:p-8">
            <div className="mb-6 pb-6 border-b border-slate-100 dark:border-slate-700">
              {typeInfo && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg mb-3 ${typeInfo.color}`}
                >
                  {typeInfo.icon} {typeInfo.label}
                </span>
              )}
              {notice.isPinned && (
                <span className="ml-2 text-xs text-amber-500 font-bold">📌 고정</span>
              )}
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-2 leading-snug">
                {notice.title}
              </h1>
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                <span>관리자</span>
                <span>·</span>
                <span>{new Date(notice.createdAt).toLocaleDateString('ko-KR')}</span>
                {notice.startAt && notice.endAt && (
                  <>
                    <span>·</span>
                    <span>
                      {new Date(notice.startAt).toLocaleDateString('ko-KR')} ~{' '}
                      {new Date(notice.endAt).toLocaleDateString('ko-KR')}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {notice.content}
            </div>
          </article>
        )}
      </main>
      <Footer />
    </>
  );
}

export default function NoticePage() {
  const { id } = useParams<{ id: string }>();
  return id ? <NoticeDetail /> : <NoticeList />;
}
