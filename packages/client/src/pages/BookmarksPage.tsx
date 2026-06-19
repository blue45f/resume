import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import EmptyState from '@/components/EmptyState'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { CardGridSkeleton } from '@/components/Skeleton'
import { toast } from '@/components/Toast'
import { useBookmarks } from '@/hooks/useResources'
import { removeBookmark } from '@/lib/api'
import {
  BOOKMARK_SORT_OPTIONS,
  filterAndSortBookmarks,
  type BookmarkItem,
  type BookmarkSortMode,
} from '@/lib/bookmarkList'
import { tx } from '@/lib/i18n'
import { ROUTES } from '@/lib/routes'
import { shareOrCopy, shareResultMessage } from '@/lib/share'
import { timeAgo } from '@/lib/time'
import { ErrorState } from '@/shared/ui/ErrorState'

type Bookmark = BookmarkItem

export default function BookmarksPage() {
  const queryClient = useQueryClient()
  const { data: bookmarks = [], isLoading: loading, isError, refetch } = useBookmarks()
  const [search, setSearch] = useState('')
  const [sortMode, setSortMode] = useState<BookmarkSortMode>('recent')

  const removeMutation = useMutation({
    mutationFn: (resumeId: string) => removeBookmark(resumeId),
    // 낙관적 제거 — 목록에서 즉시 사라지게 하고 실패 시 롤백한다.
    onMutate: async (resumeId: string) => {
      await queryClient.cancelQueries({ queryKey: ['bookmarks'] })
      const previous = queryClient.getQueryData<Bookmark[]>(['bookmarks'])
      queryClient.setQueryData<Bookmark[]>(['bookmarks'], (old) =>
        (old ?? []).filter((b) => b.resumeId !== resumeId)
      )
      return { previous }
    },
    onError: (_err, _resumeId, context) => {
      if (context?.previous) queryClient.setQueryData(['bookmarks'], context.previous)
      toast('해제에 실패했습니다', 'error')
    },
    onSuccess: () => toast('북마크가 해제되었습니다', 'success'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  })

  useEffect(() => {
    document.title = '북마크 — 이력서공방'
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'
    }
  }, [])

  const handleRemove = (resumeId: string) => removeMutation.mutate(resumeId)

  const handleShare = async (b: Bookmark) => {
    const url = `${globalThis.location.origin}${ROUTES.resume.preview(b.resumeId)}`
    const result = await shareOrCopy({ title: b.title || '이력서', url })
    const { text, tone } = shareResultMessage(result)
    if (text) toast(text, tone)
  }

  const visibleBookmarks = useMemo(
    () => filterAndSortBookmarks(bookmarks as Bookmark[], search, sortMode),
    [bookmarks, search, sortMode]
  )

  const total = bookmarks.length
  const showControls = !loading && !isError && total > 0

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
            <h1 className="heading-accent text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              {tx('community.bookmark')}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              관심 있는 이력서를 저장했습니다
            </p>
          </div>
          <Link
            to={ROUTES.resume.explore}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            이력서 탐색 →
          </Link>
        </div>

        {showControls && (
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="북마크 검색"
                placeholder="이력서 제목 또는 작성자로 검색..."
                className="w-full pl-9 pr-9 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-600 text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors text-xs"
                  aria-label="검색어 지우기"
                >
                  ×
                </button>
              )}
            </div>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as BookmarkSortMode)}
              aria-label="정렬 기준"
              className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {BOOKMARK_SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {showControls && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4" aria-live="polite">
            {search ? (
              <>
                <span className="font-medium text-blue-600 dark:text-blue-400">"{search}"</span>{' '}
                검색결과{' '}
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {visibleBookmarks.length}
                </span>
                건
              </>
            ) : (
              <>
                총 <span className="font-medium text-slate-700 dark:text-slate-300">{total}</span>
                개의 북마크
              </>
            )}
          </p>
        )}

        {loading ? (
          <CardGridSkeleton count={3} />
        ) : isError ? (
          <ErrorState message="북마크를 불러오지 못했습니다" onRetry={() => refetch()} />
        ) : total === 0 ? (
          <EmptyState type="bookmark" />
        ) : visibleBookmarks.length === 0 ? (
          <div className="text-center py-12 imp-card">
            <div className="text-4xl mb-3" aria-hidden="true">
              🔍
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              "{search}"에 대한 북마크가 없습니다
            </p>
            <button
              type="button"
              onClick={() => setSearch('')}
              className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              검색어 지우기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleBookmarks.map((b) => (
              <div
                key={b.id}
                className="card-hover flex items-center justify-between p-4 imp-card animate-fade-in-up"
              >
                <Link to={ROUTES.resume.preview(b.resumeId)} className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-900 dark:text-slate-100 truncate hover:text-blue-600 transition-colors">
                    {b.title || '제목 없음'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <span>{b.name || '이름 없음'}</span>
                    <span>·</span>
                    <span>{timeAgo(b.createdAt)}</span>
                  </div>
                </Link>
                <div className="flex items-center shrink-0 ml-3">
                  <button
                    onClick={() => handleShare(b)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    aria-label={`${b.title || '이력서'} 공유`}
                    title="공유"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleRemove(b.resumeId)}
                    className="p-2 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                    aria-label={`${b.title || '이력서'} 북마크 해제`}
                    title="북마크 해제"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
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
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
