import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import Header from '@/components/Header';
import ResumePreview from '@/components/ResumePreview';
import { resumeThemes } from '@/lib/resumeThemes';
import CompletenessBar from '@/components/CompletenessBar';

// Lazy-load heavy sub-components that are not visible on initial render
const LlmTransformPanel = lazy(() => import('@/components/LlmTransformPanel'));
const VersionPanel = lazy(() => import('@/components/VersionPanel'));
const AttachmentPanel = lazy(() => import('@/components/AttachmentPanel'));
const AiAnalysisPanel = lazy(() => import('@/components/AiAnalysisPanel'));
const CommentSection = lazy(() => import('@/components/CommentSection'));
const ResumeScoreboard = lazy(() => import('@/components/ResumeScoreboard'));
const SalaryEstimate = lazy(() => import('@/components/SalaryEstimate'));
const AtsScorePanel = lazy(() => import('@/components/AtsScorePanel'));
const JdMatchAnalyzer = lazy(() => import('@/components/JdMatchAnalyzer'));
const SimilarityPanel = lazy(() => import('@/components/SimilarityPanel'));
const ResumeChecklist = lazy(() => import('@/components/ResumeChecklist'));
const TransformHistory = lazy(() => import('@/components/TransformHistory'));
const ResumeTrend = lazy(() => import('@/components/ResumeTrend'));
const SkillChart = lazy(() => import('@/components/SkillChart'));
const ProjectShowcase = lazy(() => import('@/components/ProjectShowcase'));
const AchievementBadges = lazy(() => import('@/components/AchievementBadges'));
import SkillEndorsement from '@/components/SkillEndorsement';
import CareerTimeline from '@/components/CareerTimeline';
import CareerPathSuggestion from '@/components/CareerPathSuggestion';
import SimilarResumes from '@/components/SimilarResumes';
import KeywordAnalysis from '@/components/KeywordAnalysis';
import AttachmentList from '@/components/AttachmentList';
import ResumeAnalytics from '@/components/ResumeAnalytics';
import ResumeStats from '@/components/ResumeStats';
import AICareerAdvisor from '@/components/AICareerAdvisor';
import { toast } from '@/components/Toast';
import type { Resume } from '@/types/resume';
import { fetchResume } from '@/lib/api';
import { getUser } from '@/lib/auth';
import BookmarkButton from '@/components/BookmarkButton';
import FollowButton from '@/components/FollowButton';
import SendMessageButton from '@/components/SendMessageButton';
import QrCodeModal from '@/components/QrCodeModal';
import ExportPanel from '@/components/ExportPanel';
import PublicLinkSettings from '@/components/PublicLinkSettings';
import ShareStats from '@/components/ShareStats';
import ResumeAuditPanel from '@/components/ResumeAuditPanel';

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
  const [showJdMatch, setShowJdMatch] = useState(false);
  const [themeId, setThemeId] = useState('classic');
  const [customAccentHex, setCustomAccentHex] = useState('');
  const [customFont, setCustomFont] = useState('');
  const [showQr, setShowQr] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [printPreparing, setPrintPreparing] = useState(false);
  // Zoom controls
  const ZOOM_LEVELS = [75, 100, 125, 150] as const;
  const [zoomLevel, setZoomLevel] = useState(100);
  const [fitToWidth, setFitToWidth] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const previewWrapperRef = useRef<HTMLDivElement>(null);
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

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setFitToWidth(false);
    setZoomLevel(prev => {
      const idx = ZOOM_LEVELS.indexOf(prev as (typeof ZOOM_LEVELS)[number]);
      if (idx >= 0 && idx < ZOOM_LEVELS.length - 1) return ZOOM_LEVELS[idx + 1];
      return prev;
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setFitToWidth(false);
    setZoomLevel(prev => {
      const idx = ZOOM_LEVELS.indexOf(prev as (typeof ZOOM_LEVELS)[number]);
      if (idx > 0) return ZOOM_LEVELS[idx - 1];
      return prev;
    });
  }, []);

  const handleFitToWidth = useCallback(() => {
    setFitToWidth(prev => !prev);
  }, []);

  const handleFullscreen = useCallback(() => {
    if (!previewWrapperRef.current) return;
    if (!document.fullscreenElement) {
      previewWrapperRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // Listen for fullscreen exit
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

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

  const loadResume = () => {
    if (!id) return;
    setNotFound(false);
    fetchResume(id)
      .then(setResume)
      .catch(() => setNotFound(true));
  };

  useEffect(() => {
    loadResume();
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
          <div className="text-center px-4 animate-fade-in">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">이력서를 불러올 수 없습니다</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">서버가 시작 중이거나 일시적 오류일 수 있습니다</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={loadResume}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                다시 시도
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-5 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                홈으로
              </button>
            </div>
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
                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                aria-label="편집"
                title="편집"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
              {/* Reading time indicator */}
              <span className="text-slate-300 hidden sm:inline">|</span>
              <span className="hidden sm:inline text-xs text-slate-400" title="예상 읽는 시간">
                읽는 시간: ~{readingMinutes}분
              </span>
            </div>
            {/* Share analytics — compact */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
              <span title="조회수">{resume.viewCount || 0}회 조회</span>
            </div>

            {/* Desktop action buttons — grouped */}
            <div className="hidden sm:flex items-center gap-1.5">
              {/* Primary: AI 기능 */}
              <button onClick={() => navigate(`/resumes/${id}/review`)} className="px-3 py-1.5 bg-orange-600 text-white text-xs font-medium rounded-lg hover:bg-orange-700 transition-colors">리뷰</button>
              <button onClick={() => setShowAiAnalysis(true)} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors">AI 분석</button>
              <button onClick={() => setShowJdMatch(true)} className="px-3 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700 transition-colors">JD 매칭</button>
              <button onClick={() => navigate(`/cover-letter?resumeId=${id}`)} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors" title="이 이력서를 기반으로 자소서 작성">자소서</button>
              <button onClick={() => setShowTransform(true)} className="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors">변환</button>
              <button onClick={handlePrint} disabled={printPreparing} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-70 transition-colors">
                {printPreparing ? '준비 중...' : 'PDF'}
              </button>

              {/* Secondary: 더보기 드롭다운 */}
              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu(v => !v)}
                  className="px-2.5 py-1.5 text-slate-600 bg-slate-100 text-xs font-medium rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1"
                >
                  더보기
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showMoreMenu && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 py-1 animate-scale-in">
                    <button onClick={() => { handleCopyLink(); setShowMoreMenu(false); }} className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" /></svg>
                      링크 복사
                    </button>
                    <button onClick={() => { setShowShareMenu(true); setShowMoreMenu(false); }} className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316" /></svg>
                      SNS 공유
                    </button>
                    <button onClick={() => { setShowQr(true); setShowMoreMenu(false); }} className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                      QR 코드
                    </button>
                    <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                    <button onClick={() => { setShowAttachments(true); setShowMoreMenu(false); }} className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                      첨부파일
                    </button>
                    <button onClick={() => { setShowVersions(true); setShowMoreMenu(false); }} className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      버전 관리
                    </button>
                  </div>
                )}
              </div>

              {/* Bookmark & Social */}
              {resume.visibility === 'public' && <BookmarkButton resumeId={id!} />}
              {(() => {
                const currentUser = getUser();
                const isOtherUser = currentUser && resume.userId && currentUser.id !== resume.userId;
                if (!isOtherUser) return null;
                return (
                  <>
                    <FollowButton userId={resume.userId!} />
                    <SendMessageButton userId={resume.userId!} userName={resume.personalInfo.name || '사용자'} />
                  </>
                );
              })()}
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

          {/* Color & Font customization bar */}
          {(() => {
            const PRESET_COLORS = [
              { hex: '', label: '기본' },
              { hex: '#6366f1', label: '인디고' },
              { hex: '#3b82f6', label: '블루' },
              { hex: '#10b981', label: '에메랄드' },
              { hex: '#8b5cf6', label: '퍼플' },
              { hex: '#f59e0b', label: '앰버' },
              { hex: '#ef4444', label: '레드' },
              { hex: '#ec4899', label: '핑크' },
              { hex: '#0ea5e9', label: '스카이' },
              { hex: '#64748b', label: '슬레이트' },
            ];
            const FONTS = [
              { value: '', label: '기본 폰트' },
              { value: "'Pretendard', -apple-system, sans-serif", label: 'Pretendard' },
              { value: "'Noto Sans KR', sans-serif", label: 'Noto Sans KR' },
              { value: "'Nanum Gothic', sans-serif", label: '나눔고딕' },
              { value: "'Georgia', serif", label: 'Georgia (영문)' },
              { value: "'Times New Roman', serif", label: 'Times (영문)' },
            ];
            const isOwner = (() => { const u = getUser(); return u && resume && (u.id === resume.userId || u.role === 'admin' || u.role === 'superadmin'); })();
            if (!isOwner) return null;
            return (
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-3 flex flex-wrap items-center gap-3">
                {/* Color presets */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 mr-0.5">색상</span>
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c.hex || 'default'}
                      onClick={() => setCustomAccentHex(c.hex)}
                      title={c.label}
                      className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
                        customAccentHex === c.hex ? 'border-slate-900 dark:border-slate-100 scale-110' : 'border-transparent'
                      }`}
                      style={{ background: c.hex || '#94a3b8' }}
                    />
                  ))}
                  <label className="flex items-center gap-1 cursor-pointer" title="직접 색상 선택">
                    <input
                      type="color"
                      value={customAccentHex || '#6366f1'}
                      onChange={e => setCustomAccentHex(e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer border border-slate-200 p-0 overflow-hidden"
                      style={{ padding: '1px' }}
                    />
                    <span className="text-[10px] text-slate-400">커스텀</span>
                  </label>
                  {customAccentHex && (
                    <button
                      onClick={() => setCustomAccentHex('')}
                      className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                    >
                      초기화
                    </button>
                  )}
                </div>
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                {/* Font selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400">폰트</span>
                  <select
                    value={customFont}
                    onChange={e => setCustomFont(e.target.value)}
                    className="text-[11px] px-2 py-0.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 focus:ring-1 focus:ring-blue-400"
                  >
                    {FONTS.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })()}

          {/* Reading time indicator — mobile only (inline in toolbar) */}
          <div className="sm:hidden max-w-6xl mx-auto px-4 pb-2 flex items-center gap-2">
            <span className="text-[11px] text-slate-400">읽는 시간: ~{readingMinutes}분</span>
          </div>
        </div>

        <div className="py-6 sm:py-8 px-4">
          <div className="max-w-[210mm] mx-auto mb-4 no-print space-y-4">
            {/* Mobile share stats */}
            <div className="sm:hidden">
              <ShareStats viewCount={resume.viewCount} />
            </div>

            {/* Public link customization */}
            {(() => {
              const currentUser = getUser();
              const isOwner = currentUser && resume.userId && currentUser.id === resume.userId;
              if (!isOwner && resume.userId) return null;
              return (
                <PublicLinkSettings
                  resumeId={id!}
                  currentSlug={resume.slug}
                  ownerName={resume.personalInfo.name}
                  onSlugUpdated={(newSlug) => setResume(prev => prev ? { ...prev, slug: newSlug } : prev)}
                />
              );
            })()}

            <CompletenessBar resume={resume} />
            <ResumeAuditPanel resume={resume} />
            <Suspense fallback={<div className="h-24 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl" />}>
              <ResumeScoreboard resume={resume} />
              <SalaryEstimate resume={resume} />
              <AtsScorePanel resume={resume} />
              <SimilarityPanel resume={resume} />
              <ResumeChecklist resume={resume} />
              <TransformHistory resumeId={id!} />
              <ResumeTrend resumeId={id!} />
              <SkillChart resume={resume} />
              <AchievementBadges resume={resume} />
              <ProjectShowcase resume={resume} />
            </Suspense>
            <CareerTimeline resume={resume} />
            <CareerPathSuggestion resume={resume} />
            <SimilarResumes resume={resume} />
            <KeywordAnalysis resume={resume} />
            <AttachmentList resumeId={id!} />
            <ResumeAnalytics resumeId={id!} />
          </div>
          {/* Zoom Controls */}
          <div className="no-print max-w-[210mm] mx-auto mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm px-1.5 py-1">
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= ZOOM_LEVELS[0]}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
                aria-label="축소"
                title="축소"
              >
                <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <select
                value={fitToWidth ? 'fit' : zoomLevel}
                onChange={e => {
                  if (e.target.value === 'fit') {
                    setFitToWidth(true);
                  } else {
                    setFitToWidth(false);
                    setZoomLevel(Number(e.target.value));
                  }
                }}
                className="text-xs font-medium text-slate-700 dark:text-slate-300 bg-transparent border-none focus:ring-0 cursor-pointer px-1 py-0.5 text-center"
                aria-label="확대 비율"
              >
                {ZOOM_LEVELS.map(z => (
                  <option key={z} value={z}>{z}%</option>
                ))}
                <option value="fit">맞춤</option>
              </select>
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
                aria-label="확대"
                title="확대"
              >
                <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleFitToWidth}
                className={`p-1.5 rounded-lg border transition-colors text-xs font-medium ${
                  fitToWidth
                    ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-400'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                }`}
                aria-label="너비 맞춤"
                title="너비에 맞추기"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
              <button
                onClick={handleFullscreen}
                className="p-1.5 rounded-lg border bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 transition-colors"
                aria-label={isFullscreen ? '전체화면 종료' : '전체화면'}
                title={isFullscreen ? '전체화면 종료' : '전체화면'}
              >
                {isFullscreen ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Preview with zoom */}
          <div
            ref={previewWrapperRef}
            className={`relative overflow-auto ${isFullscreen ? 'bg-slate-100 dark:bg-slate-900 p-8' : ''}`}
          >
            <div
              className="origin-top-left transition-transform duration-200"
              style={{
                transform: fitToWidth ? undefined : `scale(${zoomLevel / 100})`,
                width: fitToWidth ? '100%' : `${10000 / zoomLevel}%`,
              }}
            >
              <ResumePreview
                ref={contentRef}
                resume={resume}
                themeId={themeId}
                customAccentHex={customAccentHex || undefined}
                customFont={customFont || undefined}
              />
              {resume.skills.length > 0 && (
                <SkillEndorsement resumeId={id!} skills={resume.skills} />
              )}
            </div>
            {/* Page break indicators */}
            {!fitToWidth && zoomLevel >= 100 && (
              <div className="no-print absolute inset-0 pointer-events-none" aria-hidden="true">
                {/* A4 page height ~297mm, show indicator every 297mm * (zoomLevel/100) */}
                {[1, 2, 3].map(page => (
                  <div
                    key={page}
                    className="absolute left-0 right-0 border-t-2 border-dashed border-red-300/60"
                    style={{ top: `${page * 297 * (zoomLevel / 100) * (96 / 25.4)}px` }}
                  >
                    <span className="absolute right-2 -top-4 text-[10px] text-red-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded-full border border-red-200 shadow-sm">
                      {page}쪽 끝
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="max-w-[210mm] mx-auto mt-3 px-1">
            <ResumeStats resume={resume} />
          </div>
          <Suspense fallback={<div className="max-w-[210mm] mx-auto mt-6 h-32 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl" />}>
            <div className="max-w-[210mm] mx-auto mt-6">
              <CommentSection resumeId={id!} isPublic={resume.visibility === 'public'} />
            </div>
          </Suspense>
          <AICareerAdvisor resume={resume} />
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
              onClick={() => setShowJdMatch(true)}
              className="flex flex-col items-center gap-0.5 px-2 py-1 text-teal-600 rounded-lg active:bg-teal-50 transition-colors"
            >
              <span className="text-base">🎯</span>
              <span className="text-[10px] font-medium">JD매칭</span>
            </button>
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

      {/* JD Match Analyzer */}
      {showJdMatch && id && resume && (
        <Suspense fallback={null}>
          <JdMatchAnalyzer resumeId={id} resume={resume} onClose={() => setShowJdMatch(false)} />
        </Suspense>
      )}

      {/* AI Analysis Panel */}
      {showAiAnalysis && id && (
        <Suspense fallback={null}>
          <AiAnalysisPanel resumeId={id} onClose={() => setShowAiAnalysis(false)} />
        </Suspense>
      )}

      {/* LLM Transform Panel */}
      {showTransform && id && (
        <Suspense fallback={null}>
          <LlmTransformPanel resumeId={id} onClose={() => setShowTransform(false)} />
        </Suspense>
      )}

      {/* Version Panel */}
      {showVersions && id && (
        <Suspense fallback={null}>
          <VersionPanel
            resumeId={id}
            onClose={() => setShowVersions(false)}
            onRestore={() => { fetchResume(id).then(setResume); }}
          />
        </Suspense>
      )}

      {/* Attachment Panel */}
      {showAttachments && id && (
        <Suspense fallback={null}>
          <AttachmentPanel resumeId={id} onClose={() => setShowAttachments(false)} />
        </Suspense>
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
