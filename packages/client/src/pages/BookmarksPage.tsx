import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { removeBookmark } from '@/lib/api';
import { toast } from '@/components/Toast';
import { CardGridSkeleton } from '@/components/Skeleton';
import { timeAgo } from '@/lib/time';
import { useBookmarks } from '@/hooks/useResources';

export default function BookmarksPage() {
  const queryClient = useQueryClient();
  const { data: bookmarks = [], isLoading: loading } = useBookmarks();

  const removeMutation = useMutation({
    mutationFn: (resumeId: string) => removeBookmark(resumeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      toast('북마크가 해제되었습니다', 'success');
    },
    onError: () => toast('해제에 실패했습니다', 'error'),
  });

  useEffect(() => {
    document.title = '북마크 — 이력서공방';
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, []);

  const handleRemove = (resumeId: string) => removeMutation.mutate(resumeId);

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        role="main"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              북마크
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              관심 있는 이력서를 저장했습니다
            </p>
          </div>
          <Link to="/explore" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            이력서 탐색 →
          </Link>
        </div>

        {loading ? (
          <CardGridSkeleton count={3} />
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            <p className="text-slate-500 dark:text-slate-400 mb-2">저장한 북마크가 없습니다</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
              탐색 페이지에서 관심 있는 이력서를 북마크하세요
            </p>
            <Link
              to="/explore"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              이력서 탐색하기 →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookmarks.map((b) => (
              <div
                key={b.id}
                className="card-hover flex items-center justify-between p-4 imp-card animate-fade-in-up"
              >
                <Link to={`/resumes/${b.resumeId}/preview`} className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-900 dark:text-slate-100 truncate hover:text-blue-600 transition-colors">
                    {b.title || '제목 없음'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 dark:text-slate-500">
                    <span>{b.name || '이름 없음'}</span>
                    <span>·</span>
                    <span>{timeAgo(b.createdAt)}</span>
                  </div>
                </Link>
                <button
                  onClick={() => handleRemove(b.resumeId)}
                  className="p-2 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors shrink-0 ml-3"
                  aria-label="북마크 해제"
                  title="북마크 해제"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
