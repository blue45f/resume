/**
 * 스터디 그룹 관리 탭
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as RadixDialog from '@radix-ui/react-dialog';
import { API_URL } from '@/lib/config';
import { toast } from '@/components/Toast';
import AlertDialog from '@/shared/ui/AlertDialog';
import { AdminTable, type AdminTableColumn } from './AdminTable';

type Group = {
  id: string;
  name: string;
  description: string;
  companyTier: string;
  cafeCategory: string;
  experienceLevel: string;
  companyName: string | null;
  position: string | null;
  isPrivate: boolean;
  maxMembers: number;
  memberCount: number;
  createdAt: string;
  owner?: { id?: string; name?: string; email?: string; username?: string };
  _count?: { members?: number; questions?: number };
};

const TIERS = ['all', 'public', 'large', 'mid', 'startup', 'foreign', 'sme', 'freelance', 'etc'];
const CAFES = ['all', 'interview', 'resume', 'coding-test', 'study', 'networking'];
const LEVELS = ['all', 'new', 'junior', 'mid', 'senior', 'any'];

function authHeader(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminStudyGroupsTab() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [tier, setTier] = useState('all');
  const [cafe, setCafe] = useState('all');
  const [level, setLevel] = useState('all');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Group | null>(null);
  const [confirm, setConfirm] = useState<
    | { kind: 'delete'; id: string; name: string }
    | { kind: 'force-close'; id: string; name: string }
    | null
  >(null);

  const query = useQuery<{
    items: Group[];
    total: number;
    totalPages: number;
  } | null>({
    queryKey: ['admin-study-groups', { q, tier, cafe, level, page }],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (q) params.set('q', q);
      if (tier !== 'all') params.set('tier', tier);
      if (cafe !== 'all') params.set('cafe', cafe);
      if (level !== 'all') params.set('experienceLevel', level);
      const res = await fetch(`${API_URL}/api/study-groups/admin/all?${params}`, {
        headers: authHeader(),
      });
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 10_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-study-groups'] });

  const mForce = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/api/study-groups/admin/${id}/force-close`, {
        method: 'PATCH',
        headers: authHeader(),
      });
      if (!res.ok) throw new Error('failed');
      return res.json();
    },
    onSuccess: () => {
      toast('그룹이 강제 종료되었습니다', 'success');
      invalidate();
    },
    onError: () => toast('처리에 실패했습니다', 'error'),
  });

  const mUpdate = useMutation({
    mutationFn: async (vars: { id: string; patch: any }) => {
      const res = await fetch(`${API_URL}/api/study-groups/admin/${vars.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(vars.patch),
      });
      if (!res.ok) throw new Error('failed');
      return res.json();
    },
    onSuccess: () => {
      toast('그룹이 수정되었습니다', 'success');
      setEditing(null);
      invalidate();
    },
    onError: () => toast('수정에 실패했습니다', 'error'),
  });

  const mDelete = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/api/study-groups/admin/${id}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      if (!res.ok) throw new Error('failed');
      return res.json();
    },
    onSuccess: () => {
      toast('그룹이 삭제되었습니다', 'success');
      invalidate();
    },
    onError: () => toast('삭제에 실패했습니다', 'error'),
  });

  const items = query.data?.items ?? [];

  const columns = useMemo<AdminTableColumn<Group>[]>(
    () => [
      {
        key: 'name',
        header: '그룹명',
        render: (g) => (
          <div className="min-w-0 max-w-[260px]">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
              {g.isPrivate && <span className="mr-1 text-slate-500">🔒</span>}
              {g.name}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {g.companyName || '—'} · {g.position || '—'}
            </p>
          </div>
        ),
      },
      {
        key: 'tier',
        header: '티어/카페/경력',
        render: (g) => (
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
            <div>{g.companyTier}</div>
            <div className="text-slate-400">{g.cafeCategory}</div>
            <div className="text-slate-400">{g.experienceLevel}</div>
          </div>
        ),
      },
      {
        key: 'members',
        header: '멤버',
        render: (g) => (
          <span className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
            {g.memberCount} / {g.maxMembers}
          </span>
        ),
      },
      {
        key: 'owner',
        header: '소유자',
        render: (g) => (
          <div className="text-xs text-slate-600 dark:text-slate-400">
            <div className="font-medium truncate max-w-[140px]">
              {g.owner?.name || g.owner?.username || '—'}
            </div>
            <div className="text-slate-400 truncate max-w-[140px]">{g.owner?.email || ''}</div>
          </div>
        ),
      },
      {
        key: 'status',
        header: '상태',
        render: (g) => (
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              g.isPrivate
                ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            }`}
          >
            {g.isPrivate ? '비공개' : '공개'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: '액션',
        render: (g) => (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setEditing(g)}
              className="text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
            >
              수정
            </button>
            <button
              type="button"
              onClick={() => setConfirm({ kind: 'force-close', id: g.id, name: g.name })}
              className="text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400"
            >
              강제 종료
            </button>
            <button
              type="button"
              onClick={() => setConfirm({ kind: 'delete', id: g.id, name: g.name })}
              className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
            >
              삭제
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in-up">
      <AdminTable<Group>
        items={items}
        loading={query.isLoading}
        emptyLabel="스터디 그룹이 없습니다"
        columns={columns}
        getKey={(g) => g.id}
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
              placeholder="이름/설명/회사/직무 검색"
              className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100"
            />
            <select
              value={tier}
              onChange={(e) => {
                setTier(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100"
            >
              {TIERS.map((t) => (
                <option key={t} value={t}>
                  {t === 'all' ? '모든 티어' : t}
                </option>
              ))}
            </select>
            <select
              value={cafe}
              onChange={(e) => {
                setCafe(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100"
            >
              {CAFES.map((c) => (
                <option key={c} value={c}>
                  {c === 'all' ? '모든 카페' : c}
                </option>
              ))}
            </select>
            <select
              value={level}
              onChange={(e) => {
                setLevel(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l === 'all' ? '모든 경력' : l}
                </option>
              ))}
            </select>
          </>
        }
      />

      <AlertDialog
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
        title={
          confirm?.kind === 'delete'
            ? `"${confirm.name}" 그룹을 삭제하시겠습니까?`
            : confirm?.kind === 'force-close'
              ? `"${confirm.name}" 그룹을 강제 종료하시겠습니까?`
              : ''
        }
        description={
          confirm?.kind === 'delete'
            ? '멤버와 모든 질문이 함께 삭제되며 복구할 수 없습니다.'
            : '그룹이 비공개로 전환되고 신규 가입이 차단됩니다.'
        }
        confirmText={confirm?.kind === 'delete' ? '삭제' : '강제 종료'}
        danger={confirm?.kind === 'delete'}
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.kind === 'delete') mDelete.mutate(confirm.id);
          if (confirm.kind === 'force-close') mForce.mutate(confirm.id);
          setConfirm(null);
        }}
      />

      {editing && (
        <EditGroupDialog
          group={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) => mUpdate.mutate({ id: editing.id, patch })}
        />
      )}
    </div>
  );
}

function EditGroupDialog({
  group,
  onClose,
  onSave,
}: {
  group: Group;
  onClose: () => void;
  onSave: (patch: any) => void;
}) {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description);
  const [tier, setTier] = useState(group.companyTier);
  const [cafe, setCafe] = useState(group.cafeCategory);
  const [level, setLevel] = useState(group.experienceLevel);
  const [isPrivate, setPrivate] = useState(group.isPrivate);
  const [maxMembers, setMax] = useState(group.maxMembers);

  return (
    <RadixDialog.Root open onOpenChange={(v) => !v && onClose()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[90] bg-neutral-950/50" />
        <RadixDialog.Content className="fixed z-[91] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xl">
          <RadixDialog.Title className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-3">
            스터디 그룹 수정
          </RadixDialog.Title>
          <div className="space-y-2.5">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="그룹명"
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-slate-100"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="설명"
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-slate-100"
            />
            <div className="stagger-children grid grid-cols-3 gap-2">
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="px-2 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-slate-100"
              >
                {TIERS.filter((t) => t !== 'all').map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <select
                value={cafe}
                onChange={(e) => setCafe(e.target.value)}
                className="px-2 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-slate-100"
              >
                {CAFES.filter((c) => c !== 'all').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="px-2 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-slate-100"
              >
                {LEVELS.filter((l) => l !== 'all').map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setPrivate(e.target.checked)}
                />
                비공개
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                최대 인원
                <input
                  type="number"
                  value={maxMembers}
                  min={2}
                  max={500}
                  onChange={(e) => setMax(parseInt(e.target.value || '2', 10))}
                  className="w-20 px-2 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-slate-100"
                />
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() =>
                onSave({
                  name,
                  description,
                  companyTier: tier,
                  cafeCategory: cafe,
                  experienceLevel: level,
                  isPrivate,
                  maxMembers,
                })
              }
              className="px-4 py-2 text-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100"
            >
              저장
            </button>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
