import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '@/components/Header';
import ResumePreview from '@/components/ResumePreview';
import CommentSection from '@/components/CommentSection';
import { toast } from '@/components/Toast';
import { getUser } from '@/lib/auth';
import type { Resume } from '@/types/resume';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function ProfileResumePage() {
  const { username, slug } = useParams<{ username: string; slug: string }>();
  const [resume, setResume] = useState<Resume | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewCount, setViewCount] = useState<number | null>(null);
  const user = getUser();

  useEffect(() => {
    if (resume) {
      document.title = `${resume.personalInfo.name || resume.title || '이력서'} — 이력서공방`;
    }
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, [resume]);

  useEffect(() => {
    if (!username || !slug) return;
    let cancelled = false;
    fetch(`${API_URL}/api/resumes/@${username}/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        if (!cancelled) {
          setResume(data);
          if (data.viewCount != null) setViewCount(data.viewCount);
          setLoading(false);
        }
      })
      .catch(() => { if (!cancelled) { setNotFound(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, [username, slug]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast('링크가 복사되었습니다', 'success');
    } catch {
      toast('링크 복사에 실패했습니다', 'error');
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
              {[1,2,3].map(i => (<div key={i}><div className="h-5 bg-slate-100 dark:bg-slate-700 rounded w-3/4 mb-1" /><div className="h-3 bg-slate-50 dark:bg-slate-700 rounded w-full" /></div>))}
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
            <p className="text-lg text-slate-700 dark:text-slate-300 mb-2">이력서를 찾을 수 없습니다</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">@{username}/{slug}</p>
            <Link to="/explore" className="text-blue-600 hover:underline">공개 이력서 탐색</Link>
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
        <div className="no-print sticky top-14 sm:top-16 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/60 dark:border-slate-700/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
            {/* Left: navigation + person info */}
            <div className="flex items-center gap-3 min-w-0">
              <Link to="/explore" className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shrink-0">&larr; 탐색</Link>
              <span className="text-slate-300 dark:text-slate-600 shrink-0">|</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate text-sm">
                    {personalInfo.name || `@${username}`}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">@{username}/{slug}</span>
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
                <span className="hidden sm:flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500" title="조회수">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  {viewCount.toLocaleString()}
                </span>
              )}
              <button
                onClick={handleShare}
                className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                title="URL 복사"
              >
                공유하기
              </button>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 sm:px-3 py-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 text-xs sm:text-sm font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              >
                LinkedIn
              </a>
              <a
                href={`${API_URL}/api/resumes/${resume.id}/export/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                다운로드
              </a>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                인쇄
              </button>
              {user && resume.userId && user.id !== resume.userId && (
                <button
                  onClick={() => {
                    const msg = prompt('스카우트 메시지를 입력하세요:');
                    if (msg && msg.trim()) {
                      const token = localStorage.getItem('token');
                      fetch(`${API_URL}/api/social/scout`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ receiverId: resume.userId, resumeId: resume.id, company: '', position: '', message: msg }),
                      }).then(() => toast('스카우트 메시지가 전송되었습니다', 'success'))
                        .catch(() => toast('전송에 실패했습니다', 'error'));
                    }
                  }}
                  className="px-2.5 sm:px-3 py-2 bg-emerald-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-emerald-700 transition-all duration-200"
                >
                  스카우트
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="py-6 sm:py-8 px-4">
          <ResumePreview ref={null} resume={resume} />
          <div className="max-w-[210mm] mx-auto mt-6">
            <CommentSection resumeId={resume.id} isPublic={true} />
          </div>
        </div>
      </main>
    </>
  );
}
