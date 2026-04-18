import { useState, memo } from 'react';
import { toast } from '@/components/Toast';
import Tooltip from '@/shared/ui/Tooltip';
import { API_URL } from '@/lib/config';

interface Props {
  resumeId: string;
  initialBookmarked?: boolean;
  size?: 'sm' | 'md';
}

export default memo(function BookmarkButton({
  resumeId,
  initialBookmarked = false,
  size = 'md',
}: Props) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) return;

    const prev = bookmarked;
    setBookmarked(!prev);
    setLoading(true);

    try {
      const method = prev ? 'DELETE' : 'POST';
      const res = await fetch(`${API_URL}/api/resumes/${resumeId}/bookmark`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
    } catch {
      setBookmarked(prev);
      toast('북마크 처리에 실패했습니다', 'error');
    } finally {
      setLoading(false);
    }
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
