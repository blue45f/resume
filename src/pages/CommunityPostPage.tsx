import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getUser } from '@/lib/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

const CATEGORY_INFO: Record<string, { label: string; icon: string; color: string }> = {
  free: { label: '자유', icon: '💬', color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  tips: { label: '취업팁', icon: '💡', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  resume: { label: '이력서피드백', icon: '📄', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  'cover-letter': { label: '자소서', icon: '✍️', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  question: { label: '질문', icon: '❓', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
};

interface Comment {
  id: string;
  content: string;
  authorName?: string;
  userId?: string;
  createdAt: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  viewCount: number;
  likeCount: number;
  isPinned: boolean;
  liked?: boolean;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; username: string; avatar: string };
  comments?: Comment[];
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

export default function CommunityPostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = getUser();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchPost = useCallback(async () => {
    const token = localStorage.getItem('token');
    const headers: any = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const r = await fetch(`${API_URL}/api/community/${id}`, { headers });
    if (r.ok) {
      setPost(await r.json());
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchPost(); }, [fetchPost]);

  const handleLike = async () => {
    if (!user) { navigate('/login'); return; }
    if (liking || !post) return;
    setLiking(true);

    const token = localStorage.getItem('token');
    const r = await fetch(`${API_URL}/api/community/${post.id}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (r.ok) {
      const { liked } = await r.json();
      setPost(p => p ? { ...p, liked, likeCount: p.likeCount + (liked ? 1 : -1) } : p);
    }
    setLiking(false);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);

    const token = localStorage.getItem('token');
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const r = await fetch(`${API_URL}/api/community/${id}/comments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content: commentText.trim() }),
    });

    if (r.ok) {
      setCommentText('');
      fetchPost();
    }
    setSubmittingComment(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/api/community/${id}/comments/${commentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchPost();
  };

  const handleDeletePost = async () => {
    if (!confirm('게시글을 삭제하시겠습니까?')) return;
    setDeleting(true);
    const token = localStorage.getItem('token');
    const r = await fetch(`${API_URL}/api/community/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (r.ok) navigate('/community');
    setDeleting(false);
  };

  const isOwner = user && post?.user?.id === user.id;
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const catInfo = post ? (CATEGORY_INFO[post.category] || CATEGORY_INFO.free) : null;

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
            <div className="h-40 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        </main>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Header />
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 text-center">
          <div className="text-5xl mb-4">🚫</div>
          <p className="text-slate-500 dark:text-slate-400">게시글을 찾을 수 없습니다.</p>
          <Link to="/community" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">목록으로</Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
          <Link to="/community" className="hover:text-indigo-600 transition-colors">커뮤니티</Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {catInfo && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-lg ${catInfo.color}`}>
              {catInfo.icon} {catInfo.label}
            </span>
          )}
        </div>

        {/* Post */}
        <article className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden mb-6">
          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex-1">
                {post.isPinned && <span className="text-sm text-amber-600 dark:text-amber-400 font-bold mr-2">📌 공지</span>}
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">{post.title}</h1>
                <div className="flex items-center gap-3 mt-3 text-sm text-slate-500 dark:text-slate-400">
                  {post.user ? (
                    <div className="flex items-center gap-1.5">
                      {post.user.avatar && <img src={post.user.avatar} alt="" className="w-5 h-5 rounded-full" />}
                      <span className="font-medium text-slate-700 dark:text-slate-300">{post.user.name}</span>
                    </div>
                  ) : (
                    <span>익명</span>
                  )}
                  <span>·</span>
                  <span>{timeAgo(post.createdAt)}</span>
                  <span>·</span>
                  <span>조회 {post.viewCount}</span>
                </div>
              </div>

              {(isOwner || isAdmin) && (
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/community/${post.id}/edit`}
                    className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    수정
                  </Link>
                  <button
                    onClick={handleDeletePost}
                    disabled={deleting}
                    className="px-3 py-1.5 text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-60"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {post.content}
            </div>

            {/* Like button */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex items-center justify-center">
              <button
                onClick={handleLike}
                disabled={liking}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 font-medium text-sm transition-all ${
                  post.liked
                    ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-red-300 hover:text-red-500 dark:hover:border-red-700 dark:hover:text-red-400'
                }`}
              >
                <svg className={`w-5 h-5 transition-transform ${liking ? 'scale-90' : ''}`} fill={post.liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                좋아요 {post.likeCount}
              </button>
            </div>
          </div>
        </article>

        {/* Comments */}
        <section>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
            댓글 {post.comments?.length ?? 0}개
          </h2>

          {/* Comment form */}
          <form onSubmit={handleComment} className="mb-6">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder={user ? '댓글을 입력하세요...' : '로그인 후 댓글을 작성할 수 있습니다.'}
                rows={3}
                disabled={!user}
                className="w-full px-4 py-3 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-none disabled:cursor-not-allowed"
              />
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                {!user && (
                  <Link to="/login" className="text-xs text-indigo-600 hover:underline">로그인</Link>
                )}
                <div className="ml-auto">
                  <button
                    type="submit"
                    disabled={!user || !commentText.trim() || submittingComment}
                    className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submittingComment ? '등록 중...' : '댓글 등록'}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Comment list */}
          {!post.comments?.length ? (
            <div className="text-center py-8 text-slate-400 text-sm">첫 번째 댓글을 작성해보세요!</div>
          ) : (
            <div className="space-y-3">
              {post.comments.map(comment => (
                <div key={comment.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {comment.authorName || '익명'}
                        </span>
                        <span className="text-xs text-slate-400">{timeAgo(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                    {(user?.id === comment.userId || isAdmin) && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="shrink-0 text-xs text-slate-400 hover:text-red-500 transition-colors"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
          <Link to="/community" className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            목록으로
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
