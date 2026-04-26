import { useEffect, useState, useCallback } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { toast } from '@/components/Toast';
import { getUser } from '@/lib/auth';
import {
  fetchStudyGroups,
  createStudyGroup,
  joinStudyGroup,
  leaveStudyGroup,
  type StudyGroup,
} from '@/lib/api';

interface JobStudyGroupsPanelProps {
  jobPostId?: string;
  companyName: string;
  position: string;
}

function memberTag(group: StudyGroup, myId: string | null): 'owner' | 'member' | null {
  if (!myId) return null;
  if (group.ownerId === myId) return 'owner';
  if (group.members?.some((m) => m.userId === myId)) return 'member';
  return null;
}

/**
 * JobStudyGroupsPanel
 * Lists StudyGroups linked to a JobPost (or keyed by company+position),
 * supports quick join/leave and creation via a Radix dialog.
 */
export default function JobStudyGroupsPanel({
  jobPostId,
  companyName,
  position,
}: JobStudyGroupsPanelProps) {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: `${companyName} ${position} 스터디`,
    description: '',
    isPrivate: false,
    maxMembers: 8,
  });
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const user = getUser();
  const myId = user?.id ?? null;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Parameters<typeof fetchStudyGroups>[0] = { limit: 20 };
      if (jobPostId) params.jobPostId = jobPostId;
      else params.companyName = companyName;
      const res = await fetchStudyGroups(params);
      setGroups(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : '스터디 그룹을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, [jobPostId, companyName]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset form defaults when company/position changes
  useEffect(() => {
    setForm((prev) => ({ ...prev, name: `${companyName} ${position} 스터디` }));
  }, [companyName, position]);

  const handleCreate = async () => {
    if (!user) {
      toast('로그인 후 이용 가능합니다.', 'error');
      return;
    }
    const name = form.name.trim();
    if (!name) {
      toast('그룹 이름을 입력해주세요.', 'error');
      return;
    }
    setSaving(true);
    try {
      await createStudyGroup({
        name,
        description: form.description.trim() || undefined,
        jobPostId: jobPostId ?? null,
        companyName,
        position,
        isPrivate: form.isPrivate,
        maxMembers: form.maxMembers,
      });
      toast('스터디 그룹이 생성되었습니다.', 'success');
      setShowCreate(false);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : '생성에 실패했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleJoin = async (group: StudyGroup) => {
    if (!user) {
      toast('로그인 후 이용 가능합니다.', 'error');
      return;
    }
    setJoiningId(group.id);
    try {
      await joinStudyGroup(group.id);
      toast('그룹에 참여했습니다.', 'success');
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : '참여에 실패했습니다.', 'error');
    } finally {
      setJoiningId(null);
    }
  };

  const handleLeave = async (group: StudyGroup) => {
    if (!user) return;
    if (!confirm('스터디 그룹에서 나가시겠습니까?')) return;
    setJoiningId(group.id);
    try {
      await leaveStudyGroup(group.id);
      toast('그룹에서 나왔습니다.', 'success');
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : '나가기에 실패했습니다.', 'error');
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          함께 면접을 준비할 스터디 그룹을 찾거나 새로 만들어보세요.
        </p>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="imp-btn px-3 py-2 text-xs font-medium bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white"
        >
          그룹 만들기
        </button>
      </div>

      {loading ? (
        <div className="space-y-2" aria-hidden>
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="imp-card p-6 text-center">
          <p className="text-sm text-blue-700 dark:text-blue-400">{error}</p>
          <button
            type="button"
            onClick={load}
            className="mt-3 imp-btn px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          >
            다시 시도
          </button>
        </div>
      ) : groups.length === 0 ? (
        <div className="imp-card p-6 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            아직 스터디 그룹이 없습니다. 첫 번째 그룹을 만들어보세요.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {groups.map((g) => {
            const role = memberTag(g, myId);
            const full = g.memberCount >= g.maxMembers;
            return (
              <li key={g.id} className="imp-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {g.name}
                      </h4>
                      {g.isPrivate && (
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                          비공개
                        </span>
                      )}
                      {role === 'owner' && (
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
                          오너
                        </span>
                      )}
                    </div>
                    {g.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                        {g.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="tabular-nums">
                        멤버 {g.memberCount}/{g.maxMembers}
                      </span>
                      {g.owner && <span>· {g.owner.name}</span>}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {role ? (
                      <button
                        type="button"
                        onClick={() => handleLeave(g)}
                        disabled={joiningId === g.id}
                        className="imp-btn px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                      >
                        {joiningId === g.id
                          ? '처리 중…'
                          : role === 'owner'
                            ? '그룹 관리'
                            : '나가기'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleJoin(g)}
                        disabled={joiningId === g.id || full}
                        className="imp-btn px-3 py-1.5 text-xs bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white disabled:opacity-50"
                      >
                        {full ? '정원 마감' : joiningId === g.id ? '참여 중…' : '참여'}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <RadixDialog.Root open={showCreate} onOpenChange={setShowCreate}>
        <RadixDialog.Portal>
          <RadixDialog.Overlay className="fixed inset-0 z-[90] bg-black/40 animate-fade-in" />
          <RadixDialog.Content className="fixed z-[91] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 animate-fade-in-up focus:outline-none">
            <RadixDialog.Title className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
              스터디 그룹 만들기
            </RadixDialog.Title>
            <RadixDialog.Description className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {companyName} · {position}
            </RadixDialog.Description>
            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                그룹 이름
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600"
                  placeholder="예: 삼성 SW 면접 스터디"
                />
              </label>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                소개 (선택)
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600"
                  placeholder="모임 목표, 진행 방식, 레벨 등"
                />
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={form.isPrivate}
                    onChange={(e) => setForm((f) => ({ ...f, isPrivate: e.target.checked }))}
                  />
                  비공개 그룹
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 ml-auto">
                  정원
                  <input
                    type="number"
                    min={2}
                    max={30}
                    value={form.maxMembers}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        maxMembers: Math.max(2, Math.min(30, Number(e.target.value) || 2)),
                      }))
                    }
                    className="w-16 px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 tabular-nums"
                  />
                </label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="imp-btn px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={saving}
                className="imp-btn px-4 py-2 text-sm font-medium bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white disabled:opacity-50"
              >
                {saving ? '생성 중…' : '생성'}
              </button>
            </div>
            <RadixDialog.Close asChild>
              <button
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="닫기"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </RadixDialog.Close>
          </RadixDialog.Content>
        </RadixDialog.Portal>
      </RadixDialog.Root>
    </div>
  );
}
