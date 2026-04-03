import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import ResumeScoreboard from '@/components/ResumeScoreboard';
import SalaryEstimate from '@/components/SalaryEstimate';
import AtsScorePanel from '@/components/AtsScorePanel';
import SimilarityPanel from '@/components/SimilarityPanel';
import ResumeChecklist from '@/components/ResumeChecklist';
import TransformHistory from '@/components/TransformHistory';
import ResumeTrend from '@/components/ResumeTrend';
import SkillChart from '@/components/SkillChart';
import CareerTimeline from '@/components/CareerTimeline';
import CareerPathSuggestion from '@/components/CareerPathSuggestion';
import SimilarResumes from '@/components/SimilarResumes';
import KeywordAnalysis from '@/components/KeywordAnalysis';
import AttachmentList from '@/components/AttachmentList';
import ResumeAnalytics from '@/components/ResumeAnalytics';
import ResumeStats from '@/components/ResumeStats';
import { toast } from '@/components/Toast';
import type { Resume } from '@/types/resume';
import { fetchResume } from '@/lib/api';
import { getUser } from '@/lib/auth';
import BookmarkButton from '@/components/BookmarkButton';
import QrCodeModal from '@/components/QrCodeModal';
import { API_URL } from '@/lib/config';

/** Map theme accentColor to Tailwind classes */
const accentColorMap: Record<string, { dot: string; ring: string; bgLight: string; border: string }> = {
  blue:   { dot: 'bg-blue-500',   ring: 'ring-blue-400',   bgLight: 'bg-blue-50',   border: 'border-blue-400' },
  slate:  { dot: 'bg-slate-500',  ring: 'ring-slate-400',  bgLight: 'bg-slate-50',  border: 'border-slate-400' },
  purple: { dot: 'bg-purple-500', ring: 'ring-purple-400', bgLight: 'bg-purple-50', border: 'border-purple-400' },
  indigo: { dot: 'bg-indigo-500', ring: 'ring-indigo-400', bgLight: 'bg-indigo-50', border: 'border-indigo-400' },
  green:  { dot: 'bg-green-500',  ring: 'ring-green-400',  bgLight: 'bg-green-50',  border: 'border-green-400' },
  amber:  { dot: 'bg-amber-500',  ring: 'ring-amber-400',  bgLight: 'bg-amber-50',  border: 'border-amber-400' },
};

