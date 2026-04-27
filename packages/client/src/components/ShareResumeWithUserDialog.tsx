import { useEffect, useState } from 'react';
import Dialog from '@/shared/ui/Dialog';
import { toast } from '@/components/Toast';
import {
  fetchResumes,
  setResumeVisibility,
  addAllowedViewer,
  searchUsers,
  type UserSearchResult,
} from '@/lib/api';
import type { ResumeSummary } from '@/types/resume';
import { tx } from '@/lib/i18n';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** 공유 대상 사용자 — 보통 코치/리쿠르터 user.id. 비워두면 dialog 안에서 검색 */
  targetUserId?: string;
  targetUserName?: string;
  /** 공유 컨텍스트 (코치/리쿠르터 등) — 라벨/메시지 prefill 용 */
  context?: 'coach' | 'recruiter' | 'general';
  /** 공유 완료 콜백 (parent 가 토스트 후 후속 동작 처리하고 싶을 때) */
  onShared?: () => void;
}

const TITLE_KEY: Record<NonNullable<Props['context']>, string> = {
  coach: 'sharing.shareToCoach',
  recruiter: 'sharing.shareToRecruiter',
  general: 'sharing.shareGeneral',
};

const DEFAULT_MESSAGE_KEY: Record<NonNullable<Props['context']>, string> = {
  coach: 'sharing.defaultMessageCoach',
  recruiter: 'sharing.defaultMessageRecruiter',
  general: 'sharing.defaultMessageGeneral',
};

/**
 * 내 이력서 → 특정 사용자에게 1-click 선택 공개.
 *
 * 동작:
 * 1. 내 이력서 목록 fetch + 미리보기 카드로 선택
 * 2. 선택한 이력서: visibility='selective' 자동 전환 (이미 selective 면 skip)
 * 3. addAllowedViewer(targetUserId) 호출
 * 4. 알림 자동 발송 (서버 측)
 *
 * 코치 상세, 리쿠르터 답장, 스카우트 응답 등 어디서나 재사용 가능.
 */
