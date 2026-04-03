import { useState } from 'react';
import { followUser, unfollowUser } from '@/lib/api';
import { toast } from '@/components/Toast';


interface Props {
  userId: string;
  initialFollowing?: boolean;
}

export default function FollowButton({ userId, initialFollowing = false }: Props) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    try {
      if (following) {
        await unfollowUser(userId);
        setFollowing(false);
      } else {
        await followUser(userId);
        setFollowing(true);
      }
    } catch {
      toast('팔로우 처리에 실패했습니다', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all duration-200 ${
        following
          ? 'border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:border-red-300 hover:text-red-500'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      } disabled:opacity-60`}
      aria-label={following ? '팔로우 취소' : '팔로우'}
    >
      {loading ? '...' : following ? '팔로잉' : '팔로우'}
    </button>
  );
}
