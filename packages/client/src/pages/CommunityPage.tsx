import { API_URL } from '@/lib/config';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getUser } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';
import SendMessageButton from '@/components/SendMessageButton';
import { tx } from '@/lib/i18n';

interface CategoryDef {
  id: string;
  labelKey?: string;
  fallback: string;
  icon: string;
}
const CATEGORY_DEFS: CategoryDef[] = [
  { id: 'all', labelKey: 'common.all', fallback: '전체', icon: '📋' },
  { id: 'scrapped', fallback: '스크랩', icon: '🔖' },
  { id: 'notice', labelKey: 'community.category.notice', fallback: '공지사항', icon: '📢' },
  { id: 'free', labelKey: 'community.category.free', fallback: '자유', icon: '💬' },
  { id: 'tips', labelKey: 'community.category.tips', fallback: '취업팁', icon: '💡' },
  { id: 'resume', labelKey: 'community.category.resume', fallback: '이력서피드백', icon: '📄' },
  {
    id: 'cover-letter',
    labelKey: 'community.category.coverLetter',
    fallback: '자소서',
    icon: '✍️',
  },
  {
    id: 'interview',
    labelKey: 'community.category.interview',
    fallback: '면접후기',
    icon: '🎤',
  },
  { id: 'question', labelKey: 'community.category.question', fallback: '질문', icon: '❓' },
];
const getCATEGORIES = () =>
  CATEGORY_DEFS.map((c) => ({
    id: c.id,
    label: c.labelKey ? tx(c.labelKey) : c.fallback,
    icon: c.icon,
  }));

const SORT_KEYS = [
  { value: 'trending', fallback: '🔥 지금 뜨는' },
  { value: 'recent', labelKey: 'explore.sortByLatest' },
  { value: 'popular', labelKey: 'explore.sortByPopular' },
  { value: 'views', labelKey: 'explore.sortByViews' },
  { value: 'comments', fallback: '댓글순' },
  { value: 'oldest', fallback: '오래된순' },
] as const;
const getSORT_OPTIONS = () =>
  SORT_KEYS.map((s) => ({
    value: s.value,
    label: 'labelKey' in s ? tx(s.labelKey) : s.fallback,
  }));

const CATEGORY_COLORS: Record<string, string> = {
  notice: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  free: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  tips: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  resume: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'cover-letter': 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  interview: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  question: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  viewCount: number;
  likeCount: number;
  isPinned: boolean;
  createdAt: string;
  user?: { id: string; name: string; username: string; avatar: string };
  _count?: { comments: number; likes: number };
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(date).toLocaleDateString('ko-KR');
}

function isHot(post: Post) {
  const ageHours = (Date.now() - new Date(post.createdAt).getTime()) / 3600000;
  const decay = Math.max(0.2, 1 - ageHours / 168);
  const score =
    (post.likeCount * 3 + (post._count?.comments ?? 0) * 2 + post.viewCount * 0.1) * decay;
  return score >= 8;
}

function isNew(post: Post) {
  const diff = Date.now() - new Date(post.createdAt).getTime();
  return diff < 3600000; // within 1 hour
}

function getReadPosts(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem('read-posts') || '[]'));
  } catch {
    return new Set();
  }
}

function markRead(id: string) {
  try {
    const set = getReadPosts();
    set.add(id);
    localStorage.setItem('read-posts', JSON.stringify([...set].slice(-200)));
  } catch {}
}

