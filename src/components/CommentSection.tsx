import { useState, useEffect } from 'react';
import { toast } from '@/components/Toast';
import { timeAgo } from '@/lib/time';
import { getUser } from '@/lib/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Comment {
  id: string;
  authorName: string;
  content: string;
  userId?: string;
  createdAt: string;
}

interface Props {
  resumeId: string;
  isPublic: boolean;
}

export default function CommentSection({ resumeId, isPublic }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const currentUser = getUser();

  const load = () => {
    fetch(`${API_URL}/api/resumes/${resumeId}/comments`)
      .then(r => r.ok ? r.json() : [])
      .then(setComments)
      .catch(() => {});
  };

  useEffect(() => {
    if (isPublic) load();
  }, [resumeId, isPublic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim().length < 5) {
      toast('5자 이상 입력해주세요', 'warning');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/api/resumes/${resumeId}/comments`, {
        method: 'POST', headers, body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('작성에 실패했습니다');
      setContent('');
      toast('의견이 등록되었습니다', 'success');
      load();
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
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

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 no-print">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">
        의견 & 조언 ({comments.length})
      </h3>

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="mb-4">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="이 이력서에 대한 의견이나 조언을 남겨주세요 (5-500자)"
          maxLength={500}
          rows={3}
          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-slate-400">{content.length}/500</span>
          <button
            type="submit"
            disabled={loading || content.trim().length < 5}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '등록 중...' : '의견 남기기'}
          </button>
        </div>
      </form>

      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
          아직 의견이 없습니다. 첫 번째 의견을 남겨보세요!
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map(c => (
            <div key={c.id} className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg animate-fade-in">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                {c.authorName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{c.authorName}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words">{c.content}</p>
                {(currentUser?.role === 'admin' || role === 'superadmin' || (currentUser?.id && currentUser.id === c.userId)) && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-xs text-slate-400 hover:text-red-500 transition-colors mt-1"
                    aria-label="삭제"
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
