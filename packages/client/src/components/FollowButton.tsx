import { useState } from 'react';
import { followUser, unfollowUser } from '@/lib/api';
import { toast } from '@/components/Toast';

interface Props {
  userId: string;
  initialFollowing?: boolean;
  isMutual?: boolean;
  onFollowChange?: (following: boolean) => void;
}

export default function FollowButton({
  userId,
  initialFollowing = false,
  isMutual = false,
  onFollowChange,
}: Props) {
  const [following, setFollowing] = useState(initialFollowing);
  const [mutual, setMutual] = useState(isMutual);
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) return;

    // Optimistic update
    const prevFollowing = following;
    const prevMutual = mutual;
    const newFollowing = !following;
    setFollowing(newFollowing);
    if (!newFollowing) setMutual(false);
    onFollowChange?.(newFollowing);
    setLoading(true);

    try {
      if (prevFollowing) {
        await unfollowUser(userId);
      } else {
        const result = await followUser(userId);
        if ((result as any)?.mutual) setMutual(true);
        toast('팔로우했습니다', 'success');
      }
    } catch {
      // Revert on error
      setFollowing(prevFollowing);
      setMutual(prevMutual);
      onFollowChange?.(prevFollowing);
      toast('팔로우 처리에 실패했습니다', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showUnfollow = following && hovered;

  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        onClick={toggle}
        disabled={loading}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all duration-200 ${
          showUnfollow
            ? 'border border-red-300 dark:border-red-700 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20'
            : following
              ? 'border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800'
              : 'bg-blue-600 text-white hover:bg-blue-700'
        } disabled:opacity-60`}
        aria-label={following ? '팔로우 취소' : '팔로우'}
      >
        {loading ? '...' : showUnfollow ? '팔로우 취소' : following ? '팔로잉' : '팔로우'}
      </button>
      {following && mutual && (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
              clipRule="evenodd"
            />
          </svg>
          맞팔
        </span>
      )}
    </div>
  );
}
