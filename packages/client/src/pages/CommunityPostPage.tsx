import { API_URL } from '@/lib/config';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getUser } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';
import { toast } from '@/components/Toast';
import ReportButton from '@/components/ReportButton';
import SendMessageButton from '@/components/SendMessageButton';
import {
  communityCommentSchema,
  type CommunityCommentFormValues,
} from '@/shared/lib/schemas/comment';

const CATEGORY_INFO: Record<string, { label: string; icon: string; color: string }> = {
  notice: {
    label: '공지사항',
    icon: '📢',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  free: {
    label: '자유',
    icon: '💬',
    color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  },
  tips: {
    label: '취업팁',
    icon: '💡',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  resume: {
    label: '이력서피드백',
    icon: '📄',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  'cover-letter': {
    label: '자소서',
    icon: '✍️',
    color: 'bg-sky-100 text-purple-700 dark:bg-sky-900/30 dark:text-sky-400',
  },
  question: {
    label: '질문',
    icon: '❓',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
};

interface Comment {
  id: string;
  content: string;
  authorName?: string;
  userId?: string;
  parentId?: string | null;
  createdAt: string;
}

interface CommentNode extends Comment {
  children: CommentNode[];
}

function buildCommentTree(flat: Comment[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];
  for (const c of flat) map.set(c.id, { ...c, children: [] });
  for (const c of flat) {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function countDescendants(node: CommentNode): number {
  let n = 0;
  for (const child of node.children) {
    n += 1 + countDescendants(child);
  }
  return n;
}

const MAX_REPLY_DEPTH = 8;

interface Attachment {
  url: string;
  name: string;
  size: number;
  type: string;
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
  attachments?: Attachment[];
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

function readingTime(text: string): string {
  const words = text.trim().split(/\s+/).length;
  const mins = Math.ceil(words / 200);
  return mins <= 1 ? '1분 이내' : `${mins}분`;
}

/** Markdown → HTML renderer */
function inlineFmt(s: string): string {
  const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  s = esc(s);
  s = s.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
  s = s.replace(
    /`([^`]+)`/g,
    '<code class="bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>',
  );
  s = s.replace(/~~(.+?)~~/g, '<del class="opacity-60">$1</del>');
  s = s.replace(
    /\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener" class="text-indigo-600 dark:text-indigo-400 underline underline-offset-2 hover:opacity-80">$1</a>',
  );
  s = s.replace(
    /(^|[\s])(https?:\/\/[^\s<]+)/g,
    '$1<a href="$2" target="_blank" rel="noopener" class="text-indigo-600 dark:text-indigo-400 underline underline-offset-2 break-all hover:opacity-80">$2</a>',
  );
  return s;
}

function renderMarkdown(text: string): string {
  const lines = text.split('\n');
  const out: string[] = [];
  let inCode = false;
  let inList = false;
  let inQuote = false;
  const closeList = () => {
    if (inList) {
      out.push('</ul>');
      inList = false;
    }
  };
  const closeQuote = () => {
    if (inQuote) {
      out.push('</blockquote>');
      inQuote = false;
    }
  };

  for (const raw of lines) {
    if (raw.startsWith('```')) {
      closeList();
      closeQuote();
      if (!inCode) {
        out.push(
          '<pre class="bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-3 overflow-x-auto text-sm font-mono my-3 text-slate-800 dark:text-slate-200">',
        );
        inCode = true;
      } else {
        out.push('</pre>');
        inCode = false;
      }
      continue;
    }
    if (inCode) {
      out.push(raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
      continue;
    }
    if (raw.startsWith('### ')) {
      closeList();
      closeQuote();
      out.push(
        `<h3 class="text-lg font-bold mt-5 mb-2 text-slate-900 dark:text-slate-100">${inlineFmt(raw.slice(4))}</h3>`,
      );
      continue;
    }
    if (raw.startsWith('## ')) {
      closeList();
      closeQuote();
      out.push(
        `<h2 class="text-xl font-bold mt-6 mb-2 text-slate-900 dark:text-slate-100">${inlineFmt(raw.slice(3))}</h2>`,
      );
      continue;
    }
    if (raw.startsWith('# ')) {
      closeList();
      closeQuote();
      out.push(
        `<h1 class="text-2xl font-bold mt-6 mb-3 text-slate-900 dark:text-slate-100">${inlineFmt(raw.slice(2))}</h1>`,
      );
      continue;
    }
    if (raw.startsWith('> ')) {
      closeList();
      if (!inQuote) {
        out.push(
          '<blockquote class="border-l-4 border-indigo-400 pl-4 my-3 text-slate-500 dark:text-slate-400 italic">',
        );
        inQuote = true;
      }
      out.push(`<p class="mb-1">${inlineFmt(raw.slice(2))}</p>`);
      continue;
    } else {
      closeQuote();
    }
    if (raw.startsWith('- ') || raw.startsWith('* ')) {
      if (!inList) {
        out.push(
          '<ul class="list-disc list-inside my-2 space-y-1 text-slate-700 dark:text-slate-300">',
        );
        inList = true;
      }
      out.push(`<li>${inlineFmt(raw.slice(2))}</li>`);
      continue;
    } else {
      closeList();
    }
    const olM = raw.match(/^(\d+)\. (.+)/);
    if (olM) {
      closeList();
      closeQuote();
      out.push(
        `<p class="my-1 ml-4 text-slate-700 dark:text-slate-300">${olM[1]}. ${inlineFmt(olM[2])}</p>`,
      );
      continue;
    }
    if (raw === '---' || raw === '***') {
      closeList();
      closeQuote();
      out.push('<hr class="my-4 border-slate-200 dark:border-slate-700" />');
      continue;
    }
    if (raw.trim() === '') {
      closeList();
      closeQuote();
      out.push('<div class="h-3"></div>');
      continue;
    }
    out.push(
      `<p class="my-1.5 text-slate-700 dark:text-slate-300 leading-relaxed">${inlineFmt(raw)}</p>`,
    );
  }
  closeList();
  closeQuote();
  if (inCode) out.push('</pre>');
  return out.join('\n');
}

function ContentRenderer({ content }: { content: string }) {
  return (
    <div
      className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base prose-style"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
}

export default function CommunityPostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = getUser();
  const queryClient = useQueryClient();

  const {
    data: postData,
    isLoading: loading,
    refetch,
  } = useQuery<Post | null>({
    queryKey: ['community-post', id],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) (headers as any).Authorization = `Bearer ${token}`;
      const r = await fetch(`${API_URL}/api/community/${id}`, { headers });
      return r.ok ? await r.json() : null;
    },
    enabled: !!id,
  });
  const post: Post | null = (postData as Post | null | undefined) ?? null;
  const setPost = (updater: Post | null | ((prev: Post | null) => Post | null)) => {
    queryClient.setQueryData<Post | null>(['community-post', id], (prev) =>
      typeof updater === 'function'
        ? (updater as (prev: Post | null) => Post | null)(prev ?? null)
        : updater,
    );
  };
  const [liking, setLiking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  const commentForm = useForm<CommunityCommentFormValues>({
    resolver: zodResolver(communityCommentSchema),
    defaultValues: { content: '', authorName: localStorage.getItem('anon-name') || '' },
  });
  const replyForm = useForm<CommunityCommentFormValues>({
    resolver: zodResolver(communityCommentSchema),
    defaultValues: { content: '', authorName: localStorage.getItem('anon-name') || '' },
  });
  const commentText = commentForm.watch('content') ?? '';
  const replyText = replyForm.watch('content') ?? '';
  const commentSectionRef = useRef<HTMLElement>(null);
  const [scrapped, setScrapped] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('scrapped-posts') || '[]').includes(id);
    } catch {
      return false;
    }
  });

  const toggleScrap = () => {
    try {
      const saved: string[] = JSON.parse(localStorage.getItem('scrapped-posts') || '[]');
      const updated = scrapped ? saved.filter((s) => s !== id) : [...saved, id].slice(-50);
      localStorage.setItem('scrapped-posts', JSON.stringify(updated));
      setScrapped(!scrapped);
      toast(scrapped ? '스크랩이 해제되었습니다' : '게시글을 스크랩했습니다', 'success');
    } catch {}
  };

  const fetchPost = useCallback(async () => {
    await refetch();
  }, [refetch]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (post) document.title = `${post.title} — 커뮤니티 — 이력서공방`;
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, [post]);

  const handleLike = async () => {
    if (!user) {
      navigate(ROUTES.login);
      return;
    }
    if (liking || !post) return;
    setLiking(true);

    // Optimistic update
    setPost((p) =>
      p ? { ...p, liked: !p.liked, likeCount: p.likeCount + (p.liked ? -1 : 1) } : p,
    );

    const token = localStorage.getItem('token');
    const r = await fetch(`${API_URL}/api/community/${post.id}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` } as any,
    });

    if (!r.ok) {
      // Revert
      setPost((p) =>
        p ? { ...p, liked: !p.liked, likeCount: p.likeCount + (p.liked ? -1 : 1) } : p,
      );
    }
    setLiking(false);
  };

  const onComment = async (data: CommunityCommentFormValues) => {
    if (!user && data.authorName) {
      localStorage.setItem('anon-name', data.authorName);
    }
    const token = localStorage.getItem('token');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) (headers as Record<string, string>).Authorization = `Bearer ${token}`;
    const body: Record<string, unknown> = { content: data.content.trim() };
    if (!user && data.authorName) body.authorName = data.authorName;
    const r = await fetch(`${API_URL}/api/community/${id}/comments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (r.ok) {
      commentForm.setValue('content', '');
      fetchPost();
    } else {
      toast('댓글 등록에 실패했습니다', 'error');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    const token = localStorage.getItem('token');
    const r = await fetch(`${API_URL}/api/community/${id}/comments/${commentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` } as any,
    });
    if (r.ok) fetchPost();
    else toast('삭제에 실패했습니다', 'error');
  };

  const onReply = (parentId: string) => async (data: CommunityCommentFormValues) => {
    if (!replyingTo) return;
    const token = localStorage.getItem('token');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) (headers as Record<string, string>).Authorization = `Bearer ${token}`;
    const body: Record<string, unknown> = { content: data.content.trim(), parentId };
    if (!user && data.authorName) body.authorName = data.authorName;
    const r = await fetch(`${API_URL}/api/community/${id}/comments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (r.ok) {
      replyForm.reset({ content: '', authorName: localStorage.getItem('anon-name') || '' });
      setReplyingTo(null);
      fetchPost();
    } else {
      toast('답글 등록에 실패했습니다', 'error');
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('게시글을 삭제하시겠습니까?')) return;
    setDeleting(true);
    const token = localStorage.getItem('token');
    const r = await fetch(`${API_URL}/api/community/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` } as any,
    });
    if (r.ok) navigate(ROUTES.community.list);
    else {
      toast('삭제에 실패했습니다', 'error');
      setDeleting(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: post?.title, url });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(url);
    toast('링크가 복사되었습니다', 'success');
  };

  const scrollToComment = () => {
    commentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => commentRef.current?.focus(), 400);
  };

  const isOwner = user && post?.user?.id === user.id;
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const catInfo = post ? CATEGORY_INFO[post.category] || CATEGORY_INFO.free : null;

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" />
            <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
            <div className="h-px bg-slate-200 dark:bg-slate-700 my-6" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-4 bg-slate-100 dark:bg-slate-700 rounded"
                  style={{ width: `${90 - i * 5}%` }}
                />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Header />
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 text-center">
          <div className="text-5xl mb-4">🚫</div>
          <p className="text-slate-600 dark:text-slate-400 font-medium mb-2">
            게시글을 찾을 수 없습니다
          </p>
          <p className="text-sm text-slate-400 mb-6">삭제되었거나 존재하지 않는 게시글입니다.</p>
          <Link
            to={ROUTES.community.list}
            className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            커뮤니티로 돌아가기
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
          <Link to={ROUTES.community.list} className="hover:text-indigo-600 transition-colors">
            커뮤니티
          </Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {catInfo && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-lg ${catInfo.color}`}
            >
              {catInfo.icon} {catInfo.label}
            </span>
          )}
        </div>

        {/* Post article */}
        <article className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden mb-6">
          <div className="p-6 sm:p-8">
            {/* Post header */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex-1 min-w-0">
                {post.isPinned && (
                  <div className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-bold mb-2">
                    <span>📌</span> 공지사항
                  </div>
                )}
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight break-words">
                  {post.title}
                </h1>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!isOwner && user && (
                  <ReportButton
                    endpoint={`/api/community/${post.id}/report`}
                    targetLabel="게시물"
                  />
                )}
                {(isOwner || isAdmin) && (
                  <>
                    <Link
                      to={ROUTES.community.postEdit(post.id)}
                      className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      수정
                    </Link>
                    <button
                      onClick={handleDeletePost}
                      disabled={deleting}
                      className="px-3 py-1.5 text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-60"
                    >
                      {deleting ? '삭제 중...' : '삭제'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Author & meta */}
            <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                {post.user?.avatar ? (
                  <img
                    src={post.user.avatar}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {(post.user?.name || '?')[0]}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {post.user?.name || '익명'}
                    </span>
                    {post.user?.id && (
                      <SendMessageButton
                        targetUserId={post.user.id}
                        targetUserName={post.user.name}
                        variant="mini"
                      />
                    )}
                  </div>
                  <div className="text-xs text-slate-400">{timeAgo(post.createdAt)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-auto text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5"
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
                  {post.viewCount.toLocaleString()}
                </span>
                <span>·</span>
                <span>읽기 {readingTime(post.content)}</span>
              </div>
            </div>

            {/* Content */}
            <div className="py-6">
              <ContentRenderer content={post.content} />
            </div>

            {/* Attachments */}
            {Array.isArray(post.attachments) && post.attachments.length > 0 && (
              <div className="pb-5 border-b border-slate-100 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                  첨부파일 {post.attachments.length}개
                </p>
                <div className="space-y-1.5">
                  {post.attachments.map((att, idx) => (
                    <a
                      key={idx}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10 transition-colors group"
                    >
                      <span className="text-base flex-shrink-0">
                        {att.type?.startsWith('image/')
                          ? '🖼️'
                          : att.type === 'application/pdf'
                            ? '📄'
                            : '📎'}
                      </span>
                      <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 truncate">
                        {att.name}
                      </span>
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {(att.size / 1024).toFixed(0)}KB
                      </span>
                      <svg
                        className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Action bar */}
            <div className="pt-5 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Like button */}
                <button
                  onClick={handleLike}
                  disabled={liking}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-medium text-sm transition-all ${
                    post.liked
                      ? 'border-red-300 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-red-200 hover:text-red-500 dark:hover:border-red-800 dark:hover:text-red-400'
                  }`}
                >
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${liking ? 'scale-125' : ''} ${post.liked ? 'animate-bounce' : 'hover:scale-110'}`}
                    fill={post.liked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={
                      post.liked
                        ? { animationDuration: '0.3s', animationIterationCount: '1' }
                        : undefined
                    }
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span>좋아요 {post.likeCount}</span>
                </button>

                {/* Comment jump */}
                <button
                  onClick={scrollToComment}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-300 hover:text-indigo-600 dark:hover:border-indigo-700 dark:hover:text-indigo-400 font-medium text-sm transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  댓글 {post.comments?.length ?? 0}
                </button>
              </div>

              <div className="flex items-center gap-1">
                {/* Scrap */}
                <button
                  onClick={toggleScrap}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${
                    scrapped ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'
                  }`}
                  title={scrapped ? '스크랩 해제' : '스크랩'}
                >
                  <svg
                    className="w-4 h-4"
                    fill={scrapped ? 'currentColor' : 'none'}
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
                  {scrapped ? '스크랩됨' : '스크랩'}
                </button>

                {/* Share */}
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                  공유
                </button>
              </div>
            </div>
          </div>
        </article>

        {/* Comments section */}
        <section ref={commentSectionRef}>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <svg
              className="w-4 h-4 text-indigo-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            댓글 <span className="text-indigo-500">{post.comments?.length ?? 0}</span>
          </h2>

          {/* Comment form */}
          <form onSubmit={commentForm.handleSubmit(onComment)} className="mb-6">
            <div className="imp-card overflow-hidden focus-within:border-indigo-400 dark:focus-within:border-indigo-600 transition-colors">
              {/* Anon name field for non-logged-in users */}
              {!user && (
                <div className="px-4 pt-3 pb-2 border-b border-slate-100 dark:border-slate-700">
                  <input
                    type="text"
                    {...commentForm.register('authorName')}
                    placeholder="닉네임 (선택, 비어 있으면 '익명')"
                    maxLength={20}
                    className="w-full text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 bg-transparent focus:outline-none"
                  />
                </div>
              )}
              <textarea
                {...commentForm.register('content')}
                ref={(el) => {
                  commentForm.register('content').ref(el);
                  commentRef.current = el;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    if (commentText.trim()) commentForm.handleSubmit(onComment)();
                  }
                }}
                placeholder="댓글을 입력하세요... (⌘+Enter로 등록)"
                rows={3}
                className="w-full px-4 py-3 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-none"
              />
              {commentForm.formState.errors.content && (
                <p className="px-4 pb-1 text-[11px] text-red-500">
                  {commentForm.formState.errors.content.message}
                </p>
              )}
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {!user && (
                    <Link
                      to={ROUTES.login}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      로그인하면 이름이 표시됩니다
                    </Link>
                  )}
                  <span
                    className={`text-xs ${commentText.length > 800 ? 'text-red-500' : 'text-slate-400'}`}
                  >
                    {commentText.length} / 1000
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={
                    !commentText.trim() ||
                    commentForm.formState.isSubmitting ||
                    commentText.length > 1000
                  }
                  className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {commentForm.formState.isSubmitting ? '등록 중...' : '댓글 등록'}
                </button>
              </div>
            </div>
          </form>

          {/* Comment list */}
          {(() => {
            const tree = buildCommentTree(post.comments || []);

            const renderCommentNode = (node: CommentNode, depth: number) => {
              const isRoot = depth === 0;
              const descendantCount = countDescendants(node);

              return (
                <div key={node.id}>
                  <div
                    className={`${
                      isRoot
                        ? 'imp-card p-4'
                        : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 rounded-xl p-3'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          {!isRoot && (
                            <svg
                              className="w-3 h-3 text-indigo-400 shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                              />
                            </svg>
                          )}
                          <div
                            className={`${isRoot ? 'w-6 h-6' : 'w-5 h-5'} rounded-full ${
                              isRoot
                                ? 'bg-slate-200 dark:bg-slate-600'
                                : 'bg-indigo-100 dark:bg-indigo-900/30'
                            } flex items-center justify-center text-${isRoot ? '[10px]' : '[9px]'} font-bold ${
                              isRoot
                                ? 'text-slate-600 dark:text-slate-300'
                                : 'text-indigo-600 dark:text-indigo-400'
                            } shrink-0`}
                          >
                            {(node.authorName || '익')[0]}
                          </div>
                          <span
                            className={`${isRoot ? 'text-sm' : 'text-xs'} font-medium ${isRoot ? 'text-slate-900 dark:text-slate-100' : 'text-slate-800 dark:text-slate-200'}`}
                          >
                            {node.authorName || '익명'}
                            {node.userId && node.userId === post.user?.id && (
                              <span
                                className={`ml-1.5 ${isRoot ? 'text-[10px]' : 'text-[9px]'} bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-semibold`}
                              >
                                작성자
                              </span>
                            )}
                          </span>
                          {node.userId && (
                            <SendMessageButton
                              targetUserId={node.userId}
                              targetUserName={node.authorName}
                              variant="mini"
                            />
                          )}
                          <span className={`${isRoot ? 'text-xs' : 'text-[10px]'} text-slate-400`}>
                            {timeAgo(node.createdAt)}
                          </span>
                        </div>
                        <p
                          className={`${isRoot ? 'text-sm pl-8' : 'text-xs pl-7'} text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed`}
                        >
                          {node.content}
                        </p>
                        <div className={`flex items-center gap-3 ${isRoot ? 'pl-8' : 'pl-7'} mt-2`}>
                          {user && depth < MAX_REPLY_DEPTH && (
                            <button
                              onClick={() => {
                                if (replyingTo?.id === node.id) {
                                  setReplyingTo(null);
                                  replyForm.reset({
                                    content: '',
                                    authorName: localStorage.getItem('anon-name') || '',
                                  });
                                } else {
                                  setReplyingTo({
                                    id: node.id,
                                    authorName: node.authorName || '익명',
                                  });
                                  replyForm.reset({
                                    content: '',
                                    authorName: localStorage.getItem('anon-name') || '',
                                  });
                                }
                              }}
                              className="text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center gap-1"
                            >
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
                                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                                />
                              </svg>
                              {replyingTo?.id === node.id
                                ? '취소'
                                : `답글${descendantCount > 0 ? ` (${descendantCount})` : ''}`}
                            </button>
                          )}
                          {!user && descendantCount > 0 && (
                            <span className="text-xs text-slate-400">답글 {descendantCount}개</span>
                          )}
                        </div>
                      </div>
                      {(user?.id === node.userId || isAdmin) && (
                        <button
                          onClick={() => handleDeleteComment(node.id)}
                          className="shrink-0 text-xs text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                          aria-label="댓글 삭제"
                        >
                          <svg
                            className={`${isRoot ? 'w-3.5 h-3.5' : 'w-3 h-3'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Reply form */}
                  {replyingTo?.id === node.id && (
                    <div className="ml-6 mt-1 border-l-2 border-indigo-200 dark:border-indigo-800 pl-3">
                      <form
                        onSubmit={replyForm.handleSubmit(onReply(node.id))}
                        className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl overflow-hidden"
                      >
                        <div className="px-3 py-2 text-xs text-indigo-600 dark:text-indigo-400 border-b border-indigo-100 dark:border-indigo-800/50 flex items-center gap-1.5">
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
                              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                            />
                          </svg>
                          <span className="font-medium">{replyingTo.authorName}</span>님에게 답글
                        </div>
                        <textarea
                          {...replyForm.register('content')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                              e.preventDefault();
                              if (replyText.trim()) replyForm.handleSubmit(onReply(node.id))();
                            }
                          }}
                          placeholder="답글을 입력하세요... (⌘+Enter로 등록)"
                          rows={2}
                          autoFocus
                          className="w-full px-3 py-2 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-none"
                        />
                        {replyForm.formState.errors.content && (
                          <p className="px-3 pb-1 text-[11px] text-red-500">
                            {replyForm.formState.errors.content.message}
                          </p>
                        )}
                        <div className="px-3 py-2 bg-indigo-100/50 dark:bg-indigo-900/30 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingTo(null);
                              replyForm.reset({
                                content: '',
                                authorName: localStorage.getItem('anon-name') || '',
                              });
                            }}
                            className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 transition-colors"
                          >
                            취소
                          </button>
                          <button
                            type="submit"
                            disabled={!replyText.trim() || replyForm.formState.isSubmitting}
                            className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                          >
                            {replyForm.formState.isSubmitting ? '등록 중...' : '답글 등록'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Recursive children */}
                  {node.children.length > 0 && (
                    <div className="ml-6 mt-1 space-y-1 border-l-2 border-indigo-100 dark:border-indigo-900/30 pl-3">
                      {node.children.map((child) => renderCommentNode(child, depth + 1))}
                    </div>
                  )}
                </div>
              );
            };

            return !tree.length ? (
              <div className="text-center py-10 imp-card">
                <div className="text-3xl mb-2">💬</div>
                <p className="text-slate-400 text-sm">첫 번째 댓글을 작성해보세요!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tree.map((node, idx) => (
                  <div
                    key={node.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    {renderCommentNode(node, 0)}
                  </div>
                ))}
              </div>
            );
          })()}
        </section>

        {/* Back link */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
          <Link
            to={ROUTES.community.list}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            목록으로
          </Link>
        </div>
      </main>

      {/* Scroll to top FAB */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-all duration-200 flex items-center justify-center hover:shadow-xl hover:-translate-y-0.5 animate-fade-in-up"
          aria-label="맨 위로"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}

      <Footer />
    </>
  );
}