export default function ShareResumeWithUserDialog({
  open,
  onOpenChange,
  targetUserId,
  targetUserName,
  context = 'general',
  onShared,
}: Props) {
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('');
  const [message, setMessage] = useState(tx(DEFAULT_MESSAGE_KEY[context]));
  const [submitting, setSubmitting] = useState(false);

  // user 검색 모드 — targetUserId 없을 때
  const [pickedUser, setPickedUser] = useState<UserSearchResult | null>(null);
  const [userQuery, setUserQuery] = useState('');
  const [userSuggestions, setUserSuggestions] = useState<UserSearchResult[]>([]);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);

  useEffect(() => {
    if (targetUserId) return; // 외부에서 target 받았으면 검색 안 함
    const q = userQuery.trim();
    if (pickedUser) return;
    if (q.length < 2) {
      setUserSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      searchUsers(q)
        .then((rows) => {
          setUserSuggestions(rows.slice(0, 6));
          setShowUserSuggestions(true);
        })
        .catch(() => setUserSuggestions([]));
    }, 220);
    return () => clearTimeout(t);
  }, [userQuery, pickedUser, targetUserId]);

  const effectiveTargetId = targetUserId || pickedUser?.id || '';
  const effectiveTargetName = targetUserName || pickedUser?.name || '';

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchResumes()
      .then((list) => {
        setResumes(list);
        if (list.length > 0 && !selectedId) setSelectedId(list[0].id);
      })
      .catch((err) =>
        toast(err instanceof Error ? err.message : tx('sharing.loadResumeError'), 'error'),
      )
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleShare = async () => {
    if (!selectedId || !effectiveTargetId) return;
    const resume = resumes.find((r) => r.id === selectedId);
    if (!resume) return;
    setSubmitting(true);
    try {
      // 이미 selective 가 아니면 전환 (public/link-only 도 selective 로 좁히는 게 안전)
      if (resume.visibility !== 'selective') {
        await setResumeVisibility(selectedId, 'selective');
      }
      await addAllowedViewer(selectedId, {
        userId: effectiveTargetId,
        message: message.trim() || undefined,
      });
      toast(tx('sharing.sharedSuccess', { name: effectiveTargetName }), 'success');
      onShared?.();
      onOpenChange(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : tx('sharing.shareError'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={tx(TITLE_KEY[context])}
      description={tx('sharing.shareDesc')}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* 사용자 검색 — targetUserId 가 외부에서 안 들어왔을 때만 */}
        {!targetUserId && (
          <div className="relative">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              공유할 사용자 검색
            </label>
            {pickedUser ? (
              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20">
                {pickedUser.avatar ? (
                  <img src={pickedUser.avatar} alt="" className="w-7 h-7 rounded-full" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-sky-700 text-white flex items-center justify-center text-xs font-bold">
                    {(pickedUser.name || '?')[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {pickedUser.name}
                    {pickedUser.username && (
                      <span className="ml-1 text-xs text-slate-500">@{pickedUser.username}</span>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{pickedUser.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPickedUser(null);
                    setUserQuery('');
                  }}
                  className="shrink-0 text-xs text-slate-500 hover:text-rose-600"
                >
                  변경
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  onFocus={() => userSuggestions.length > 0 && setShowUserSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowUserSuggestions(false), 150)}
                  placeholder="이름 / @username / email (최소 2자)"
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {showUserSuggestions && userSuggestions.length > 0 && (
                  <ul className="scroll-inner absolute z-20 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg divide-y divide-slate-100 dark:divide-slate-700/60">
                    {userSuggestions.map((u) => (
                      <li
                        key={u.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setPickedUser(u);
                          setShowUserSuggestions(false);
                        }}
                        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/40"
                      >
                        {u.avatar ? (
                          <img src={u.avatar} alt="" className="w-6 h-6 rounded-full" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-sky-700 text-white flex items-center justify-center text-[10px] font-bold">
                            {(u.name || '?')[0]}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            {u.name}
                            {u.username && (
                              <span className="ml-1 text-xs text-slate-500">@{u.username}</span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        )}

        {/* 이력서 선택 */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {tx('sharing.pickResume')}
          </label>
          {loading ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-3 text-center">
              불러오는 중...
            </p>
          ) : resumes.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                먼저 이력서를 한 개 이상 작성해주세요
              </p>
            </div>
          ) : (
            <div className="scroll-inner max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-700/60">
              {resumes.map((r) => (
                <label
                  key={r.id}
                  className={`flex items-start gap-2 p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors ${selectedId === r.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                >
                  <input
                    type="radio"
                    name="resume"
                    value={r.id}
                    checked={selectedId === r.id}
                    onChange={() => setSelectedId(r.id)}
                    className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {r.title || '제목 없음'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {r.visibility === 'public'
                        ? '현재: 공개'
                        : r.visibility === 'link-only'
                          ? '현재: 링크만'
                          : r.visibility === 'selective'
                            ? '현재: 선택 공개'
                            : '현재: 비공개'}
                      {r.visibility !== 'selective' && (
                        <span className="ml-1 text-blue-600 dark:text-blue-400">
                          → 선택 공개로 전환
                        </span>
                      )}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 메시지 */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            메시지 <span className="text-slate-400 dark:text-slate-500 font-normal">(선택)</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="공유 의도를 간단히 적어주세요"
            rows={2}
            maxLength={200}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500 text-right">
            {message.length}/200
          </p>
        </div>

        {/* 안내 */}
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 p-2.5">
          <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
            <span className="font-semibold">ⓘ</span> 공유 즉시 {effectiveTargetName || '대상자'}님이
            알림을 받고 이력서를 볼 수 있습니다. 언제든 EditResume → 공개 설정에서 권한을 회수할 수
            있어요.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-3 py-1.5 text-sm rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {tx('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={!selectedId || !effectiveTargetId || submitting || resumes.length === 0}
            className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? tx('sharing.sharing') : tx('sharing.shareBtn')}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
