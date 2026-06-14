/**
 * 스터디 그룹 관리 탭
 */
import * as RadixDialog from '@radix-ui/react-dialog'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useMemo } from 'react'

import { AdminTable, type AdminTableColumn } from './AdminTable'

import { toast } from '@/components/Toast'
import { API_URL } from '@/lib/config'
import { httpClient } from '@/lib/ky'
import AlertDialog from '@/shared/ui/AlertDialog'

type Group = {
  id: string
  name: string
  description: string
  companyTier: string
  cafeCategory: string
  experienceLevel: string
  companyName: string | null
  position: string | null
  isPrivate: boolean
  maxMembers: number
  memberCount: number
  createdAt: string
  owner?: { id?: string; name?: string; email?: string; username?: string }
  _count?: { members?: number; questions?: number }
}

type GroupPatch = Pick<
  Group,
  | 'name'
  | 'description'
  | 'companyTier'
  | 'cafeCategory'
  | 'experienceLevel'
  | 'isPrivate'
  | 'maxMembers'
>

type ModAttachment = { url: string; name: string; size: number; type: string }

type ModPost = {
  id: string
  groupId: string
  title: string
  content: string
  category: string
  attachments: ModAttachment[]
  isPinned: boolean
  viewCount: number
  likeCount: number
  commentCount: number
  createdAt: string
  group?: { id?: string; name?: string }
  user?: { id?: string; name?: string; email?: string }
}

type ModComment = {
  id: string
  parentId: string | null
  content: string
  createdAt: string
  user?: { id?: string; name?: string; email?: string }
}

type ModAnswer = {
  id: string
  parentId: string | null
  body: string
  upvotes: number
  createdAt: string
  user?: { id?: string; name?: string; email?: string }
  question?: { id?: string; question?: string; group?: { id?: string; name?: string } }
}

const TIERS = ['all', 'public', 'large', 'mid', 'startup', 'foreign', 'sme', 'freelance', 'etc']
const CAFES = ['all', 'interview', 'resume', 'coding-test', 'study', 'networking']
const LEVELS = ['all', 'new', 'junior', 'mid', 'senior', 'any']