export default function CommunityPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sort') || 'recent');
  const [readPosts, setReadPosts] = useState<Set<string>>(() => getReadPosts());
  const searchInputRef = useRef<HTMLInputElement>(null);

  const category = searchParams.get('category') || 'all';
  const page = parseInt(searchParams.get('page') || '1');
  const user = getUser();

  const {
    data: postsResult,
    isLoading: loading,
    refetch,
  } = useQuery<{ items: Post[]; total: number; totalPages: number } | null>({
    queryKey: ['community-posts', { category, search, page, sortBy }],
    queryFn: async () => {
      if (category === 'scrapped') {
        try {
          const scrappedIds: string[] = JSON.parse(localStorage.getItem('scrapped-posts') || '[]');
          if (scrappedIds.length === 0) return { items: [], total: 0, totalPages: 1 };
          const r = await fetch(`${API_URL}/api/community?limit=100`);
          if (!r.ok) return { items: [], total: 0, totalPages: 1 };
          const data = await r.json();
          const all = data.items || [];
          const filtered = all.filter((p: any) => scrappedIds.includes(p.id));
          return { items: filtered, total: filtered.length, totalPages: 1 };
        } catch {
          return { items: [], total: 0, totalPages: 1 };
        }
      }
      const params = new URLSearchParams();
      if (category && category !== 'all') params.set('category', category);
      if (search) params.set('search', search);
      params.set('page', String(page));
      params.set('limit', '20');
      params.set('sort', sortBy);
      const r = await fetch(`${API_URL}/api/community?${params}`);
      if (!r.ok) return null;
      const data = await r.json();
      return { items: data.items || [], total: data.total || 0, totalPages: data.totalPages || 1 };
    },
  });
  const posts: Post[] = useMemo(() => postsResult?.items ?? [], [postsResult]);
  const total = postsResult?.total ?? 0;
  const totalPages = postsResult?.totalPages ?? 1;
  void useCallback(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    document.title = '커뮤니티 — 이력서공방';
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (search) next.set('search', search);
      else next.delete('search');
      next.set('page', '1');
      return next;
    });
  };

  const clearSearch = () => {
    setSearch('');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('search');
      next.set('page', '1');
      return next;
    });
    searchInputRef.current?.focus();
  };

  const setCategory = (cat: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (cat === 'all') next.delete('category');
      else next.set('category', cat);
      next.set('page', '1');
      return next;
    });
  };

  const setPage = (p: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(p));
      return next;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (s: string) => {
    setSortBy(s);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('sort', s);
      next.set('page', '1');
      return next;
    });
  };

  const handlePostClick = (id: string) => {
    markRead(id);
    setReadPosts((prev) => new Set([...prev, id]));
  };

  const getCategoryInfo = (cat: string) =>
    getCATEGORIES().find((c) => c.id === cat) || getCATEGORIES()[0];

  // Hot posts (top 3 by likes, only from first page)
  const hotPosts = [...posts]
    .filter((p) => !p.isPinned && isHot(p))
    .sort((a, b) => b.likeCount - a.likeCount)
    .slice(0, 3);

  return (
    <>
      <Header />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {tx('community.title')}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              취업 정보와 경험을 나눠보세요
            </p>
          </div>
          {user && (
            <Link
              to={ROUTES.community.write}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              글쓰기
            </Link>
          )}
        </div>

        {/* Hot posts strip - only show when not searching */}
        {!search && page === 1 && hotPosts.length > 0 && category === 'all' && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🔥</span>
              <span className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                인기 게시글
              </span>
            </div>
            <div className="space-y-2">
              {hotPosts.map((post, i) => {
                const catInfo = getCategoryInfo(post.category);
                return (
                  <Link
                    key={post.id}
                    to={ROUTES.community.post(post.id)}
                    onClick={() => handlePostClick(post.id)}
                    className="flex items-center gap-3 group"
                  >
                    <span
                      className={`text-sm font-bold w-5 text-center shrink-0 ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : 'text-orange-400'}`}
                    >
                      {i + 1}
                    </span>
                    <span
                      className={`shrink-0 text-xs px-1.5 py-0.5 rounded ${CATEGORY_COLORS[post.category] || CATEGORY_COLORS.free}`}
                    >
                      {catInfo.label}
                    </span>
                    <span className="text-sm text-slate-700 dark:text-slate-300 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {post.title}
                    </span>
                    <span className="text-xs text-red-500 shrink-0 ml-auto flex items-center gap-0.5">
                      ♥ {post.likeCount}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none scroll-smooth">
          {getCATEGORIES().map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-xl whitespace-nowrap transition-all ${
                category === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search + Sort row */}
        <div className="flex gap-2 mb-5">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
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
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="제목 또는 내용 검색..."
                className="w-full pl-9 pr-20 py-2.5 imp-card text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-14 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-600 text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors text-xs"
                  aria-label="검색어 지우기"
                >
                  ×
                </button>
              )}
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                검색
              </button>
            </div>
          </form>

          {/* Sort select */}
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-3 py-2.5 text-xs imp-card text-slate-600 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
          >
            {getSORT_OPTIONS().map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {search ? (
              <>
                <span className="font-medium text-indigo-600 dark:text-indigo-400">"{search}"</span>{' '}
                검색결과{' '}
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {total.toLocaleString()}
                </span>
                건
              </>
            ) : (
              <>
                총{' '}
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {total.toLocaleString()}
                </span>
                개의 게시글
              </>
            )}
          </p>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {page} / {totalPages} 페이지
          </span>
        </div>

        {/* Post list */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="imp-card p-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-lg w-16 shrink-0" />
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-700/50 rounded w-1/2" />
                  </div>
                  <div className="shrink-0 space-y-1">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-700/50 rounded w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 imp-card">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {search ? `"${search}"에 대한 게시글이 없습니다` : '게시글이 없습니다'}
            </p>
            {search ? (
              <button
                onClick={clearSearch}
                className="mt-3 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                검색어 지우기
              </button>
            ) : user ? (
              <Link
                to={ROUTES.community.write}
                className="mt-3 inline-block text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                첫 번째 글을 작성해보세요!
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="space-y-1.5">
            {posts.map((post) => {
              const catInfo = getCategoryInfo(post.category);
              const hot = isHot(post);
              const fresh = isNew(post);
              const isRead = readPosts.has(post.id);
              const commentCount = post._count?.comments ?? 0;

              return (
                <Link
                  key={post.id}
                  to={ROUTES.community.post(post.id)}
                  onClick={() => handlePostClick(post.id)}
                  className={`block bg-white dark:bg-slate-800 border rounded-xl p-4 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm transition-all duration-150 ${
                    post.isPinned
                      ? 'border-amber-200 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/5'
                      : isRead
                        ? 'border-slate-100 dark:border-slate-700/60 opacity-80'
                        : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Category badge */}
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg ${CATEGORY_COLORS[post.category] || CATEGORY_COLORS.free}`}
                    >
                      {catInfo.icon} {catInfo.label}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {post.isPinned && (
                          <span className="text-xs text-amber-600 dark:text-amber-400 font-bold shrink-0">
                            📌
                          </span>
                        )}
                        {hot && !post.isPinned && (
                          <span className="text-xs text-red-500 font-bold shrink-0">🔥</span>
                        )}
                        {fresh && (
                          <span className="badge-xs badge-blue font-bold shrink-0">NEW</span>
                        )}
                        <h3
                          className={`text-sm font-semibold truncate transition-colors ${
                            isRead
                              ? 'text-slate-500 dark:text-slate-500'
                              : 'text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400'
                          }`}
                        >
                          {post.title}
                        </h3>
                        {commentCount > 0 && (
                          <span className="text-xs text-indigo-500 dark:text-indigo-400 shrink-0">
                            [{commentCount}]
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {post.content
                          .replace(/<[^>]*>/g, '')
                          .replace(/[#*`~>\-]/g, '')
                          .slice(0, 150)}
                      </p>
                    </div>

                    {/* Meta */}
                    <div className="shrink-0 flex flex-col items-end gap-1 ml-2">
                      <div className="flex items-center gap-2.5 text-xs text-slate-400">
                        {post.likeCount > 0 && (
                          <span
                            className={`flex items-center gap-0.5 ${post.likeCount >= 10 ? 'text-red-500 font-medium' : ''}`}
                          >
                            <svg
                              className="w-3 h-3"
                              fill={post.likeCount >= 10 ? 'currentColor' : 'none'}
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                              />
                            </svg>
                            {post.likeCount}
                          </span>
                        )}
                        <span className="flex items-center gap-0.5">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          {post.viewCount}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        {post.user?.avatar ? (
                          <img
                            src={post.user.avatar}
                            alt={`${post.user.name || '사용자'} 프로필`}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-[8px] font-bold text-indigo-600 dark:text-indigo-400">
                            {(post.user?.name || '익')[0]}
                          </div>
                        )}
                        <span className="hidden sm:inline truncate max-w-[60px]">
                          {post.user?.name || '익명'}
                        </span>
                        {post.user?.id && (
                          <SendMessageButton
                            targetUserId={post.user.id}
                            targetUserName={post.user.name}
                            variant="mini"
                          />
                        )}
                        <span className="hidden sm:inline">·</span>
                        <span>{timeAgo(post.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="첫 페이지"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="이전 페이지"
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

            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p = i + 1;
              if (totalPages > 7) {
                if (page <= 4) p = i + 1;
                else if (page >= totalPages - 3) p = totalPages - 6 + i;
                else p = page - 3 + i;
              }
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    p === page
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="다음 페이지"
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
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="마지막 페이지"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
