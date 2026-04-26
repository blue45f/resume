import { useEffect, useState } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { Link } from 'react-router-dom';
import { fetchResume } from '@/lib/api';
import type { Resume } from '@/types/resume';
import { ROUTES } from '@/lib/routes';

interface Applicant {
  id: string; // application id
  userId: string;
  name: string;
  email?: string | null;
  avatar?: string;
  position?: string;
  resumeId?: string | null;
  coverLetter?: string;
  stage?: string;
  createdAt?: string;
}

interface Props {
  applicant: Applicant | null;
  onClose: () => void;
  onMessage?: (userId: string, name: string) => void;
}

const STAGE_LABEL: Record<string, string> = {
  interested: '👀 검토',
  contacted: '📞 연락',
  interview: '🗓 면접',
  hired: '✅ 채용',
  rejected: '✗ 거절',
  withdrawn: '— 철회',
};

/**
 * Recruiter 가 applicant row 클릭 → side drawer 로 detail 표시.
 * 이력서 lazy fetch + 자소서 + 채팅/스카우트 CTA.
 */
export default function ApplicantDetailDrawer({ applicant, onClose }: Props) {
  const [resume, setResume] = useState<Resume | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);

  useEffect(() => {
    const id = applicant?.resumeId;
    if (!id) return;
    let cancelled = false;
    setResumeLoading(true);
    setResumeError(null);
    fetchResume(id)
      .then((r) => {
        if (!cancelled) setResume(r);
      })
      .catch((e) => {
        if (!cancelled) setResumeError(e?.message || '이력서를 불러올 수 없습니다');
      })
      .finally(() => {
        if (!cancelled) setResumeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applicant?.resumeId]);

  // applicant 가 다른 사람으로 바뀌면 이전 resume render 차단 (mismatch 방지)
  const showResume = resume && applicant?.resumeId === resume.id ? resume : null;

  if (!applicant) return null;
  const stage = STAGE_LABEL[applicant.stage || 'interested'] || applicant.stage;

  return (
    <RadixDialog.Root open onOpenChange={(o) => !o && onClose()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[90] bg-black/30 animate-fade-in" />
        <RadixDialog.Content
          aria-label="지원자 상세"
          className="fixed z-[91] top-0 right-0 w-full max-w-lg h-full bg-white dark:bg-neutral-800 shadow-2xl overflow-y-auto focus:outline-none animate-slide-in-right"
        >
          <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-5 py-3 flex items-center justify-between z-10">
            <div className="flex items-center gap-3 min-w-0">
              {applicant.avatar ? (
                <img
                  src={applicant.avatar}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover bg-slate-100 dark:bg-slate-700"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-sky-700 text-white flex items-center justify-center text-sm font-bold">
                  {(applicant.name || '?')[0]}
                </div>
              )}
              <div className="min-w-0">
                <RadixDialog.Title className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                  {applicant.name || '익명'}
                </RadixDialog.Title>
                <RadixDialog.Description className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {applicant.position || '미지정'}
                  {stage && ` · ${stage}`}
                </RadixDialog.Description>
              </div>
            </div>
            <RadixDialog.Close asChild>
              <button
                className="shrink-0 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                aria-label="닫기"
              >
                <svg
                  className="w-5 h-5 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </RadixDialog.Close>
          </div>

          <div className="px-5 py-4 space-y-5">
            {/* 자소서 */}
            {applicant.coverLetter && (
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  자소서
                </h3>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {applicant.coverLetter}
                </div>
              </section>
            )}

            {/* 이력서 미리보기 */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  이력서
                </h3>
                {applicant.resumeId && (
                  <Link
                    to={ROUTES.resume.preview(applicant.resumeId)}
                    target="_blank"
                    rel="noopener"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    전체 보기 →
                  </Link>
                )}
              </div>
              {!applicant.resumeId ? (
                <p className="text-sm text-slate-400 italic">첨부 이력서 없음</p>
              ) : resumeLoading ? (
                <p className="text-sm text-slate-500">불러오는 중...</p>
              ) : resumeError ? (
                <p className="text-sm text-rose-500">{resumeError}</p>
              ) : showResume ? (
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {showResume.personalInfo?.name || '이름 미상'}
                    </p>
                    {showResume.personalInfo?.summary && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-3">
                        {showResume.personalInfo.summary}
                      </p>
                    )}
                  </div>
                  {showResume.experiences && showResume.experiences.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        경력 ({showResume.experiences.length})
                      </p>
                      <ul className="space-y-1">
                        {showResume.experiences.slice(0, 3).map((e, i) => (
                          <li key={i} className="text-xs text-slate-700 dark:text-slate-300">
                            <span className="font-medium">{e.position}</span>
                            {e.company && <span className="text-slate-500"> · {e.company}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {showResume.skills && showResume.skills.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        스킬
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {showResume.skills.slice(0, 6).map((s, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                          >
                            {s.category}: {(s.items || '').split(',').slice(0, 3).join(', ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </section>

            {/* 액션 */}
            <section className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
              {applicant.resumeId && (
                <Link
                  to={ROUTES.resume.preview(applicant.resumeId)}
                  target="_blank"
                  rel="noopener"
                  className="px-3 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                >
                  📋 이력서 새 탭
                </Link>
              )}
              <Link
                to={`/messages?to=${applicant.userId}`}
                className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                💬 메시지
              </Link>
            </section>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