/** Estimate reading time for Korean resume content (~200 words/min) */
function estimateReadingMinutes(resume: Resume): number {
  const parts: string[] = [];
  const { personalInfo, experiences, educations, skills, projects, certifications, languages, awards, activities } = resume;
  if (personalInfo.name) parts.push(personalInfo.name);
  if (personalInfo.email) parts.push(personalInfo.email);
  if (personalInfo.phone) parts.push(personalInfo.phone);
  if (personalInfo.summary) parts.push(personalInfo.summary);
  experiences.forEach(e => { parts.push(e.company, e.position, e.description ?? ''); });
  educations.forEach(e => { parts.push(e.school, e.degree, e.field ?? ''); });
  skills.forEach(s => { parts.push(s.name); });
  projects.forEach(p => { parts.push(p.name, p.description ?? ''); });
  certifications.forEach(c => { parts.push(c.name); });
  languages.forEach(l => { parts.push(l.name); });
  awards.forEach(a => { parts.push(a.title, a.description ?? ''); });
  activities.forEach(a => { parts.push(a.name, a.description ?? ''); });
  const totalChars = parts.join(' ').length;
  // Korean: ~2 chars/word on average => chars/2 = word count => /200 = minutes
  const minutes = Math.max(1, Math.ceil(totalChars / 2 / 200));
  return minutes;
}


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
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [printPreparing, setPrintPreparing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  const reactToPrint = useReactToPrint({
    contentRef,
    documentTitle: resume?.title || '이력서',
  });

  const handlePrint = useCallback(() => {
    setPrintPreparing(true);
    setTimeout(() => {
      setPrintPreparing(false);
      reactToPrint();
    }, 800);
  }, [reactToPrint]);

  const shareUrl = useMemo(() => {
    if (!resume) return window.location.href;
    return resume.slug
      ? `${window.location.origin}/@${encodeURIComponent(resume.personalInfo.name || 'user')}/${resume.slug}`
      : window.location.href;
  }, [resume]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast('링크가 복사되었습니다', 'success');
    });
    setShowShareMenu(false);
  }, [shareUrl]);

  const handleShareEmail = useCallback(() => {
    const subject = encodeURIComponent(`${resume?.personalInfo.name || ''}의 이력서`);
    const body = encodeURIComponent(`이력서를 확인해 보세요:\n${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
    setShowShareMenu(false);
  }, [resume, shareUrl]);

  const handleShareLinkedIn = useCallback(() => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener');
    setShowShareMenu(false);
  }, [shareUrl]);

  const handleShareKakao = useCallback(() => {
    // Fallback: copy link and guide user
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast('링크가 복사되었습니다. 카카오톡에서 붙여넣기 해주세요.', 'info');
    });
    setShowShareMenu(false);
  }, [shareUrl]);

  const readingMinutes = useMemo(() => resume ? estimateReadingMinutes(resume) : 0, [resume]);

  // Close share menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShowShareMenu(false);
      }
    }
    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showShareMenu]);

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
      <main id="main-content" className="flex-1 pb-20 sm:pb-0" role="main">
        {/* Toolbar — hidden on mobile (actions moved to sticky bottom bar) */}
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
              {/* Reading time indicator */}
              <span className="text-slate-300 hidden sm:inline">|</span>
              <span className="hidden sm:inline text-xs text-slate-400" title="예상 읽는 시간">
                읽는 시간: ~{readingMinutes}분
              </span>
            </div>
            {/* Desktop action buttons */}
            <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 flex-wrap overflow-x-auto scrollbar-none">
              {/* Share dropdown */}
              <div className="relative" ref={shareMenuRef}>
                <button
                  onClick={() => setShowShareMenu(v => !v)}
                  className="px-2.5 sm:px-3 py-2 text-slate-600 bg-slate-100 text-xs sm:text-sm font-medium rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  title="공유"
                >
                  공유
                </button>
                {showShareMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <button onClick={handleCopyLink} className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-t-xl">
                      <span className="w-5 text-center">🔗</span> 링크 복사
                    </button>
                    <button onClick={handleShareKakao} className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                      <span className="w-5 text-center">💬</span> KakaoTalk
                    </button>
                    <button onClick={handleShareLinkedIn} className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                      <span className="w-5 text-center">💼</span> LinkedIn
                    </button>
                    <button onClick={handleShareEmail} className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-b-xl">
                      <span className="w-5 text-center">📧</span> Email
                    </button>
                  </div>
                )}
              </div>
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
                AI 분석
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
                    텍스트 (.txt)
                  </a>
                  <a href={`${API_URL}/api/resumes/${id}/export/markdown`} download={`${resume?.title || 'resume'}.md`} className="block px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                    마크다운 (.md)
                  </a>
                  <a href={`${API_URL}/api/resumes/${id}/export/json`} download={`${resume?.title || 'resume'}.json`} className="block px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-b-xl">
                    JSON (.json)
                  </a>
                </div>
              </div>
              <button
                onClick={handlePrint}
                disabled={printPreparing}
                className="px-2 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-70"
              >
                {printPreparing ? '인쇄 준비 중...' : 'PDF / 인쇄'}
              </button>
            </div>
          </div>

          {/* Theme selector — visual thumbnail strip */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none">
            {resumeThemes.map(t => {
              const currentUser = getUser();
              const isAdminUser = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
              const locked = t.premium && !isAdminUser && (!currentUser?.plan || currentUser.plan === 'free');
              const colors = accentColorMap[t.accentColor] || accentColorMap.slate;
              const isSelected = themeId === t.id;
              const hasColorHeader = t.headerStyle.includes('bg-gradient') || t.headerStyle.includes('bg-[') || t.headerStyle.includes('bg-slate-900');

              return (
                <button
                  key={t.id}
                  onClick={() => !locked && setThemeId(t.id)}
                  disabled={locked}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all duration-200 border-2 ${
                    locked ? 'opacity-40 cursor-not-allowed border-transparent' :
                    isSelected
                      ? `border-blue-500 bg-blue-50 shadow-sm ring-1 ${colors.ring}`
                      : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                  }`}
                  title={locked ? '프로 플랜 전용' : t.description}
                >
                  {/* Mini preview swatch */}
                  <div className="w-14 h-10 rounded-md overflow-hidden border border-slate-200 bg-white relative">
                    {/* Header bar preview */}
                    <div className={`h-3.5 w-full ${
                      hasColorHeader
                        ? t.headerStyle.includes('from-purple') ? 'bg-gradient-to-r from-purple-500 via-pink-400 to-orange-400'
                        : t.headerStyle.includes('from-indigo') ? 'bg-gradient-to-r from-indigo-500 via-blue-400 to-cyan-400'
                        : t.headerStyle.includes('from-pink') ? 'bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200'
                        : t.headerStyle.includes('bg-[#0d1117]') ? 'bg-[#0d1117]'
                        : t.headerStyle.includes('bg-[#1a1a2e]') ? 'bg-[#1a1a2e]'
                        : t.headerStyle.includes('bg-slate-900') ? 'bg-slate-800'
                        : colors.dot
                        : colors.bgLight
                    }`} />
                    {/* Body lines preview */}
                    <div className="px-1.5 pt-1 space-y-0.5">
                      <div className={`h-0.5 w-full rounded-full ${colors.dot} opacity-60`} />
                      <div className="h-0.5 w-3/4 rounded-full bg-slate-200" />
                      <div className="h-0.5 w-5/6 rounded-full bg-slate-200" />
                    </div>
                    {/* Accent dot */}
                    <div className={`absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                    <span className={`text-[10px] leading-none whitespace-nowrap ${isSelected ? 'font-semibold text-blue-700' : 'text-slate-500'}`}>
                      {t.name}
                    </span>
                    {locked && <span className="text-[10px]">🔒</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Reading time indicator — mobile only (inline in toolbar) */}
          <div className="sm:hidden max-w-6xl mx-auto px-4 pb-2 flex items-center gap-2">
            <span className="text-[11px] text-slate-400">읽는 시간: ~{readingMinutes}분</span>
          </div>
        </div>

        <div className="py-6 sm:py-8 px-4">
          <div className="max-w-[210mm] mx-auto mb-4 no-print space-y-4">
            <CompletenessBar resume={resume} />
            <ResumeScoreboard resume={resume} />
            <SalaryEstimate resume={resume} />
            <AtsScorePanel resume={resume} />
            <SimilarityPanel resume={resume} />
            <ResumeChecklist resume={resume} />
            <TransformHistory resumeId={id!} />
            <ResumeTrend resumeId={id!} />
            <SkillChart resume={resume} />
            <CareerTimeline resume={resume} />
            <CareerPathSuggestion resume={resume} />
            <SimilarResumes resume={resume} />
            <KeywordAnalysis resume={resume} />
            <AttachmentList resumeId={id!} />
            <ResumeAnalytics resumeId={id!} />
          </div>
          <ResumePreview ref={contentRef} resume={resume} themeId={themeId} />
          <div className="max-w-[210mm] mx-auto mt-3 px-1">
            <ResumeStats resume={resume} />
          </div>
          <div className="max-w-[210mm] mx-auto mt-6">
            <CommentSection resumeId={id!} isPublic={resume.visibility === 'public'} />
          </div>
        </div>

        {/* Sticky bottom action bar — mobile only */}
        <div className="sm:hidden no-print fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-around px-2 py-2 gap-1">
            <div className="relative" ref={shareMenuRef}>
              <button
                onClick={() => setShowShareMenu(v => !v)}
                className="flex flex-col items-center gap-0.5 px-2 py-1 text-slate-600 rounded-lg active:bg-slate-100 transition-colors"
              >
                <span className="text-base">🔗</span>
                <span className="text-[10px]">공유</span>
              </button>
              {showShareMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-44 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg z-50">
                  <button onClick={handleCopyLink} className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-t-xl">
                    🔗 링크 복사
                  </button>
                  <button onClick={handleShareKakao} className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                    💬 KakaoTalk
                  </button>
                  <button onClick={handleShareLinkedIn} className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                    💼 LinkedIn
                  </button>
                  <button onClick={handleShareEmail} className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-b-xl">
                    📧 Email
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowAiAnalysis(true)}
              className="flex flex-col items-center gap-0.5 px-2 py-1 text-emerald-600 rounded-lg active:bg-emerald-50 transition-colors"
            >
              <span className="text-base">🤖</span>
              <span className="text-[10px] font-medium">AI 분석</span>
            </button>
            <button
              onClick={() => setShowTransform(true)}
              className="flex flex-col items-center gap-0.5 px-2 py-1 text-purple-600 rounded-lg active:bg-purple-50 transition-colors"
            >
              <span className="text-base">✨</span>
              <span className="text-[10px] font-medium">변환</span>
            </button>
            <button
              onClick={() => setShowVersions(true)}
              className="flex flex-col items-center gap-0.5 px-2 py-1 text-slate-600 rounded-lg active:bg-slate-100 transition-colors"
            >
              <span className="text-base">📋</span>
              <span className="text-[10px]">버전</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={printPreparing}
              className="flex flex-col items-center gap-0.5 px-2 py-1 text-blue-600 rounded-lg active:bg-blue-50 transition-colors disabled:opacity-60"
            >
              <span className="text-base">{printPreparing ? '⏳' : '🖨️'}</span>
              <span className="text-[10px] font-medium">{printPreparing ? '준비 중' : '인쇄'}</span>
            </button>
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

      {/* Print preparing overlay */}
      {printPreparing && (
        <div className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-sm flex items-center justify-center no-print">
          <div className="bg-white rounded-2xl shadow-xl px-8 py-6 flex flex-col items-center gap-3 border border-slate-200">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-700">인쇄 준비 중...</p>
          </div>
        </div>
      )}
    </>
  );
}
