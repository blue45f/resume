import { useState, memo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addBookmark, removeBookmark } from '@/lib/api';
import { toast } from '@/components/Toast';
import Tooltip from '@/shared/ui/Tooltip';

interface Props {
  resumeId: string;
  initialBookmarked?: boolean;
  size?: 'sm' | 'md';
}

// useBookmarks(['bookmarks']) 캐시 행 — fetchBookmarks 응답과 동일 형태
type BookmarkRow = { id: string; resumeId: string; title: string; name: string; createdAt: string };

export default memo(function BookmarkButton({
  resumeId,
  initialBookmarked = false,
  size = 'md',
}: Props) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (next: boolean) => (next ? addBookmark(resumeId) : removeBookmark(resumeId)),
    // 낙관적 토글 — 버튼 즉시 반영 + 해제 시 ['bookmarks'] 목록에서도 제거, 실패 시 롤백
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: ['bookmarks'] });
      const snapshot = queryClient.getQueryData<BookmarkRow[]>(['bookmarks']);
      setBookmarked(next);
      if (!next) {
        queryClient.setQueryData<BookmarkRow[]>(['bookmarks'], (rows) =>
          rows?.filter((row) => row.resumeId !== resumeId),
        );
      }
      return { prev: !next, snapshot };
    },
    onError: (_error, _next, context) => {
      if (context) {
        setBookmarked(context.prev);
        queryClient.setQueryData(['bookmarks'], context.snapshot);
      }
      toast('북마크 처리에 실패했습니다', 'error');
    },
    // 추가 시 목록 행(title/name)은 서버만 알므로 invalidate 로 서버 정합 회복
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
  const loading = mutation.isPending;

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token || mutation.isPending) return;
    mutation.mutate(!bookmarked);
  };

  const sizeClass = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9';
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const label = bookmarked ? '북마크 해제' : '북마크 추가';

  return (
    <Tooltip content={label}>
      <button
        onClick={toggle}
        disabled={loading}
        className={`${sizeClass} flex items-center justify-center rounded-lg transition-all duration-200 ${
          bookmarked
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-amber-500'
        }`}
        aria-label={label}
      >
        <svg
          className={iconSize}
          fill={bookmarked ? 'currentColor' : 'none'}
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
    </Tooltip>
  );
});
