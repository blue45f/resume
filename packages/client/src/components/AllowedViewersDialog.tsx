import { useEffect, useState } from 'react';
import Dialog from '@/shared/ui/Dialog';
import { toast } from '@/components/Toast';
import {
  listAllowedViewers,
  addAllowedViewer,
  removeAllowedViewer,
  searchUsers,
  type ResumeAllowedViewer,
  type UserSearchResult,
} from '@/lib/api';
import { tx } from '@/lib/i18n';

interface Props {
  resumeId: string;
  onClose: () => void;
}

/**
 * 선택 공개(visibility="selective") 이력서의 viewer 화이트리스트 관리 다이얼로그.
 *
 * - 검색: username 또는 email 로 사용자 추가 (서버가 둘 다 지원)
 * - 목록: 현재 허용 viewer + 마지막 열람 시점 + 만료 일자
 * - 제거: 우측 X 버튼으로 즉시 제거
 *
 * 추가 즉시 viewer 가 이력서를 볼 수 있고, 알림 자동 발송.
 */
export default function AllowedViewersDialog({ resumeId, onClose }: Props) {
  const [open, setOpen] = useState(true);
  const [viewers, setViewers] = useState<ResumeAllowedViewer[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<UserSearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pickedUserId, setPickedUserId] = useState<string | null>(null);
  const [highlightedIdx, setHighlightedIdx] = useState<number>(-1);
  const [message, setMessage] = useState('');
  // 만료일 (선택). 'never' = null, 'D7' = 7일 후, 'D30' = 30일 후, 'custom' = 사용자 입력
  const [expiresPreset, setExpiresPreset] = useState<'never' | 'D7' | 'D30' | 'D90' | 'custom'>(
    'never',
  );
  const [expiresCustom, setExpiresCustom] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await listAllowedViewers(resumeId);
      setViewers(data);
    } catch (err) {
      toast(err instanceof Error ? err.message : '목록을 불러오지 못했습니다', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId]);

  useEffect(() => {
    if (!open) onClose();
  }, [open, onClose]);

  // 자동완성 — query 변경 시 디바운스 후 검색 (≥2자, picked 후엔 skip)
  useEffect(() => {
    const q = query.trim();
    if (pickedUserId) return; // 선택 후엔 더 이상 fetch 안 함
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      searchUsers(q)
        .then((rows) => {
          setSuggestions(rows.slice(0, 8));
          setShowSuggestions(true);
          setHighlightedIdx(-1);
        })
        .catch(() => setSuggestions([]));
    }, 220);
    return () => clearTimeout(t);
  }, [query, pickedUserId]);

  /** preset / custom → ISO 문자열 (또는 null = 만료 없음) */
  const computeExpiresAt = (): string | null | undefined => {
    if (expiresPreset === 'never') return null;
    if (expiresPreset === 'custom') {
      if (!expiresCustom) return undefined; // 비워두면 변경 안 함
      return new Date(expiresCustom).toISOString();
    }
    const days = expiresPreset === 'D7' ? 7 : expiresPreset === 'D30' ? 30 : 90;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  };

  const handleAdd = async () => {
    const q = query.trim();
    if (!q && !pickedUserId) return;
    setAdding(true);
    try {
      const expiresAt = computeExpiresAt();
      const base = {
        message: message.trim() || undefined,
        ...(expiresAt !== undefined ? { expiresAt } : {}),
      };
      let payload;
      if (pickedUserId) {
        // autocomplete 에서 선택한 user 직접 사용
        payload = { userId: pickedUserId, ...base };
      } else {
        // @username 형식이면 username 으로, 그 외 이메일로 시도
        const isEmail = q.includes('@') && q.indexOf('@') > 0;
        payload = isEmail ? { email: q, ...base } : { username: q.replace(/^@/, ''), ...base };
      }
      await addAllowedViewer(resumeId, payload);
      toast(tx('sharing.addedSuccess'), 'success');
      setQuery('');
      setPickedUserId(null);
      setSuggestions([]);
      setShowSuggestions(false);
      setMessage('');
      setExpiresPreset('never');
      setExpiresCustom('');
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : '추가에 실패했습니다', 'error');
    } finally {
      setAdding(false);
    }
  };

  const pickSuggestion = (u: UserSearchResult) => {
    setPickedUserId(u.id);
    setQuery(u.username ? `@${u.username}` : u.name || u.email || '');
    setShowSuggestions(false);
  };

  const handleRemove = async (userId: string, name: string) => {
    if (!confirm(tx('sharing.removeConfirm', { name }))) return;
    try {
      await removeAllowedViewer(resumeId, userId);
      toast(tx('sharing.removed'), 'success');
      setViewers((prev) => prev.filter((v) => v.userId !== userId));
    } catch (err) {
      toast(err instanceof Error ? err.message : '제거에 실패했습니다', 'error');
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title={tx('sharing.allowedViewers')}
      description={tx('sharing.shareDesc')}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        {/* 추가 영역 */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-800/40">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {tx('sharing.addUser')}
          </label>
          <div className="flex gap-2 relative">
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPickedUserId(null);
                }}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onKeyDown={(e) => {
                  if (showSuggestions && suggestions.length > 0) {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setHighlightedIdx((i) => (i + 1) % suggestions.length);
                      return;
                    }
                    if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setHighlightedIdx((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
                      return;
                    }
                    if (e.key === 'Enter' && highlightedIdx >= 0) {
                      e.preventDefault();
                      pickSuggestion(suggestions[highlightedIdx]);
                      return;
                    }
                  }
                  if (e.key === 'Enter' && query.trim() && !adding) {
                    e.preventDefault();
                    handleAdd();
                  }
                  if (e.key === 'Escape') setShowSuggestions(false);
                }}
                placeholder="이름 / @username / email 검색"
                aria-autocomplete="list"
                aria-expanded={showSuggestions}
                className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul
                  role="listbox"
                  className="absolute z-20 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg divide-y divide-slate-100 dark:divide-slate-700/60"
                >
                  {suggestions.map((u, idx) => (
                    <li
                      key={u.id}
                      role="option"
                      aria-selected={pickedUserId === u.id || highlightedIdx === idx}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        pickSuggestion(u);
                      }}
                      onMouseEnter={() => setHighlightedIdx(idx)}
                      className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                        highlightedIdx === idx
                          ? 'bg-blue-50 dark:bg-blue-900/30'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
                      }`}
                    >
                      {u.avatar ? (
                        <img
                          src={u.avatar}
                          alt=""
                          className="w-6 h-6 rounded-full object-cover bg-slate-100 dark:bg-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-sky-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {(u.name || u.email || '?').slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {u.name || '(이름 없음)'}
                          {u.username && (
                            <span className="ml-1 text-xs font-normal text-slate-500 dark:text-slate-400">
                              @{u.username}
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {u.email || ''}
                        </p>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 shrink-0">
                        {u.userType}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={(!query.trim() && !pickedUserId) || adding}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {adding ? tx('sharing.adding') : tx('sharing.addBtn')}
            </button>
          </div>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={tx('sharing.messagePlaceholder')}
            maxLength={200}
            className="mt-2 w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {/* 만료일 — 시한부 공개 (지원 1주일 / 면접 30일 / 채용 진행 90일 등) */}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
              {tx('sharing.expires')}:
            </span>
            {(['never', 'D7', 'D30', 'D90', 'custom'] as const).map((p) => {
              const label = tx(
                p === 'never'
                  ? 'sharing.expiresNever'
                  : p === 'D7'
                    ? 'sharing.expires7d'
                    : p === 'D30'
                      ? 'sharing.expires30d'
                      : p === 'D90'
                        ? 'sharing.expires90d'
                        : 'sharing.expiresCustom',
              );
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setExpiresPreset(p)}
                  className={`px-2 py-0.5 text-[11px] rounded-full transition-colors ${
                    expiresPreset === p
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {label}
                </button>
              );
            })}
            {expiresPreset === 'custom' && (
              <input
                type="date"
                value={expiresCustom}
                onChange={(e) => setExpiresCustom(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className="px-2 py-0.5 text-[11px] border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
              />
            )}
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            {tx('sharing.addedNote')}
          </p>
        </div>

        {/* 목록 */}
        <div>
          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {tx('sharing.currentViewers')} ({viewers.length})
          </h4>
          {loading ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
              {tx('common.loading')}
            </p>
          ) : viewers.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {tx('sharing.noViewers')}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                {tx('sharing.noViewersHint')}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700/60 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800/50">
              {viewers.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {v.user.avatar ? (
                      <img
                        src={v.user.avatar}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover bg-slate-100 dark:bg-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-sky-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {(v.user.name || v.user.email || '?').slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {v.user.name || '(이름 없음)'}{' '}
                        {v.user.username && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            @{v.user.username}
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {v.user.email}
                        {v.lastViewedAt && (
                          <>
                            {' · '}
                            <span title={new Date(v.lastViewedAt).toLocaleString('ko-KR')}>
                              {v.viewCount}회 열람
                            </span>
                          </>
                        )}
                        {v.expiresAt && (
                          <>
                            {' · '}만료 {new Date(v.expiresAt).toLocaleDateString('ko-KR')}
                          </>
                        )}
                      </p>
                      {v.message && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 italic line-clamp-1">
                          "{v.message}"
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(v.userId, v.user.name || v.user.email)}
                    className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="제거"
                    aria-label={`${v.user.name || v.user.email} 제거`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Dialog>
  );
}
