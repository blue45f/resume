import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CardGridSkeleton } from '@/components/Skeleton';
import FollowButton from '@/components/FollowButton';
import SendMessageButton from '@/components/SendMessageButton';
import { getUser } from '@/lib/auth';
import { useFollowers, useFollowing } from '@/hooks/useResources';

interface FollowUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  recentResumeTitle?: string;
}

export default function FollowListPage() {
  const user = getUser();
  const [tab, setTab] = useState<'followers' | 'following'>('followers');
  const followersQuery = useFollowers();
  const followingQuery = useFollowing();
  const followers: FollowUser[] = (followersQuery.data as FollowUser[] | undefined) ?? [];
  const following: FollowUser[] = (followingQuery.data as FollowUser[] | undefined) ?? [];
  const loading = followersQuery.isLoading || followingQuery.isLoading;
  const [search, setSearch] = useState('');

  useEffect(() => {
    document.title = '팔로워 / 팔로잉 — 이력서공방';
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, []);

  const followingIds = useMemo(() => new Set(following.map((u) => u.id)), [following]);
  const followerIds = useMemo(() => new Set(followers.map((u) => u.id)), [followers]);

  const isMutual = (userId: string) => followingIds.has(userId) && followerIds.has(userId);

  const currentList = tab === 'followers' ? followers : following;

  const filteredList = useMemo(() => {
    if (!search.trim()) return currentList;
    const q = search.toLowerCase();
    return currentList.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.recentResumeTitle && u.recentResumeTitle.toLowerCase().includes(q)),
    );
  }, [currentList, search]);

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        role="main"
      >
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            팔로워 / 팔로잉
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            나를 팔로우하는 사용자와 내가 팔로우하는 사용자를 관리합니다
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="imp-card p-4 text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {followers.length}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">팔로워</p>
          </div>
          <div className="imp-card p-4 text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {following.length}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">팔로잉</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
          <button
            onClick={() => {
              setTab('followers');
              setSearch('');
            }}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              tab === 'followers'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm font-medium'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            팔로워 <span className="text-xs text-slate-400">({followers.length})</span>
          </button>
          <button
            onClick={() => {
              setTab('following');
              setSearch('');
            }}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              tab === 'following'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm font-medium'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            팔로잉 <span className="text-xs text-slate-400">({following.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름 또는 이메일로 검색..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* List */}
        {loading ? (
          <CardGridSkeleton count={4} />
        ) : filteredList.length === 0 ? (
          <div className="text-center py-16">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {search.trim() ? (
              <p className="text-sm text-slate-400 dark:text-slate-500">검색 결과가 없습니다</p>
            ) : (
              <>
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  {tab === 'followers'
                    ? '아직 팔로워가 없습니다'
                    : '아직 팔로잉하는 사용자가 없습니다'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  탐색 페이지에서 다른 사용자를 찾아보세요
                </p>
                <Link
                  to="/explore"
                  className="inline-block mt-3 px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  탐색하기
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredList.map((u) => {
              const mutual = isMutual(u.id);
              const isFollowingUser = followingIds.has(u.id);
              return (
                <div
                  key={u.id}
                  className="imp-card p-4 flex items-center justify-between hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                      {u.name?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {u.name}
                        </p>
                        {mutual && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-full shrink-0">
                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                                clipRule="evenodd"
                              />
                            </svg>
                            맞팔로우
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {u.email}
                      </p>
                      {u.recentResumeTitle && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          최근 이력서: {u.recentResumeTitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <SendMessageButton userId={u.id} userName={u.name} />
                    {u.id !== user?.id && (
                      <FollowButton
                        userId={u.id}
                        initialFollowing={isFollowingUser}
                        isMutual={mutual}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
