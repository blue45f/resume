/**
 * 회원 관리 탭 (확장판) — role 변경, 정지/해제, 탈퇴
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '@/lib/config';
import { toast } from '@/components/Toast';
import AlertDialog from '@/shared/ui/AlertDialog';
import { AdminTable, type AdminTableColumn } from './AdminTable';

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  username?: string;
  userType?: string;
  provider: string;
  role: string;
  plan?: string;
  isSuspended?: boolean;
  createdAt: string;
  lastLoginAt?: string;
};

function authHeader(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminUsersTab({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [userType, setUserType] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 15;
  const [confirm, setConfirm] = useState<
    | { kind: 'delete'; id: string; email: string }
    | { kind: 'suspend'; id: string; email: string }
    | null
  >(null);

  const query = useQuery<UserRow[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/auth/admin/users`, {
        headers: authHeader(),
      });
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30_000,
  });
  const users = query.data ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-users'] });

  const mRole = useMutation({
    mutationFn: async (vars: { id: string; role: string }) => {
      const res = await fetch(`${API_URL}/api/auth/admin/users/${vars.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ role: vars.role }),
      });
      if (!res.ok) throw new Error((await res.json())?.message || 'failed');
      return res.json();
    },
    onSuccess: (_r, v) => {
      toast(`역할이 ${v.role}로 변경되었습니다`, 'success');
      invalidate();
    },
    onError: (e: any) => toast(e?.message || '변경에 실패했습니다', 'error'),
  });

  const mSuspend = useMutation({
    mutationFn: async (vars: { id: string; suspend: boolean }) => {
      const url = `${API_URL}/api/auth/admin/users/${vars.id}/${vars.suspend ? 'suspend' : 'resume'}`;
      const res = await fetch(url, { method: 'PATCH', headers: authHeader() });
      if (!res.ok) throw new Error('failed');
      return res.json();
    },
    onSuccess: (_r, v) => {
      toast(v.suspend ? '계정이 정지되었습니다' : '정지가 해제되었습니다', 'success');
      invalidate();
    },
    onError: () => toast('처리에 실패했습니다', 'error'),
  });

  const mDelete = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/api/auth/admin/users/${id}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      if (!res.ok) throw new Error('failed');
      return res.json();
    },
    onSuccess: () => {
      toast('회원이 탈퇴 처리되었습니다', 'success');
      invalidate();
    },
    onError: () => toast('탈퇴 처리에 실패했습니다', 'error'),
  });

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const s = search.toLowerCase();
      const matchSearch =
        !s ||
        u.name?.toLowerCase().includes(s) ||
        u.email?.toLowerCase().includes(s) ||
        u.username?.toLowerCase().includes(s);
      const matchType = userType === 'all' || (u.userType || 'personal') === userType;
      return matchSearch && matchType;
    });
  }, [users, search, userType]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const columns = useMemo<AdminTableColumn<UserRow>[]>(
    () => [
      {
        key: 'name',
        header: '이름/이메일',
        render: (u) => (
          <div className="min-w-0 max-w-[260px]">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
              {u.name || '—'}{' '}
              {u.username && <span className="text-slate-400 text-xs">@{u.username}</span>}
            </p>
            <p className="text-xs text-slate-400 truncate">{u.email}</p>
          </div>
        ),
      },
      {
        key: 'provider',
        header: '로그인',
        render: (u) => (
          <span className="text-xs text-slate-500 dark:text-slate-400">{u.provider || '-'}</span>
        ),
      },
      {
        key: 'userType',
        header: '유형',
        render: (u) => (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {u.userType || 'personal'}
          </span>
        ),
      },
      {
        key: 'role',
        header: '역할',
        render: (u) =>
          isSuperAdmin ? (
            <select
              value={u.role || 'user'}
              onChange={(e) => mRole.mutate({ id: u.id, role: e.target.value })}
              className="text-xs px-2 py-1 border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
              <option value="superadmin">superadmin</option>
            </select>
          ) : (
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                u.role === 'admin' || u.role === 'superadmin'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
              }`}
            >
              {u.role || 'user'}
            </span>
          ),
      },
      {
        key: 'status',
        header: '상태',
        render: (u) => (
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              u.isSuspended
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            }`}
          >
            {u.isSuspended ? '정지' : '정상'}
          </span>
        ),
      },
      {
        key: 'createdAt',
        header: '가입일',
        render: (u) => (
          <span className="text-xs text-slate-400">
            {new Date(u.createdAt).toLocaleDateString('ko-KR')}
          </span>
        ),
      },
      {
        key: 'actions',
        header: '액션',
        render: (u) => (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() =>
                u.isSuspended
                  ? mSuspend.mutate({ id: u.id, suspend: false })
                  : setConfirm({ kind: 'suspend', id: u.id, email: u.email })
              }
              className={`text-xs px-2 py-1 rounded-lg ${
                u.isSuspended
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400'
              }`}
            >
              {u.isSuspended ? '정지 해제' : '정지'}
            </button>
            <button
              type="button"
              onClick={() => setConfirm({ kind: 'delete', id: u.id, email: u.email })}
              className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
            >
              탈퇴
            </button>
          </div>
        ),
      },
    ],
    [isSuperAdmin, mRole, mSuspend],
  );

  return (
    <div className="animate-fade-in-up">
      <AdminTable<UserRow>
        items={paginated}
        loading={query.isLoading}
        emptyLabel="회원이 없습니다"
        columns={columns}
        getKey={(u) => u.id}
        page={page}
        totalPages={totalPages}
        total={filtered.length}
        onPageChange={setPage}
        toolbar={
          <>
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="이름/이메일/username 검색"
              className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100"
            />
            <select
              value={userType}
              onChange={(e) => {
                setUserType(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="all">모든 유형</option>
              <option value="personal">개인</option>
              <option value="recruiter">리크루터</option>
              <option value="company">기업</option>
              <option value="coach">코치</option>
            </select>
          </>
        }
      />

      <AlertDialog
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
        title={
          confirm?.kind === 'delete'
            ? `${confirm.email} 회원을 탈퇴 처리하시겠습니까?`
            : confirm?.kind === 'suspend'
              ? `${confirm.email} 계정을 정지하시겠습니까?`
              : ''
        }
        description={
          confirm?.kind === 'delete'
            ? '회원의 모든 데이터가 cascade로 삭제되며 복구할 수 없습니다.'
            : '정지된 계정은 로그인 및 API 호출이 차단됩니다.'
        }
        confirmText={confirm?.kind === 'delete' ? '탈퇴 처리' : '정지'}
        danger={confirm?.kind === 'delete'}
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.kind === 'delete') mDelete.mutate(confirm.id);
          if (confirm.kind === 'suspend') mSuspend.mutate({ id: confirm.id, suspend: true });
          setConfirm(null);
        }}
      />
    </div>
  );
}
