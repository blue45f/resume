import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import Header from '@/components/Header';
import ResumePreview from '@/components/ResumePreview';
import LlmTransformPanel from '@/components/LlmTransformPanel';
import VersionPanel from '@/components/VersionPanel';
import AttachmentPanel from '@/components/AttachmentPanel';
import type { Resume } from '@/types/resume';
import { fetchResume } from '@/lib/api';

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resume, setResume] = useState<Resume | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showTransform, setShowTransform] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: resume?.title || '이력서',
  });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchResume(id)
      .then(data => { if (!cancelled) setResume(data); })
      .catch(() => { if (!cancelled) setNotFound(true); });
    return () => { cancelled = true; };
  }, [id]);

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
        <div className="no-print sticky top-14 sm:top-16 z-40 bg-slate-50 border-b border-slate-200">
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
            <div className="flex items-center gap-1.5 sm:gap-2">
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
              <button
                onClick={() => setShowTransform(true)}
                className="px-2.5 sm:px-4 py-2 bg-purple-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
              >
                변환
              </button>
              <button
                onClick={() => handlePrint()}
                className="px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                PDF / 인쇄
              </button>
            </div>
          </div>
        </div>

        <div className="py-6 sm:py-8 px-4">
          <ResumePreview ref={contentRef} resume={resume} />
        </div>
      </main>

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
    </>
  );
}
