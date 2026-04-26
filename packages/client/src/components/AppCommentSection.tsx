import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/components/Toast';
import { timeAgo } from '@/lib/time';
import { API_URL } from '@/lib/config';
import { commentSchema, type CommentFormValues } from '@/shared/lib/schemas/comment';

interface AppComment {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

interface Props {
  applicationId: string;
  isPublic: boolean;
}

export default function AppCommentSection({ applicationId, isPublic }: Props) {
  const [comments, setComments] = useState<AppComment[]>([]);
  const [expanded, setExpanded] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: '' },
  });

  const content = watch('content') ?? '';

  const load = () => {
    fetch(`${API_URL}/api/applications/${applicationId}/comments`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setComments)
      .catch(() => {});
  };

  useEffect(() => {
    if (isPublic && expanded) load();
  }, [applicationId, isPublic, expanded]);

  const onSubmit = async (data: CommentFormValues) => {
    // Optimistic update: show comment immediately
    const optimisticId = `optimistic-${Date.now()}`;
    const userName = (() => {
      try {
        return JSON.parse(localStorage.getItem('user') || '{}').name || '나';
      } catch {
        return '나';
      }
    })();
    const optimisticComment: AppComment = {
      id: optimisticId,
      authorName: userName,
      content: data.content.trim(),
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [...prev, optimisticComment]);
    const savedContent = data.content;
    reset();

    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/api/applications/${applicationId}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: savedContent }),
      });
      if (!res.ok) throw new Error('작성에 실패했습니다');
      toast('의견이 등록되었습니다', 'success');
      load();
    } catch (e) {
      setComments((prev) => prev.filter((c) => c.id !== optimisticId));
      setValue('content', savedContent);
      toast(e instanceof Error ? e.message : '작성에 실패했습니다', 'error');
    }
  };

  if (!isPublic) return null;

  return (
    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        의견 {comments.length > 0 ? `(${comments.length})` : '남기기'}
        <svg
          className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 animate-fade-in">
          {/* Comment form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2">
            <input
              type="text"
              {...register('content')}
              placeholder="조언이나 의견을 남겨주세요 (5자 이상)"
              maxLength={500}
              className="flex-1 px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isSubmitting || content.trim().length < 5}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0"
            >
              {isSubmitting ? '...' : '등록'}
            </button>
          </form>
          {errors.content && <p className="text-[11px] text-red-500">{errors.content.message}</p>}

          {/* Comments list */}
          {comments.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-2">
              아직 의견이 없습니다
            </p>
          ) : (
            <div className="space-y-2">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    {c.authorName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                        {c.authorName}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {timeAgo(c.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 break-words">
                      {c.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
