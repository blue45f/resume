import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getUser } from '@/lib/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

const CATEGORIES = [
  { id: 'all', label: '전체', icon: '📋' },
  { id: 'free', label: '자유', icon: '💬' },
  { id: 'tips', label: '취업팁', icon: '💡' },
  { id: 'resume', label: '이력서피드백', icon: '📄' },
  { id: 'cover-letter', label: '자소서', icon: '✍️' },
  { id: 'question', label: '질문', icon: '❓' },
];

const CATEGORY_COLORS: Record<string, string> = {
  free: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  tips: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  resume: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'cover-letter': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
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

export default function CommunityPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const category = searchParams.get('category') || 'all';
  const page = parseInt(searchParams.get('page') || '1');
  const user = getUser();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category && category !== 'all') params.set('category', category);
    if (search) params.set('search', search);
    params.set('page', String(page));
    params.set('limit', '20');

    const r = await fetch(`${API_URL}/api/community?${params}`);
    if (r.ok) {
      const data = await r.json();
      setPosts(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    }
    setLoading(false);
  }, [category, search, page]);

  useEffect(() => {
    document.title = '커뮤니티 — 이력서공방';
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (search) next.set('search', search); else next.delete('search');
      next.set('page', '1');
      return next;
    });
  };

  const setCategory = (cat: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (cat === 'all') next.delete('category'); else next.set('category', cat);
      next.set('page', '1');
      return next;
    });
  };

  const setPage = (p: number) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('page', String(p));
      return next;
    });
  };

  const getCategoryInfo = (cat: string) => CATEGORIES.find(c => c.id === cat) || CATEGORIES[0];

  return (
    <>
      <Header />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">커뮤니티</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">취업 정보와 경험을 나눠보세요</p>
          </div>
          {user && (
            <Link
              to="/community/write"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              글쓰기
            </Link>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-xl whitespace-nowrap transition-all ${
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

        {/* Search bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="제목 또는 내용 검색..."
              className="w-full pl-9 pr-24 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              검색
            </button>
          </div>
        </form>

        {/* Stats */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            총 <span className="font-medium text-slate-700 dark:text-slate-300">{total.toLocaleString()}</span>개의 게시글
          </p>
        </div>

        {/* Post list */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-16" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-slate-500 dark:text-slate-400">게시글이 없습니다.</p>
            {user && (
              <Link to="/community/write" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
                첫 번째 글을 작성해보세요!
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map(post => {
              const catInfo = getCategoryInfo(post.category);
              return (
                <Link
                  key={post.id}
                  to={`/community/${post.id}`}
                  className="block bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm transition-all duration-150"
                >
                  <div className="flex items-start gap-3">
                    {/* Category badge */}
                    <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-lg ${CATEGORY_COLORS[post.category] || CATEGORY_COLORS.free}`}>
                      {catInfo.icon} {catInfo.label}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {post.isPinned && (
                          <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">📌</span>
                        )}
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                          {post.title}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                        {post.content}
                      </p>
                    </div>

                    {/* Meta */}
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          {post.likeCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          {post._count?.comments ?? 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {post.viewCount}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        {post.user?.avatar && (
                          <img src={post.user.avatar} alt="" className="w-4 h-4 rounded-full" />
                        )}
                        <span>{post.user?.name || '익명'}</span>
                        <span>·</span>
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
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
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
                      ? 'bg-indigo-600 text-white'
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
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
