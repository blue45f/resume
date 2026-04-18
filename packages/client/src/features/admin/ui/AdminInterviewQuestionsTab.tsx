/**
 * 면접 질문 관리 탭
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '@/lib/config';
import { toast } from '@/components/Toast';
import AlertDialog from '@/shared/ui/AlertDialog';
import { AdminTable, type AdminTableColumn } from './AdminTable';

type Question = {
  id: string;
  companyName: string;
  position: string;
  question: string;
  sampleAnswer: string;
  category: string;
  difficulty: string;
  upvotes: number;
  source: string;
  isApproved: boolean;
  isRejected: boolean;
  createdAt: string;
  author?: { id?: string; name?: string; email?: string; username?: string };
};

function authHeader(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminInterviewQuestionsTab() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState<{ id: string } | null>(null);

  const query = useQuery<{
    items: Question[];
    total: number;
    totalPages: number;
  } | null>({
    queryKey: ['admin-interview-questions', { status, q, page }],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (status !== 'all') params.set('status', status);
      if (q) params.set('q', q);
      const res = await fetch(`${API_URL}/api/job-interview-questions/admin/all?${params}`, {
        headers: authHeader(),
      });
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 10_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-interview-questions'] });

  const mApprove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/api/job-interview-questions/admin/${id}/approve`, {
        method: 'PATCH',
        headers: authHeader(),
      });
      if (!res.ok) throw new Error('failed');
      return res.json();
    },
    onSuccess: () => {
      toast('질문이 채택되었습니다', 'success');
      invalidate();
    },
    onError: () => toast('처리에 실패했습니다', 'error'),
  });

  const mReject = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/api/job-interview-questions/admin/${id}/reject`, {
        method: 'PATCH',
        headers: authHeader(),
      });
      if (!res.ok) throw new Error('failed');
      return res.json();
    },
    onSuccess: () => {
      toast('질문이 반려되었습니다', 'success');
      invalidate();
    },
    onError: () => toast('처리에 실패했습니다', 'error'),
  });

  const mUpvotes = useMutation({
    mutationFn: async (vars: { id: string; upvotes: number }) => {
      const res = await fetch(`${API_URL}/api/job-interview-questions/admin/${vars.id}/upvotes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ upvotes: vars.upvotes }),
      });
      if (!res.ok) throw new Error('failed');
      return res.json();
    },
    onSuccess: () => invalidate(),
    onError: () => toast('upvote 변경에 실패했습니다', 'error'),
  });

  const mDelete = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/api/job-interview-questions/admin/${id}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      if (!res.ok) throw new Error('failed');
      return res.json();
    },
    onSuccess: () => {
      toast('질문이 삭제되었습니다', 'success');
      invalidate();
    },
    onError: () => toast('삭제에 실패했습니다', 'error'),
  });

  const items = query.data?.items ?? [];

  const columns = useMemo<AdminTableColumn<Question>[]>(
    () => [
      {
        key: 'question',
        header: '질문',
        render: (it) => (
          <div className="min-w-0 max-w-[360px]">
            <p className="text-sm text-slate-800 dark:text-slate-200 line-clamp-2">{it.question}</p>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {it.companyName} · {it.position} · {it.category || '-'} · {it.difficulty}
            </p>
          </div>
        ),
      },
      {
        key: 'author',
        header: '작성자',
        render: (it) => (
          <div className="text-xs text-slate-600 dark:text-slate-400">
            <div className="truncate max-w-[140px]">
              {it.author?.name || it.author?.username || it.source}
            </div>
            <div className="text-slate-400 truncate max-w-[140px]">{it.author?.email || ''}</div>
          </div>
        ),
      },
      {
        key: 'status',
        header: '상태',
        render: (it) => (
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              it.isApproved
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : it.isRejected
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            }`}
          >
            {it.isApproved ? '채택' : it.isRejected ? '반려' : '대기'}
          </span>
        ),
      },
      {
        key: 'upvotes',
        header: 'upvote',
        render: (it) => (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => mUpvotes.mutate({ id: it.id, upvotes: Math.max(0, it.upvotes - 1) })}
              className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-xs"
              aria-label="upvote 감소"
            >
              −
            </button>
            <span className="text-sm w-8 text-center text-slate-700 dark:text-slate-300 tabular-nums">
              {it.upvotes}
            </span>
            <button
              type="button"
              onClick={() => mUpvotes.mutate({ id: it.id, upvotes: it.upvotes + 1 })}
              className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-xs"
              aria-label="upvote 증가"
            >
              +
            </button>
          </div>
        ),
      },
      {
        key: 'actions',
        header: '액션',
        render: (it) => (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => mApprove.mutate(it.id)}
              disabled={it.isApproved}
              className="text-xs px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 disabled:opacity-40"
            >
              채택
            </button>
            <button
              type="button"
              onClick={() => mReject.mutate(it.id)}
              disabled={it.isRejected}
              className="text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 disabled:opacity-40"
            >
              반려
            </button>
            <button
              type="button"
              onClick={() => setConfirm({ id: it.id })}
              className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
            >
              삭제
            </button>
          </div>
        ),
      },
    ],
    [mApprove, mReject, mUpvotes],
  );

  return (
    <div className="animate-fade-in-up">
      <AdminTable<Question>
        items={items}
        loading={query.isLoading}
        emptyLabel="면접 질문이 없습니다"
        columns={columns}
        getKey={(it) => it.id}
        page={page}
        totalPages={query.data?.totalPages}
        total={query.data?.total}
        onPageChange={setPage}
        toolbar={
          <>
            <input
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="질문/회사/직무 검색"
              className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100"
            />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="all">상태 전체</option>
              <option value="pending">대기</option>
              <option value="approved">채택</option>
              <option value="rejected">반려</option>
            </select>
          </>
        }
      />
      <AlertDialog
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
        title="이 질문을 삭제하시겠습니까?"
        description="삭제된 질문은 복구할 수 없습니다."
        confirmText="삭제"
        danger
        onConfirm={() => {
          if (confirm) mDelete.mutate(confirm.id);
          setConfirm(null);
        }}
      />
    </div>
  );
}
