import { useCallback, useEffect, useState } from 'react';
import { toast } from '@/components/Toast';
import { getUser } from '@/lib/auth';
import { fetchStudyGroups, joinStudyGroup, type StudyGroup } from '@/lib/api';

interface RelatedGroupsWidgetProps {
  jobPostId?: string;
  companyName: string;
  position: string;
}

/**
 * RelatedGroupsWidget
 * Sidebar widget showing the top 3 study groups that match the current
 * company/position context. Lets users quickly join a matching group
 * without leaving the surrounding interview-prep flow.
 */
export default function RelatedGroupsWidget({
  jobPostId,
  companyName,
  position,
}: RelatedGroupsWidgetProps) {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const user = getUser();
  const myId = user?.id ?? null;

  const trimmedCompany = companyName.trim();
  const trimmedPosition = position.trim();
  const hasContext = trimmedCompany.length > 0 || !!jobPostId;

  const load = useCallback(async () => {
    if (!hasContext) {
      setGroups([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params: Parameters<typeof fetchStudyGroups>[0] = { limit: 10 };
      if (jobPostId) params.jobPostId = jobPostId;
      else params.companyName = trimmedCompany;
      const res = await fetchStudyGroups(params);

      const positionLower = trimmedPosition.toLowerCase();
      const items = [...res.items].sort((a, b) => {
        if (positionLower) {
          const aMatch = a.position?.toLowerCase().includes(positionLower) ? 1 : 0;
          const bMatch = b.position?.toLowerCase().includes(positionLower) ? 1 : 0;
          if (aMatch !== bMatch) return bMatch - aMatch;
        }
        return b.memberCount - a.memberCount;
      });
      setGroups(items.slice(0, 3));
    } catch (e) {
      setError(e instanceof Error ? e.message : '스터디 그룹을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, [hasContext, jobPostId, trimmedCompany, trimmedPosition]);

  useEffect(() => {
    load();
  }, [load]);

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

  if (!hasContext) return null;

  return (
    <div className="imp-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span className="w-5 h-5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-md flex items-center justify-center text-[11px]">
            👥
          </span>
          관련 스터디 그룹
        </h3>
        {trimmedCompany && (
          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[40%]">
            {trimmedCompany}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2" aria-hidden>
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <p className="text-xs text-blue-700 dark:text-blue-400">{error}</p>
      ) : groups.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          해당 회사·포지션의 스터디 그룹이 아직 없어요.
        </p>
      ) : (
        <ul className="space-y-2">
          {groups.map((group) => {
            const role =
              myId && group.ownerId === myId
                ? 'owner'
                : myId && group.members?.some((m) => m.userId === myId)
                  ? 'member'
                  : null;
            const full = group.memberCount >= group.maxMembers;
            return (
              <li
                key={group.id}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {group.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                    멤버 {group.memberCount}/{group.maxMembers}
                    {group.position ? ` · ${group.position}` : ''}
                  </p>
                </div>
                {role ? (
                  <span className="shrink-0 px-2 py-1 text-[11px] rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                    {role === 'owner' ? '오너' : '참여 중'}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleJoin(group)}
                    disabled={joiningId === group.id || full}
                    className="shrink-0 imp-btn px-2.5 py-1.5 text-[11px] font-medium bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white disabled:opacity-50"
                  >
                    {full ? '정원 마감' : joiningId === group.id ? '참여 중…' : '참여하기'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
