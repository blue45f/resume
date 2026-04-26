import { lazy, Suspense, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as RadixDialog from '@radix-ui/react-dialog';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import ResumePreview from '@/components/ResumePreview';
import ShareMenu from '@/components/ShareMenu';
import { ROUTES } from '@/lib/routes';

// Lazy-load heavy sub-components
const CommentSection = lazy(() => import('@/components/CommentSection'));
const SimilarResumes = lazy(() => import('@/components/SimilarResumes'));
import { toast } from '@/components/Toast';
import { getUser } from '@/lib/auth';
import FollowButton from '@/components/FollowButton';
import SendMessageButton from '@/components/SendMessageButton';
import type { Resume } from '@/types/resume';
import { API_URL } from '@/lib/config';

export default function ProfileResumePage() {
  const { username, slug } = useParams<{ username: string; slug: string }>();
  const {
    data,
    isLoading: loading,
    error,
  } = useQuery<Resume>({
    queryKey: ['resume', 'profile', username, slug],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/resumes/@${username}/${slug}`);
      if (!res.ok) throw new Error('Not found');
      return res.json();
    },
    enabled: !!username && !!slug,
  });
  const resume: Resume | null = (data as Resume | undefined) ?? null;
  const notFound = !!error;
  const viewCount: number | null = resume?.viewCount != null ? resume.viewCount : null;
  const [scoutModalOpen, setScoutModalOpen] = useState(false);
  const [scoutForm, setScoutForm] = useState({ company: '', position: '', message: '' });
  const [sendingScout, setSendingScout] = useState(false);
  const user = getUser();

  useEffect(() => {
    if (resume) {
      document.title = `${resume.personalInfo.name || resume.title || '이력서'} — 이력서공방`;
    }
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, [resume]);

  useEffect(() => {
    if (!resume) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'resume-jsonld';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: resume.personalInfo?.name || '',
      jobTitle: resume.experiences?.[0]?.position || '',
    });
    document.head.appendChild(script);
    return () => {
      const el = document.getElementById('resume-jsonld');
      if (el) el.remove();
    };
  }, [resume]);

  const handleScoutSubmit = async () => {
    if (!scoutForm.message.trim()) {
      toast('메시지를 입력해주세요', 'error');
      return;
    }
    setSendingScout(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/social/scout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          receiverId: resume?.userId,
          resumeId: resume?.id,
          company: scoutForm.company,
          position: scoutForm.position,
          message: scoutForm.message,
        }),
      });
      if (!res.ok) throw new Error();
      toast('스카우트 제안이 전송되었습니다', 'success');
      setScoutModalOpen(false);
      setScoutForm({ company: '', position: '', message: '' });
    } catch {
      toast('전송에 실패했습니다', 'error');
    } finally {
      setSendingScout(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main id="main-content" className="flex-1 py-8 px-4" role="main">
          <div className="bg-white dark:bg-slate-800 p-8 sm:p-12 max-w-[210mm] mx-auto shadow-lg animate-pulse">
            <div className="text-center mb-10 pb-6 border-b-2 border-slate-200 dark:border-slate-700">
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48 mx-auto mb-3" />
              <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-64 mx-auto" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="h-5 bg-slate-100 dark:bg-slate-700 rounded w-3/4 mb-1" />
                  <div className="h-3 bg-slate-50 dark:bg-slate-700 rounded w-full" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </>
    );
  }

  if (notFound || !resume) {
    return (
      <>
        <Header />
        <main id="main-content" className="flex-1 flex items-center justify-center" role="main">
          <div className="text-center px-4">
            <p className="text-5xl mb-4">📄</p>
            <p className="text-lg text-slate-700 dark:text-slate-300 mb-2">
              이력서를 찾을 수 없습니다
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              @{username}/{slug}
            </p>
            <Link to={ROUTES.resume.explore} className="text-blue-600 hover:underline">
              공개 이력서 탐색
            </Link>
          </div>
        </main>
      </>
    );
  }

  const { personalInfo } = resume;

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1" role="main">
        {/* Sticky Toolbar */}
        <div className="no-print sticky top-14 sm:top-16 z-40 bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/60 dark:border-slate-700/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
            {/* Left: navigation + person info */}
            <div className="flex items-center gap-3 min-w-0">
              <Link
                to={ROUTES.resume.explore}
                className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shrink-0"
              >
                &larr; 탐색
              </Link>
              <span className="text-slate-300 dark:text-slate-600 shrink-0">|</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate text-sm">
                    {personalInfo.name || `@${username}`}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                    @{username}/{slug}
                  </span>
                </div>
                {(personalInfo.email || personalInfo.phone) && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 truncate">
                    {personalInfo.email && <span>{personalInfo.email}</span>}
                    {personalInfo.email && personalInfo.phone && <span>·</span>}
                    {personalInfo.phone && <span>{personalInfo.phone}</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Right: stats + actions */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {viewCount != null && viewCount > 0 && (
                <span
                  className="hidden sm:flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg"
                  title="조회수"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  {viewCount.toLocaleString()}
                </span>
              )}
              <ShareMenu
                url={window.location.href}
                title={`${personalInfo.name || username} 이력서`}
                description={`${personalInfo.name || username}님의 이력서 — 이력서공방`}
              />
              <a
                href={`${API_URL}/api/resumes/${resume.id}/export/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                PDF
              </a>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                title="인쇄"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
              </button>
              {user && resume.userId && user.id !== resume.userId && (
                <button
                  onClick={() => setScoutModalOpen(true)}
                  className="px-2.5 sm:px-3 py-2 bg-emerald-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-emerald-700 transition-all duration-200 flex items-center gap-2"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="hidden sm:inline">스카우트 제안</span>
                  <span className="sm:hidden">스카우트</span>
                </button>
              )}
              {user && resume?.userId && user.id !== resume.userId && (
                <>
                  <FollowButton userId={resume.userId!} />
                  <SendMessageButton
                    userId={resume.userId!}
                    userName={personalInfo.name || username || '사용자'}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="py-6 sm:py-8 px-4">
          <ResumePreview ref={null} resume={resume} />

          {/* View count (mobile) + actions row */}
          <div className="max-w-[210mm] mx-auto mt-4 sm:hidden no-print">
            {viewCount != null && viewCount > 0 && (
              <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mb-3">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                조회 {viewCount.toLocaleString()}회
              </div>
            )}
          </div>

          <Suspense
            fallback={
              <div className="max-w-[210mm] mx-auto mt-6 h-32 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl" />
            }
          >
            <div className="max-w-[210mm] mx-auto mt-6">
              <CommentSection resumeId={resume.id} isPublic={true} />
            </div>
          </Suspense>

          {/* Similar Resumes */}
          <Suspense
            fallback={
              <div className="max-w-[210mm] mx-auto mt-6 h-32 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl" />
            }
          >
            <div className="max-w-[210mm] mx-auto mt-6">
              <SimilarResumes resume={resume} />
            </div>
          </Suspense>
        </div>
      </main>

      {/* Scout Proposal Modal */}
      <RadixDialog.Root open={scoutModalOpen} onOpenChange={setScoutModalOpen}>
        <RadixDialog.Portal>
          <RadixDialog.Overlay className="fixed inset-0 z-[90] bg-black/50 animate-fade-in" />
          <RadixDialog.Content className="fixed z-[91] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xl p-6 max-h-[90vh] overflow-y-auto focus:outline-none">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-emerald-600 dark:text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <RadixDialog.Title className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  이 이력서로 스카우트 제안
                </RadixDialog.Title>
                <RadixDialog.Description className="text-xs text-neutral-500 dark:text-neutral-400">
                  {personalInfo.name || `@${username}`}님에게 스카우트 제안
                </RadixDialog.Description>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  회사명
                </label>
                <input
                  type="text"
                  value={scoutForm.company}
                  onChange={(e) => setScoutForm((prev) => ({ ...prev, company: e.target.value }))}
                  placeholder="예: 네이버, 카카오"
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  포지션
                </label>
                <input
                  type="text"
                  value={scoutForm.position}
                  onChange={(e) => setScoutForm((prev) => ({ ...prev, position: e.target.value }))}
                  placeholder="예: 프론트엔드 개발자"
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  메시지 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={scoutForm.message}
                  onChange={(e) => setScoutForm((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="이력서를 인상 깊게 봤습니다. 저희 팀에서 함께할 분을 찾고 있는데..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setScoutModalOpen(false);
                  setScoutForm({ company: '', position: '', message: '' });
                }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleScoutSubmit}
                disabled={sendingScout || !scoutForm.message.trim()}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                {sendingScout ? '전송 중...' : '스카우트 제안 보내기'}
              </button>
            </div>
          </RadixDialog.Content>
        </RadixDialog.Portal>
      </RadixDialog.Root>
    </>
  );
}
