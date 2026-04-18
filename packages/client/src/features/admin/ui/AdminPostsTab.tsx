/**
 * 커뮤니티 게시물 관리 탭 (AdminPage 내에서 사용)
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '@/lib/config';
import { toast } from '@/components/Toast';
import AlertDialog from '@/shared/ui/AlertDialog';
import { AdminTable, type AdminTableColumn } from './AdminTable';

type Post = {
  id: string;
  title: string;
  category: string;
  viewCount: number;
  likeCount: number;
  isPinned: boolean;
  isHidden: boolean;
  createdAt: string;
  user?: { id?: string; name?: string; email?: string; username?: string };
  _count?: { comments?: number; likes?: number };
};

const CATEGORIES = ['free', 'tips', 'resume', 'cover-letter', 'question'];

function authHeader(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminPostsTab() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [hidden, setHidden] = useState<string>('all'); // all | true | false
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<
    { kind: 'delete'; id: string } | { kind: 'bulk-delete' } | null
  >(null);

  const key = ['admin-posts', { q, category, hidden, page }];
  const query = useQuery<{
    items: Post[];
    total: number;
    totalPages: number;
  } | null>({
    queryKey: key,
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (q) params.set('q', q);
      if (category !== 'all') params.set('category', category);
      if (hidden !== 'all') params.set('hidden', hidden);
      const res = await fetch(`${API_URL}/api/community/admin/posts?${params}`, {
        headers: authHeader(),
      });
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 10_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-posts'] });

  const mHide = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/api/community/admin/posts/${id}/hide`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error('failed');
      return res.json();
    },
    onSuccess: () => {
      toast('게시물 숨김 상태가 변경되었습니다', 'success');
      invalidate();
    },
    onError: () => toast('변경에 실패했습니다', 'error'),
  });

  const mPin = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/api/community/admin/posts/${id}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error('failed');
      return res.json();
    },
    onSuccess: () => {
      toast('핀 상태가 변경되었습니다', 'success');
      invalidate();
    },
    onError: () => toast('변경에 실패했습니다', 'error'),
  });

  const mCategory = useMutation({
    mutationFn: async (params: { id: string; category: string }) => {
      const res = await fetch(`${API_URL}/api/community/admin/posts/${params.id}/category`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ category: params.category }),
      });
      if (!res.ok) throw new Error('failed');
      return res.json();
    },
    onSuccess: () => {
      toast('카테고리가 변경되었습니다', 'success');
      invalidate();
    },
    onError: () => toast('변경에 실패했습니다', 'error'),
  });

  const mDelete = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/api/community/admin/posts/${id}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      if (!res.ok) throw new Error('failed');
      return res.json();
    },
    onSuccess: () => {
      toast('게시물이 삭제되었습니다', 'success');
      invalidate();
    },
    onError: () => toast('삭제에 실패했습니다', 'error'),
  });

  const mBulk = useMutation({
    mutationFn: async (action: 'hide' | 'delete' | 'show') => {
      const ids = Array.from(selected);
      const res = await fetch(`${API_URL}/api/community/admin/posts/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ action, ids }),
      });
      if (!res.ok) throw new Error('failed');
      return res.json();
    },
    onSuccess: (res: any) => {
      toast(`${res?.affected ?? 0}건 처리되었습니다`, 'success');
      setSelected(new Set());
      invalidate();
    },
    onError: () => toast('처리에 실패했습니다', 'error'),
  });

  const items = query.data?.items ?? [];

  const toggleSelectAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((p) => p.id)));
  };
  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const columns = useMemo<AdminTableColumn<Post>[]>(
    () => [
      {
        key: 'select',
        width: '36px',
        header: (
          <input
            type="checkbox"
            aria-label="전체 선택"
            checked={items.length > 0 && selected.size === items.length}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
          />
        ),
        render: (p) => (
          <input
            type="checkbox"
            aria-label="행 선택"
            checked={selected.has(p.id)}
            onChange={() => toggleSelect(p.id)}
            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
          />
        ),
      },
      {
        key: 'title',
        header: '제목',
        render: (p) => (
          <div className="min-w-0 max-w-[320px]">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
              {p.isPinned && <span className="mr-1 text-amber-600">📌</span>}
              {p.isHidden && <span className="mr-1 text-slate-400">🙈</span>}
              {p.title}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date(p.createdAt).toLocaleDateString('ko-KR')}
            </p>
          </div>
        ),
      },
      {
        key: 'author',
        header: '작성자',
        render: (p) => (
          <div className="text-xs text-slate-600 dark:text-slate-400">
            <div className="font-medium truncate max-w-[140px]">
              {p.user?.name || p.user?.username || '—'}
            </div>
            <div className="text-slate-400 truncate max-w-[140px]">{p.user?.email || ''}</div>
          </div>
        ),
      },
      {
        key: 'category',
        header: '카테고리',
        render: (p) => (
          <select
            value={p.category}
            onChange={(e) => mCategory.mutate({ id: p.id, category: e.target.value })}
            className="text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        ),
      },
      {
        key: 'likes',
        header: '좋아요',
        render: (p) => (
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {p._count?.likes ?? p.likeCount ?? 0}
          </span>
        ),
      },
      {
        key: 'comments',
        header: '댓글',
        render: (p) => (
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {p._count?.comments ?? 0}
          </span>
        ),
      },
      {
        key: 'views',
        header: '조회',
        render: (p) => (
          <span className="text-xs text-slate-600 dark:text-slate-400">{p.viewCount ?? 0}</span>
        ),
      },
      {
        key: 'actions',
        header: '액션',
        render: (p) => (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => mHide.mutate(p.id)}
              className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                p.isHidden
                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
              }`}
              title="숨김 토글"
            >
              {p.isHidden ? '표시' : '숨김'}
            </button>
            <button
              type="button"
              onClick={() => mPin.mutate(p.id)}
              className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                p.isPinned
                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
              }`}
              title="핀 토글"
            >
              {p.isPinned ? '핀 해제' : '핀'}
            </button>
            <button
              type="button"
              onClick={() => setConfirm({ kind: 'delete', id: p.id })}
              className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
            >
              삭제
            </button>
          </div>
        ),
      },
    ],
    [items, selected, mHide, mPin, mCategory],
  );

  return (
    <div className="animate-fade-in-up">
      <AdminTable<Post>
        items={items}
        loading={query.isLoading}
        emptyLabel="게시물이 없습니다"
        columns={columns}
        getKey={(p) => p.id}
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
              placeholder="제목/내용 검색"
              className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100"
            />
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="all">모든 카테고리</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={hidden}
              onChange={(e) => {
                setHidden(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="all">상태 전체</option>
              <option value="false">공개</option>
              <option value="true">숨김</option>
            </select>
            {selected.size > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-400">{selected.size}건 선택</span>
                <button
                  type="button"
                  onClick={() => mBulk.mutate('hide')}
                  className="text-xs px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                >
                  일괄 숨김
                </button>
                <button
                  type="button"
                  onClick={() => setConfirm({ kind: 'bulk-delete' })}
                  className="text-xs px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100"
                >
                  일괄 삭제
                </button>
              </div>
            )}
          </>
        }
      />
      <AlertDialog
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
        title={
          confirm?.kind === 'bulk-delete'
            ? `${selected.size}건 일괄 삭제하시겠습니까?`
            : '게시물을 삭제하시겠습니까?'
        }
        description="삭제된 게시물은 복구할 수 없습니다."
        confirmText="삭제"
        danger
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.kind === 'delete') mDelete.mutate(confirm.id);
          if (confirm.kind === 'bulk-delete') mBulk.mutate('delete');
          setConfirm(null);
        }}
      />
    </div>
  );
}
