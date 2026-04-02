import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import Header from '@/components/Header';
import ResumePreview from '@/components/ResumePreview';
import LlmTransformPanel from '@/components/LlmTransformPanel';
import { resumeThemes } from '@/lib/resumeThemes';
import VersionPanel from '@/components/VersionPanel';
import AttachmentPanel from '@/components/AttachmentPanel';
import AiAnalysisPanel from '@/components/AiAnalysisPanel';
import CommentSection from '@/components/CommentSection';
import CompletenessBar from '@/components/CompletenessBar';
import AtsScorePanel from '@/components/AtsScorePanel';
import SimilarityPanel from '@/components/SimilarityPanel';
import ResumeChecklist from '@/components/ResumeChecklist';
import TransformHistory from '@/components/TransformHistory';
import ResumeTrend from '@/components/ResumeTrend';
import SkillChart from '@/components/SkillChart';
import CareerTimeline from '@/components/CareerTimeline';
import KeywordAnalysis from '@/components/KeywordAnalysis';
import ResumeStats from '@/components/ResumeStats';
import { toast } from '@/components/Toast';
import type { Resume } from '@/types/resume';
import { fetchResume } from '@/lib/api';
import { getUser } from '@/lib/auth';
import BookmarkButton from '@/components/BookmarkButton';
import QrCodeModal from '@/components/QrCodeModal';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resume, setResume] = useState<Resume | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showTransform, setShowTransform] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [themeId, setThemeId] = useState('classic');
  const [showQr, setShowQr] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: resume?.title || '이력서',
  });

  const handleCopyLink = () => {
    const url = resume?.slug
      ? `${window.location.origin}/@${encodeURIComponent(resume.personalInfo.name || 'user')}/${resume.slug}`
      : window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast('링크가 복사되었습니다', 'success');
    });
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchResume(id)
      .then(data => { if (!cancelled) setResume(data); })
      .catch(() => { if (!cancelled) setNotFound(true); });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (resume) {
      document.title = `${resume.personalInfo.name || resume.title || '이력서'} — 이력서공방`;
    }
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, [resume]);

  if (notFound) {
    return (
      <>
        <Header />
        <main id="main-content" className="flex-1 flex items-center justify-center" role="main">
          <div className="text-center px-4">
            <p className="text-lg text-slate-700 mb-4">이력서를 찾을 수 없습니다</p>
            <button
              onClick={() => navigate('/')}
              className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              목록으로 돌아가기
            </button>
          </div>
        </main>
      </>
    );
  }

  if (!resume) {
    return (
      <>
        <Header />
        <main id="main-content" className="flex-1 py-8 px-4" role="main">
          <div className="bg-white p-8 sm:p-12 max-w-[210mm] mx-auto shadow-lg animate-pulse">
            <div className="text-center mb-10 pb-6 border-b-2 border-slate-200">
              <div className="h-8 bg-slate-200 rounded w-48 mx-auto mb-3" />
              <div className="h-4 bg-slate-100 rounded w-64 mx-auto" />
            </div>
            <div className="h-4 bg-slate-100 rounded w-full mb-2" />
            <div className="h-4 bg-slate-100 rounded w-5/6 mb-2" />
            <div className="h-4 bg-slate-100 rounded w-4/6 mb-8" />
            <div className="h-6 bg-slate-200 rounded w-24 mb-4" />
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i}>
                  <div className="h-5 bg-slate-100 rounded w-3/4 mb-1" />
                  <div className="h-3 bg-slate-50 rounded w-full" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1" role="main">
        {/* Toolbar */}
        <div className="no-print sticky top-14 sm:top-16 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => navigate('/')}
                className="text-sm text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                aria-label="목록으로"
              >
                &larr; <span className="hidden sm:inline">목록</span>
              </button>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <button
                onClick={() => navigate(`/resumes/${id}/edit`)}
                className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
              >
                편집
              </button>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap overflow-x-auto scrollbar-none">
              <button
                onClick={handleCopyLink}
                className="px-2.5 sm:px-3 py-2 text-slate-600 bg-slate-100 text-xs sm:text-sm font-medium rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                title="공유 링크 복사"
              >
                🔗 공유
              </button>
              <button
                onClick={() => setShowQr(true)}
                className="px-2.5 sm:px-3 py-2 text-slate-600 bg-slate-100 text-xs sm:text-sm font-medium rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                title="QR 코드로 공유"
              >
                QR 공유
              </button>
              <button
                onClick={() => setShowAttachments(true)}
                className="px-2.5 sm:px-3 py-2 text-slate-600 bg-slate-100 text-xs sm:text-sm font-medium rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                첨부
              </button>
              <button
                onClick={() => setShowVersions(true)}
                className="px-2.5 sm:px-3 py-2 text-slate-600 bg-slate-100 text-xs sm:text-sm font-medium rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                버전
              </button>
              {resume.visibility === 'public' && (
                <BookmarkButton resumeId={id!} />
              )}
              <button
                onClick={() => setShowAiAnalysis(true)}
                className="px-2.5 sm:px-3 py-2 bg-emerald-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
              >
                🤖 AI 분석
              </button>
              <button
                onClick={() => setShowTransform(true)}
                className="px-2.5 sm:px-4 py-2 bg-purple-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
              >
                변환
              </button>
              <div className="relative group">
                <button className="px-2.5 sm:px-3 py-2 text-slate-600 bg-slate-100 text-xs sm:text-sm font-medium rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200">
                  내보내기
                </button>
                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <a href={`${API_URL}/api/resumes/${id}/export/text`} download={`${resume?.title || 'resume'}.txt`} className="block px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-t-xl">
                    📄 텍스트 (.txt)
                  </a>
                  <a href={`${API_URL}/api/resumes/${id}/export/markdown`} download={`${resume?.title || 'resume'}.md`} className="block px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-b-xl">
                    📝 마크다운 (.md)
                  </a>
                </div>
              </div>
              <button
                onClick={() => handlePrint()}
                className="px-2 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                PDF / 인쇄
              </button>
            </div>
          </div>
          {/* Theme selector */}
          {/* Theme selector */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {resumeThemes.map(t => {
              const currentUser = getUser();
              const locked = t.premium && (!currentUser?.plan || currentUser.plan === 'free');
              return (
                <button
                  key={t.id}
                  onClick={() => !locked && setThemeId(t.id)}
                  disabled={locked}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg whitespace-nowrap transition-all duration-200 ${
                    locked ? 'opacity-50 cursor-not-allowed' :
                    themeId === t.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                  title={locked ? '프로 플랜 전용' : t.description}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    t.accentColor === 'blue' ? 'bg-blue-500' :
                    t.accentColor === 'slate' ? 'bg-slate-500' :
                    t.accentColor === 'purple' ? 'bg-purple-500' :
                    t.accentColor === 'indigo' ? 'bg-indigo-500' :
                    t.accentColor === 'green' ? 'bg-green-500' :
                    t.accentColor === 'amber' ? 'bg-amber-500' : 'bg-slate-500'
                  }`} />
                  {t.name}
                  {locked && <span className="text-xs">🔒</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="py-6 sm:py-8 px-4">
          <div className="max-w-[210mm] mx-auto mb-4 no-print space-y-4">
            <CompletenessBar resume={resume} />
            <AtsScorePanel resume={resume} />
            <SimilarityPanel resume={resume} />
            <ResumeChecklist resume={resume} />
            <TransformHistory resumeId={id!} />
            <ResumeTrend resumeId={id!} />
            <SkillChart resume={resume} />
            <CareerTimeline resume={resume} />
            <KeywordAnalysis resume={resume} />
          </div>
          <ResumePreview ref={contentRef} resume={resume} themeId={themeId} />
          <div className="max-w-[210mm] mx-auto mt-3 px-1">
            <ResumeStats resume={resume} />
          </div>
          <div className="max-w-[210mm] mx-auto mt-6">
            <CommentSection resumeId={id!} isPublic={resume.visibility === 'public'} />
          </div>
        </div>
      </main>

      {/* AI Analysis Panel */}
      {showAiAnalysis && id && (
        <AiAnalysisPanel resumeId={id} onClose={() => setShowAiAnalysis(false)} />
      )}

      {/* LLM Transform Panel */}
      {showTransform && id && (
        <LlmTransformPanel resumeId={id} onClose={() => setShowTransform(false)} />
      )}

      {/* Version Panel */}
      {showVersions && id && (
        <VersionPanel
          resumeId={id}
          onClose={() => setShowVersions(false)}
          onRestore={() => { fetchResume(id).then(setResume); }}
        />
      )}

      {/* Attachment Panel */}
      {showAttachments && id && (
        <AttachmentPanel resumeId={id} onClose={() => setShowAttachments(false)} />
      )}

      {/* QR Code Modal */}
      {showQr && resume && (
        <QrCodeModal
          url={window.location.href}
          title={`${resume.personalInfo.name || resume.title} — 이력서`}
          onClose={() => setShowQr(false)}
        />
      )}
    </>
  );
}
