import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/components/Toast';
import { timeAgo } from '@/lib/time';
import { getUser } from '@/lib/auth';
import { API_URL } from '@/lib/config';
import SendMessageButton from '@/components/SendMessageButton';
import { commentSchema, type CommentFormValues } from '@/shared/lib/schemas/comment';

interface FlatComment {
  id: string;
  authorName: string;
  content: string;
  userId?: string;
  parentId?: string | null;
  createdAt: string;
}

interface CommentNode extends FlatComment {
  children: CommentNode[];
}

function buildTree(flat: FlatComment[]): CommentNode[] {
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

function countAll(nodes: CommentNode[]): number {
  let n = 0;
  for (const node of nodes) {
    n += 1 + countAll(node.children);
  }
  return n;
}

const MAX_DEPTH = 8;

interface Props {
  resumeId: string;
  isPublic: boolean;
}

export default function CommentSection({ resumeId, isPublic }: Props) {
  const [flat, setFlat] = useState<FlatComment[]>([]);
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const currentUser = getUser();

  const commentForm = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: '' },
  });
  const replyForm = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: '' },
  });
  const content = commentForm.watch('content') ?? '';
  const replyText = replyForm.watch('content') ?? '';

  const load = useCallback(() => {
    fetch(`${API_URL}/api/resumes/${resumeId}/comments`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setFlat)
      .catch(() => {});
  }, [resumeId]);

  useEffect(() => {
    if (isPublic) load();
  }, [resumeId, isPublic, load]);

  const tree = buildTree(flat);

  const onComment = async (data: CommentFormValues) => {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/api/resumes/${resumeId}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: data.content }),
      });
      if (!res.ok) throw new Error('작성에 실패했습니다');
      commentForm.reset();
      toast('의견이 등록되었습니다', 'success');
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : '작성에 실패했습니다', 'error');
    }
  };

  const onReply = (parentId: string) => async (data: CommentFormValues) => {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/api/resumes/${resumeId}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: data.content, parentId }),
      });
      if (!res.ok) throw new Error('답글 작성에 실패했습니다');
      replyForm.reset();
      setReplyingTo(null);
      toast('답글이 등록되었습니다', 'success');
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : '답글 작성에 실패했습니다', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    await fetch(`${API_URL}/api/resumes/${resumeId}/comments/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    load();
  };

  if (!isPublic) return null;

  const renderNode = (node: CommentNode, depth: number) => {
    const isRoot = depth === 0;
    const childCount = countAll(node.children);

    return (
      <div key={node.id}>
        <div
          className={`flex gap-${isRoot ? '3' : '2.5'} p-${isRoot ? '3' : '2.5'} ${
            isRoot
              ? 'bg-slate-50 dark:bg-slate-900 rounded-lg'
              : 'bg-slate-50/50 dark:bg-slate-800/60 rounded-lg'
          } animate-fade-in`}
        >
          {!isRoot && (
            <svg
              className="w-3 h-3 text-indigo-400 shrink-0 mt-1"
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
            className={`${isRoot ? 'w-8 h-8' : 'w-6 h-6'} ${
              isRoot
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
            } rounded-full flex items-center justify-center text-${isRoot ? 'xs' : '[10px]'} font-bold shrink-0`}
          >
            {node.authorName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className={`${isRoot ? 'text-sm' : 'text-xs'} font-medium text-slate-700 dark:text-slate-200`}
              >
                {node.authorName}
              </span>
              {node.userId && (
                <SendMessageButton
                  targetUserId={node.userId}
                  targetUserName={node.authorName}
                  variant="mini"
                />
              )}
              <span
                className={`${isRoot ? 'text-xs' : 'text-[10px]'} text-slate-400 dark:text-slate-500`}
              >
                {timeAgo(node.createdAt)}
              </span>
            </div>
            <p
              className={`${isRoot ? 'text-sm' : 'text-xs'} text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words`}
            >
              {node.content}
            </p>
            <div className="flex items-center gap-3 mt-1.5">
              {currentUser && depth < MAX_DEPTH && (
                <button
                  onClick={() => {
                    if (replyingTo?.id === node.id) {
                      setReplyingTo(null);
                      replyForm.reset();
                    } else {
                      setReplyingTo({ id: node.id, authorName: node.authorName });
                      replyForm.reset();
                    }
                  }}
                  className="text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                    />
                  </svg>
                  {replyingTo?.id === node.id
                    ? '취소'
                    : `답글${childCount > 0 ? ` (${childCount})` : ''}`}
                </button>
              )}
              {!currentUser && childCount > 0 && (
                <span className="text-xs text-slate-400">답글 {childCount}개</span>
              )}
              {(currentUser?.role === 'admin' ||
                currentUser?.role === 'superadmin' ||
                (currentUser?.id && currentUser.id === node.userId)) && (
                <button
                  onClick={() => handleDelete(node.id)}
                  className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                  aria-label="삭제"
                >
                  삭제
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reply form */}
        {replyingTo?.id === node.id && (
          <div className="ml-8 mt-1.5">
            <form
              onSubmit={replyForm.handleSubmit(onReply(node.id))}
              className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl overflow-hidden"
            >
              <div className="px-3 py-2 text-xs text-indigo-600 dark:text-indigo-400 border-b border-indigo-100 dark:border-indigo-800/50 flex items-center gap-2">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                placeholder="답글을 입력하세요 (5-500자)"
                maxLength={500}
                rows={2}
                className="w-full px-3 py-2 text-sm bg-transparent dark:text-slate-100 focus:outline-none resize-none"
                autoFocus
              />
              {replyForm.formState.errors.content && (
                <p className="px-3 text-[11px] text-red-500">
                  {replyForm.formState.errors.content.message}
                </p>
              )}
              <div className="flex items-center justify-between px-3 py-2 border-t border-indigo-100 dark:border-indigo-800/50">
                <span className="text-[10px] text-indigo-400">{replyText.length}/500</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReplyingTo(null);
                      replyForm.reset();
                    }}
                    className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={replyForm.formState.isSubmitting || replyText.trim().length < 5}
                    className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {replyForm.formState.isSubmitting ? '등록 중...' : '답글 등록'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Children */}
        {node.children.length > 0 && (
          <div className="ml-8 mt-1 space-y-1 border-l-2 border-indigo-100 dark:border-indigo-900/30 pl-3">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 no-print">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">
        의견 & 조언 ({flat.length})
      </h3>

      <form onSubmit={commentForm.handleSubmit(onComment)} className="mb-4">
        <textarea
          {...commentForm.register('content')}
          placeholder="이 이력서에 대한 의견이나 조언을 남겨주세요 (5-500자)"
          maxLength={500}
          rows={3}
          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {commentForm.formState.errors.content && (
          <p className="mt-1 text-[11px] text-red-500">
            {commentForm.formState.errors.content.message}
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-slate-400">{content.length}/500</span>
          <button
            type="submit"
            disabled={commentForm.formState.isSubmitting || content.trim().length < 5}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {commentForm.formState.isSubmitting ? '등록 중...' : '의견 남기기'}
          </button>
        </div>
      </form>

      {tree.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
          아직 의견이 없습니다. 첫 번째 의견을 남겨보세요!
        </p>
      ) : (
        <div className="space-y-3">{tree.map((node) => renderNode(node, 0))}</div>
      )}
    </div>
  );
}
