import { useEffect, useState } from 'react';
import Dialog from '@/shared/ui/Dialog';
import { toast } from '@/components/Toast';
import {
  listAllowedViewers,
  addAllowedViewer,
  removeAllowedViewer,
  type ResumeAllowedViewer,
} from '@/lib/api';

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
  const [message, setMessage] = useState('');

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

  const handleAdd = async () => {
    const q = query.trim();
    if (!q) return;
    setAdding(true);
    try {
      // @username 형식이면 username 으로, 그 외 이메일로 시도
      const isEmail = q.includes('@') && q.indexOf('@') > 0;
      const payload = isEmail
        ? { email: q, message: message.trim() || undefined }
        : { username: q.replace(/^@/, ''), message: message.trim() || undefined };
      await addAllowedViewer(resumeId, payload);
      toast('사용자를 추가했습니다', 'success');
      setQuery('');
      setMessage('');
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : '추가에 실패했습니다', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (userId: string, name: string) => {
    if (!confirm(`${name}님을 허용 목록에서 제거할까요?`)) return;
    try {
      await removeAllowedViewer(resumeId, userId);
      toast('제거했습니다', 'success');
      setViewers((prev) => prev.filter((v) => v.userId !== userId));
    } catch (err) {
      toast(err instanceof Error ? err.message : '제거에 실패했습니다', 'error');
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="허용 사용자 관리"
      description="선택 공개로 설정된 이력서를 볼 수 있는 사용자를 관리합니다."
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        {/* 추가 영역 */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-800/40">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            사용자 추가 (username 또는 이메일)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.trim() && !adding) {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              placeholder="@hjunkim 또는 user@example.com"
              className="flex-1 px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!query.trim() || adding}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {adding ? '추가 중...' : '추가'}
            </button>
          </div>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="메시지 (선택, 예: '코치 매칭용으로 공유합니다')"
            maxLength={200}
            className="mt-2 w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            ⓘ 이력서공방 가입 사용자만 추가 가능. 추가 즉시 해당 사용자에게 알림이 발송되고 이력서를
            볼 수 있게 됩니다.
          </p>
        </div>

        {/* 목록 */}
        <div>
          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            현재 허용 사용자 ({viewers.length}명)
          </h4>
          {loading ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
              불러오는 중...
            </p>
          ) : viewers.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                아직 추가된 사용자가 없습니다
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                위에서 username 이나 이메일로 추가해보세요
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