function authHeader(): Record<string, string> {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const MOD_VIEWS = [
  { key: 'groups', label: '그룹' },
  { key: 'posts', label: '게시글' },
  { key: 'answers', label: '문제 답변' },
] as const
type ModView = (typeof MOD_VIEWS)[number]['key']

export default function AdminStudyGroupsTab() {
  const [view, setView] = useState<ModView>('groups')

  return (
    <div className="animate-fade-in-up space-y-4">
      <div
        className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 p-1 bg-slate-50 dark:bg-slate-900"
        role="tablist"
        aria-label="스터디 모더레이션 영역"
      >
        {MOD_VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            role="tab"
            aria-selected={view === v.key}
            onClick={() => setView(v.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              view === v.key
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === 'groups' && <GroupsSection />}
      {view === 'posts' && <PostsModerationSection />}
      {view === 'answers' && <AnswersModerationSection />}
    </div>
  )
}

function GroupsSection() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [tier, setTier] = useState('all')
  const [cafe, setCafe] = useState('all')
  const [level, setLevel] = useState('all')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Group | null>(null)
  const [confirm, setConfirm] = useState<
    | { kind: 'delete'; id: string; name: string }
    | { kind: 'force-close'; id: string; name: string }
    | null
  >(null)

  const query = useQuery<{
    items: Group[]
    total: number
    totalPages: number
  } | null>({
    queryKey: ['admin-study-groups', { q, tier, cafe, level, page }],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (q) params.set('q', q)
      if (tier !== 'all') params.set('tier', tier)
      if (cafe !== 'all') params.set('cafe', cafe)
      if (level !== 'all') params.set('experienceLevel', level)
      const res = await httpClient(`${API_URL}/api/study-groups/admin/all?${params}`, {
        headers: authHeader(),
      })
      if (!res.ok) return null
      return res.json()
    },
    staleTime: 10_000,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-study-groups'] })

  const mForce = useMutation({
    mutationFn: async (id: string) => {
      const res = await httpClient(`${API_URL}/api/study-groups/admin/${id}/force-close`, {
        method: 'PATCH',
        headers: authHeader(),
      })
      if (!res.ok) throw new Error('failed')
      return res.json()
    },
    onSuccess: () => {
      toast('그룹이 강제 종료되었습니다', 'success')
      invalidate()
    },
    onError: () => toast('처리에 실패했습니다', 'error'),
  })

  const mUpdate = useMutation({
    mutationFn: async (vars: { id: string; patch: GroupPatch }) => {
      const res = await httpClient(`${API_URL}/api/study-groups/admin/${vars.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(vars.patch),
      })
      if (!res.ok) throw new Error('failed')
      return res.json()
    },
    onSuccess: () => {
      toast('그룹이 수정되었습니다', 'success')
      setEditing(null)
      invalidate()
    },
    onError: () => toast('수정에 실패했습니다', 'error'),
  })

  const mDelete = useMutation({
    mutationFn: async (id: string) => {
      const res = await httpClient(`${API_URL}/api/study-groups/admin/${id}`, {
        method: 'DELETE',
        headers: authHeader(),
      })
      if (!res.ok) throw new Error('failed')
      return res.json()
    },
    onSuccess: () => {
      toast('그룹이 삭제되었습니다', 'success')
      invalidate()
    },
    onError: () => toast('삭제에 실패했습니다', 'error'),
  })

  const items = query.data?.items ?? []

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
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
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
    []
  )

  return (
    <div>
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
                setQ(e.target.value)
                setPage(1)
              }}
              placeholder="이름/설명/회사/직무 검색"
              className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100"
            />
            <select
              value={tier}
              onChange={(e) => {
                setTier(e.target.value)
                setPage(1)
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
                setCafe(e.target.value)
                setPage(1)
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
                setLevel(e.target.value)
                setPage(1)
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
          if (!confirm) return
          if (confirm.kind === 'delete') mDelete.mutate(confirm.id)
          if (confirm.kind === 'force-close') mForce.mutate(confirm.id)
          setConfirm(null)
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
  )
}

function EditGroupDialog({
  group,
  onClose,
  onSave,
}: {
  group: Group
  onClose: () => void
  onSave: (patch: GroupPatch) => void
}) {
  const [name, setName] = useState(group.name)
  const [description, setDescription] = useState(group.description)
  const [tier, setTier] = useState(group.companyTier)
  const [cafe, setCafe] = useState(group.cafeCategory)
  const [level, setLevel] = useState(group.experienceLevel)
  const [isPrivate, setPrivate] = useState(group.isPrivate)
  const [maxMembers, setMax] = useState(group.maxMembers)

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
  )
}

// ─────────────────────────────────────────────────────────────
// 게시글 모더레이션 — 전체 그룹 게시글 검색·삭제·첨부 제거·댓글 관리
// (study-groups/admin/posts* 엔드포인트와 연결)
// ─────────────────────────────────────────────────────────────

const formatBytes = (n: number) =>
  n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(n / 1024))}KB`

function PostsModerationSection() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [commentsFor, setCommentsFor] = useState<ModPost | null>(null)
  const [confirm, setConfirm] = useState<
    | { kind: 'delete-post'; post: ModPost }
    | { kind: 'remove-attachment'; post: ModPost; att: ModAttachment }
    | null
  >(null)

  const query = useQuery<{ items: ModPost[]; total: number; totalPages: number } | null>({
    queryKey: ['admin-study-posts', { q, page }],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (q) params.set('q', q)
      const res = await httpClient(`${API_URL}/api/study-groups/admin/posts?${params}`, {
        headers: authHeader(),
      })
      if (!res.ok) return null
      return res.json()
    },
    staleTime: 10_000,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-study-posts'] })

  const mDeletePost = useMutation({
    mutationFn: async (postId: string) => {
      const res = await httpClient(`${API_URL}/api/study-groups/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: authHeader(),
      })
      if (!res.ok) throw new Error('failed')
      return res.json()
    },
    onSuccess: () => {
      toast('게시글이 삭제되었습니다', 'success')
      invalidate()
    },
    onError: () => toast('삭제에 실패했습니다', 'error'),
  })

  const mRemoveAttachment = useMutation({
    mutationFn: async (vars: { postId: string; url: string }) => {
      const res = await httpClient(
        `${API_URL}/api/study-groups/admin/posts/${vars.postId}/attachments`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeader() },
          body: JSON.stringify({ url: vars.url }),
        }
      )
      if (!res.ok) throw new Error('failed')
      return res.json()
    },
    onSuccess: () => {
      toast('첨부가 제거되었습니다', 'success')
      invalidate()
    },
    onError: () => toast('첨부 제거에 실패했습니다', 'error'),
  })

  const items = query.data?.items ?? []

  const columns: AdminTableColumn<ModPost>[] = [
    {
      key: 'post',
      header: '게시글',
      render: (p) => (
        <div className="min-w-0 max-w-[280px]">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
            {p.isPinned && <span className="mr-1">📌</span>}
            {p.title}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{p.content}</p>
          <p className="text-[11px] text-slate-400 truncate">
            {p.group?.name || '—'} · {p.user?.name || '—'}
            {p.user?.email ? ` (${p.user.email})` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'meta',
      header: '분류/통계',
      render: (p) => (
        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5 whitespace-nowrap">
          <div>{p.category}</div>
          <div className="text-slate-400">
            👁 {p.viewCount} · ♥ {p.likeCount} · 💬 {p.commentCount}
          </div>
          <div className="text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</div>
        </div>
      ),
    },
    {
      key: 'attachments',
      header: '첨부',
      render: (p) =>
        p.attachments?.length ? (
          <ul className="space-y-1 max-w-[220px]">
            {p.attachments.map((att) => (
              <li
                key={att.url}
                className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300"
              >
                <span aria-hidden>{att.type?.startsWith('image/') ? '🖼' : '📄'}</span>
                <span className="truncate max-w-[120px]" title={att.name}>
                  {att.name || att.url}
                </span>
                <span className="text-slate-400">{formatBytes(att.size)}</span>
                <button
                  type="button"
                  onClick={() => setConfirm({ kind: 'remove-attachment', post: p, att })}
                  aria-label={`첨부 ${att.name} 제거`}
                  className="px-1 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
    {
      key: 'actions',
      header: '액션',
      render: (p) => (
        <div className="flex items-center gap-1 whitespace-nowrap">
          <button
            type="button"
            onClick={() => setCommentsFor(p)}
            className="text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
          >
            댓글
          </button>
          <button
            type="button"
            onClick={() => setConfirm({ kind: 'delete-post', post: p })}
            className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
          >
            삭제
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <AdminTable<ModPost>
        items={items}
        loading={query.isLoading}
        emptyLabel="게시글이 없습니다"
        columns={columns}
        getKey={(p) => p.id}
        page={page}
        totalPages={query.data?.totalPages}
        total={query.data?.total}
        onPageChange={setPage}
        toolbar={
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
            placeholder="제목/내용 검색"
            className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100"
          />
        }
      />

      <AlertDialog
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
        title={
          confirm?.kind === 'delete-post'
            ? `"${confirm.post.title}" 게시글을 삭제하시겠습니까?`
            : confirm?.kind === 'remove-attachment'
              ? `첨부 "${confirm.att.name || confirm.att.url}" 을(를) 제거하시겠습니까?`
              : ''
        }
        description={
          confirm?.kind === 'delete-post'
            ? '댓글·리액션·좋아요가 함께 삭제되며 복구할 수 없습니다.'
            : '게시글 본문은 유지되고 해당 첨부만 제거됩니다.'
        }
        confirmText={confirm?.kind === 'delete-post' ? '삭제' : '제거'}
        danger
        onConfirm={() => {
          if (!confirm) return
          if (confirm.kind === 'delete-post') mDeletePost.mutate(confirm.post.id)
          if (confirm.kind === 'remove-attachment')
            mRemoveAttachment.mutate({ postId: confirm.post.id, url: confirm.att.url })
          setConfirm(null)
        }}
      />

      {commentsFor && (
        <PostCommentsDialog
          post={commentsFor}
          onClose={() => setCommentsFor(null)}
          onChanged={invalidate}
        />
      )}
    </div>
  )
}

/** 게시글 댓글 모더레이션 다이얼로그 — tombstone(content='') 표시 + 삭제 */
function PostCommentsDialog({
  post,
  onClose,
  onChanged,
}: {
  post: ModPost
  onClose: () => void
  onChanged: () => void
}) {
  const qc = useQueryClient()
  const commentsKey = ['admin-study-post-comments', post.id]

  const query = useQuery<ModComment[] | null>({
    queryKey: commentsKey,
    queryFn: async () => {
      const res = await httpClient(`${API_URL}/api/study-groups/admin/posts/${post.id}/comments`, {
        headers: authHeader(),
      })
      if (!res.ok) return null
      return res.json()
    },
  })

  const mDelete = useMutation({
    mutationFn: async (commentId: string) => {
      const res = await httpClient(`${API_URL}/api/study-groups/admin/comments/${commentId}`, {
        method: 'DELETE',
        headers: authHeader(),
      })
      if (!res.ok) throw new Error('failed')
      return res.json()
    },
    onSuccess: () => {
      toast('댓글이 삭제되었습니다', 'success')
      qc.invalidateQueries({ queryKey: commentsKey })
      onChanged()
    },
    onError: () => toast('삭제에 실패했습니다', 'error'),
  })

  const comments = query.data ?? []

  return (
    <RadixDialog.Root open onOpenChange={(v) => !v && onClose()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[90] bg-neutral-950/50" />
        <RadixDialog.Content className="fixed z-[91] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xl">
          <RadixDialog.Title className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">
            댓글 관리
          </RadixDialog.Title>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 truncate">{post.title}</p>
          {query.isLoading ? (
            <p className="text-sm text-slate-500 py-4 text-center">불러오는 중…</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">댓글이 없습니다</p>
          ) : (
            <ul className="space-y-2">
              {comments.map((c) => (
                <li
                  key={c.id}
                  className={`flex items-start gap-2 p-2 rounded-lg border border-slate-100 dark:border-slate-700 ${
                    c.parentId ? 'ml-5 bg-slate-50 dark:bg-slate-800/60' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {c.user?.name || '—'}
                      {c.user?.email ? ` (${c.user.email})` : ''} ·{' '}
                      {new Date(c.createdAt).toLocaleString()}
                    </p>
                    {c.content === '' ? (
                      <p className="text-xs italic text-slate-400">(삭제된 댓글 — 답글 보존용)</p>
                    ) : (
                      <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                        {c.content}
                      </p>
                    )}
                  </div>
                  {c.content !== '' && (
                    <button
                      type="button"
                      onClick={() => mDelete.mutate(c.id)}
                      disabled={mDelete.isPending}
                      className="text-[11px] px-2 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 disabled:opacity-50 shrink-0"
                    >
                      삭제
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              닫기
            </button>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}

// ─────────────────────────────────────────────────────────────
// 문제 답변 모더레이션 — 전체 그룹 답변 검색·삭제
// (study-groups/admin/answers* 엔드포인트와 연결)
// ─────────────────────────────────────────────────────────────

function AnswersModerationSection() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [confirm, setConfirm] = useState<ModAnswer | null>(null)

  const query = useQuery<{ items: ModAnswer[]; total: number; totalPages: number } | null>({
    queryKey: ['admin-study-answers', { q, page }],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (q) params.set('q', q)
      const res = await httpClient(`${API_URL}/api/study-groups/admin/answers?${params}`, {
        headers: authHeader(),
      })
      if (!res.ok) return null
      return res.json()
    },
    staleTime: 10_000,
  })

  const mDelete = useMutation({
    mutationFn: async (answerId: string) => {
      const res = await httpClient(`${API_URL}/api/study-groups/admin/answers/${answerId}`, {
        method: 'DELETE',
        headers: authHeader(),
      })
      if (!res.ok) throw new Error('failed')
      return res.json()
    },
    onSuccess: () => {
      toast('답변이 삭제되었습니다', 'success')
      qc.invalidateQueries({ queryKey: ['admin-study-answers'] })
    },
    onError: () => toast('삭제에 실패했습니다', 'error'),
  })

  const items = query.data?.items ?? []

  const columns: AdminTableColumn<ModAnswer>[] = [
    {
      key: 'answer',
      header: '답변',
      render: (a) => (
        <div className="min-w-0 max-w-[280px]">
          {a.body === '' ? (
            <p className="text-xs italic text-slate-400">(삭제된 답변 — 답글 보존용)</p>
          ) : (
            <p className="text-sm text-slate-800 dark:text-slate-200 line-clamp-2 break-words">
              {a.parentId && <span className="mr-1 text-slate-400">↳</span>}
              {a.body}
            </p>
          )}
          <p className="text-[11px] text-slate-400 truncate">
            {a.user?.name || '—'}
            {a.user?.email ? ` (${a.user.email})` : ''} · 👍 {a.upvotes}
          </p>
        </div>
      ),
    },
    {
      key: 'question',
      header: '질문/그룹',
      render: (a) => (
        <div className="min-w-0 max-w-[220px] text-xs text-slate-600 dark:text-slate-400">
          <p className="truncate">{a.question?.question || '—'}</p>
          <p className="text-slate-400 truncate">{a.question?.group?.name || '—'}</p>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: '작성일',
      render: (a) => (
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {new Date(a.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '액션',
      render: (a) =>
        a.body === '' ? (
          <span className="text-xs text-slate-400">—</span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirm(a)}
            className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
          >
            삭제
          </button>
        ),
    },
  ]

  return (
    <div>
      <AdminTable<ModAnswer>
        items={items}
        loading={query.isLoading}
        emptyLabel="답변이 없습니다"
        columns={columns}
        getKey={(a) => a.id}
        page={page}
        totalPages={query.data?.totalPages}
        total={query.data?.total}
        onPageChange={setPage}
        toolbar={
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
            placeholder="답변 내용 검색"
            className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100"
          />
        }
      />

      <AlertDialog
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
        title="답변을 삭제하시겠습니까?"
        description="답글이 달린 답변은 자리표시자로 전환되어 답글 스레드가 보존됩니다. 답글이 없으면 완전히 삭제됩니다."
        confirmText="삭제"
        danger
        onConfirm={() => {
          if (confirm) mDelete.mutate(confirm.id)
          setConfirm(null)
        }}
      />
    </div>
  )
}
