import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import Header from '@/components/Header';
import ResumePreview from '@/components/ResumePreview';
import PrintFooter from '@/components/PrintFooter';
import { downloadVCard } from '@/lib/vcard';
import { copySignatureToClipboard } from '@/lib/emailSignature';
import PitchPanel from '@/components/PitchPanel';
import ReadabilityPanel from '@/components/ReadabilityPanel';
import SkillProficiencyPanel from '@/components/SkillProficiencyPanel';
import JdMatchPanel from '@/components/JdMatchPanel';
import KoreanCheckerPanel from '@/components/KoreanCheckerPanel';
import AudioSummaryPanel from '@/components/AudioSummaryPanel';
import NonItAssistantPanel from '@/components/NonItAssistantPanel';
import DocumentEnhancePanel from '@/components/DocumentEnhancePanel';
import PanelSection from '@/components/PanelSection';
import CareerGrowthChart from '@/components/CareerGrowthChart';
import { downloadSocialCard, downloadSocialCardSvg } from '@/lib/socialCard';
import { downloadJsonResume } from '@/lib/jsonResume';
import { copyPlainText, copyMarkdown } from '@/lib/resumeExport';
import { resumeThemes } from '@/lib/resumeThemes';
import CompletenessBar from '@/components/CompletenessBar';
import { ROUTES, withQuery } from '@/lib/routes';

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
import ReportButton from '@/components/ReportButton';
import { updateResume } from '@/lib/api';
import type { Resume } from '@/types/resume';
import { useQueryClient } from '@tanstack/react-query';
import { useResume } from '@/hooks/useResources';
import { getUser } from '@/lib/auth';
import BookmarkButton from '@/components/BookmarkButton';
import FollowButton from '@/components/FollowButton';
import SendMessageButton from '@/components/SendMessageButton';
import QrCodeModal from '@/components/QrCodeModal';
import { addRecentView } from '@/features/recent-views/model/useRecentViews';
import PublicLinkSettings from '@/components/PublicLinkSettings';
import ShareStats from '@/components/ShareStats';
import ResumeAuditPanel from '@/components/ResumeAuditPanel';
import ResumeScoreCard from '@/components/ResumeScoreCard';

/** Map theme accentColor to Tailwind classes */
const accentColorMap: Record<
  string,
  { dot: string; ring: string; bgLight: string; border: string }
> = {
  blue: {
    dot: 'bg-blue-500',
    ring: 'ring-blue-400',
    bgLight: 'bg-blue-50',
    border: 'border-blue-400',
  },
  slate: {
    dot: 'bg-slate-500',
    ring: 'ring-slate-400',
    bgLight: 'bg-slate-50',
    border: 'border-slate-400',
  },
  purple: {
    // Legacy theme key — remapped to sapphire per Impeccable palette
    dot: 'bg-sky-600',
    ring: 'ring-sky-400',
    bgLight: 'bg-sky-50',
    border: 'border-sky-400',
  },
  indigo: {
    dot: 'bg-sky-500',
    ring: 'ring-sky-400',
    bgLight: 'bg-sky-50',
    border: 'border-sky-400',
  },
  green: {
    dot: 'bg-green-500',
    ring: 'ring-green-400',
    bgLight: 'bg-green-50',
    border: 'border-green-400',
  },
  amber: {
    dot: 'bg-amber-500',
    ring: 'ring-amber-400',
    bgLight: 'bg-amber-50',
    border: 'border-amber-400',
  },
};

/** Estimate reading time for Korean resume content (~200 words/min) */
function estimateReadingMinutes(resume: Resume): number {
  const parts: string[] = [];
  const {
    personalInfo,
    experiences,
    educations,
    skills,
    projects,
    certifications,
    languages,
    awards,
    activities,
  } = resume;
  if (personalInfo.name) parts.push(personalInfo.name);
  if (personalInfo.email) parts.push(personalInfo.email);
  if (personalInfo.phone) parts.push(personalInfo.phone);
  if (personalInfo.summary) parts.push(personalInfo.summary);
  experiences.forEach((e) => {
    parts.push(e.company, e.position, e.description ?? '');
  });
  educations.forEach((e) => {
    parts.push(e.school, e.degree, e.field ?? '');
  });
  skills.forEach((s) => {
    parts.push(s.category, s.items);
  });
  projects.forEach((p) => {
    parts.push(p.name, p.description ?? '');
  });
  certifications.forEach((c) => {
    parts.push(c.name);
  });
  languages.forEach((l) => {
    parts.push(l.name);
  });
  awards.forEach((a) => {
    parts.push(a.name, a.description ?? '');
  });
  activities.forEach((a) => {
    parts.push(a.name, a.description ?? '');
  });
  const totalChars = parts.join(' ').length;
  // Korean: ~2 chars/word on average => chars/2 = word count => /200 = minutes
  const minutes = Math.max(1, Math.ceil(totalChars / 2 / 200));
  return minutes;
}

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: resumeData, error: resumeError } = useResume(id);
  const resume: Resume | null = (resumeData as Resume | undefined) ?? null;
  const notFound = !!resumeError;
  const setResume = (r: Resume | ((prev: Resume | null) => Resume | null) | null) => {
    queryClient.setQueryData(['resume', id], typeof r === 'function' ? r(resume) : r);
  };
  // setNotFound handled by query error state
  const [showTransform, setShowTransform] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [showJdMatch, setShowJdMatch] = useState(false);
  const [themeId, setThemeId] = useState('classic');
  const [customAccentHex, setCustomAccentHex] = useState('');

  // 선택된 테마의 accent/header 색상 — 페이지 전체 chrome 에 반영
  const activeTheme = resumeThemes.find((t) => t.id === themeId) ?? resumeThemes[0];
  const themeAccent =
    customAccentHex || activeTheme.preview?.accentBar || activeTheme.preview?.headerBg || '#2563eb';
  const themeHeaderBg = activeTheme.preview?.headerBg || '#f8fafc';
  const themeCategory = activeTheme.preview?.category || 'basic';

  // Site-wide theme propagation — PreviewPage 진입 시 <html> 에 data 속성 + CSS 변수
  // 부여해 Header / Footer / 모든 인접 chrome 까지 테마 색이 미치도록 한다 (드라마틱 시각 변화).
  // unmount 또는 다른 페이지 이동 시 정리.
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('data-active-resume-theme', themeCategory || 'basic');
    html.style.setProperty('--active-theme-accent', themeAccent);
    html.style.setProperty('--active-theme-header-bg', themeHeaderBg);
    return () => {
      html.removeAttribute('data-active-resume-theme');
      html.style.removeProperty('--active-theme-accent');
      html.style.removeProperty('--active-theme-header-bg');
    };
  }, [themeAccent, themeHeaderBg, themeCategory]);
  const [customFont, setCustomFont] = useState('');
  const [showQr, setShowQr] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showScoreCard, setShowScoreCard] = useState(false);
  const [printPreparing, setPrintPreparing] = useState(false);
  // Zoom controls
  const ZOOM_LEVELS = [75, 100, 125, 150] as const;
  const [zoomLevel, setZoomLevel] = useState(100);
  // 모바일에서는 기본값이 fit-to-width — 210mm 이력서가 375px 뷰포트 넘어 가로 스크롤 유발하던 문제 해결
  const [fitToWidth, setFitToWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const previewWrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  const reactToPrint = useReactToPrint({
    contentRef,
    documentTitle: resume
      ? `${resume.personalInfo?.name || resume.title || '이력서'}_${new Date().toISOString().slice(0, 10)}`
      : '이력서',
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
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'noopener',
    );
    setShowShareMenu(false);
  }, [shareUrl]);

  const handleShareKakao = useCallback(() => {
    // Fallback: copy link and guide user
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast('링크가 복사되었습니다. 카카오톡에서 붙여넣기 해주세요.', 'info');
    });
    setShowShareMenu(false);
  }, [shareUrl]);

  const readingMinutes = useMemo(() => (resume ? estimateReadingMinutes(resume) : 0), [resume]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setFitToWidth(false);
    setZoomLevel((prev) => {
      const idx = ZOOM_LEVELS.indexOf(prev as (typeof ZOOM_LEVELS)[number]);
      if (idx >= 0 && idx < ZOOM_LEVELS.length - 1) return ZOOM_LEVELS[idx + 1];
      return prev;
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setFitToWidth(false);
    setZoomLevel((prev) => {
      const idx = ZOOM_LEVELS.indexOf(prev as (typeof ZOOM_LEVELS)[number]);
      if (idx > 0) return ZOOM_LEVELS[idx - 1];
      return prev;
    });
  }, []);

  const handleFitToWidth = useCallback(() => {
    setFitToWidth((prev) => !prev);
  }, []);

  const handleFullscreen = useCallback(() => {
    if (!previewWrapperRef.current) return;
    if (!document.fullscreenElement) {
      previewWrapperRef.current
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
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
    queryClient.invalidateQueries({ queryKey: ['resume', id] });
  };

  useEffect(() => {
    if (resume) addRecentView(resume.id, resume.title || '이력서', resume.personalInfo?.name);
  }, [resume?.id]);

  useEffect(() => {
    if (resume) {
      const name = resume.personalInfo.name || resume.title || '이력서';
      const desc = (resume.personalInfo.summary || '').replace(/<[^>]*>/g, '').slice(0, 150);
      document.title = `${name} — 이력서공방`;

      const setMeta = (property: string, content: string) => {
        let tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
        if (!tag) {
          tag = document.createElement('meta');
          tag.setAttribute('property', property);
          document.head.appendChild(tag);
        }
        tag.content = content;
      };
      setMeta('og:title', `${name} — 이력서공방`);
      setMeta('og:description', desc || 'AI 기반 이력서 관리 플랫폼');
      setMeta('og:url', window.location.href);
      setMeta('og:type', 'profile');
    }
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, [resume]);

  if (notFound) {
    return (
      <>
        <Header />
        <main id="main-content" className="flex-1 flex items-center justify-center" role="main">
          <div className="empty-delight animate-in fade-in-0 zoom-in-95 duration-300">
            <span className="empty-icon" aria-hidden="true">
              🔎
            </span>
            <p className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              이력서를 불러올 수 없습니다
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              서버가 시작 중이거나 일시적 오류일 수 있어요
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={loadResume}
                className="imp-btn px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors focus-ring-accent"
              >
                다시 시도
              </button>
              <button
                onClick={() => navigate(ROUTES.home)}
                className="imp-btn px-5 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-ring-accent"
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
              {[1, 2, 3].map((i) => (
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
      <main
        id="main-content"
        className="flex-1 pb-20 sm:pb-0 animate-in fade-in-0 duration-300"
        role="main"
        data-theme-category={themeCategory}
        style={
          {
            '--preview-theme-accent': themeAccent,
            '--preview-theme-header-bg': themeHeaderBg,
          } as React.CSSProperties
        }
      >
        {/* 테마 반영 최상단 accent bar — 템플릿 변경 즉시 시각적 피드백 */}
        <div
          key={themeId}
          aria-hidden
          className="no-print sticky top-[104px] sm:top-[116px] z-30 h-1.5 w-full transition-all duration-500 animate-in fade-in-0"
          style={{
            background: `linear-gradient(to right, ${themeAccent}, ${themeAccent}99, ${themeAccent}33)`,
          }}
        />
        {/* Toolbar — hidden on mobile (actions moved to sticky bottom bar) */}
        <div className="no-print sticky top-14 sm:top-16 z-40 bg-white/80 border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => navigate(ROUTES.home)}
                className="text-sm text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                aria-label="목록으로"
              >
                &larr; <span className="hidden sm:inline">목록</span>
              </button>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <button
                onClick={() => id && navigate(ROUTES.resume.edit(id))}
                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                aria-label="편집"
                title="편집"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
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
            <div className="hidden sm:flex items-center gap-2">
              {/* Primary: AI 기능 */}
              <button
                onClick={() => id && navigate(ROUTES.resume.review(id))}
                className="px-3 py-1.5 bg-orange-600 text-white text-xs font-medium rounded-lg hover:bg-orange-700 transition-colors"
              >
                리뷰
              </button>
              <button
                onClick={() => setShowAiAnalysis(true)}
                className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors"
              >
                AI 분석
              </button>
              <button
                onClick={() => setShowJdMatch(true)}
                className="px-3 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700 transition-colors"
              >
                JD 매칭
              </button>
              <button
                onClick={() => id && navigate(ROUTES.coverLetter.new(id))}
                className="px-3 py-1.5 bg-sky-700 text-white text-xs font-medium rounded-lg hover:bg-sky-700 transition-colors"
                title="이 이력서를 기반으로 자소서 작성"
              >
                자소서
              </button>
              <button
                onClick={() => id && navigate(withQuery(ROUTES.interview.prep, { resumeId: id }))}
                className="px-3 py-1.5 bg-cyan-700 text-white text-xs font-medium rounded-lg hover:bg-cyan-800 transition-colors"
                title="이 이력서 기반 면접 준비"
              >
                면접준비
              </button>
              <button
                onClick={() => setShowScoreCard(true)}
                className="px-3 py-1.5 bg-sky-700 text-white text-xs font-medium rounded-lg hover:bg-sky-800 transition-colors"
                title="점수 공유 카드"
              >
                점수 공유
              </button>
              <button
                onClick={() => setShowTransform(true)}
                className="px-3 py-1.5 bg-slate-700 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors"
              >
                변환
              </button>
              <button
                onClick={handlePrint}
                disabled={printPreparing}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-70 transition-colors"
              >
                {printPreparing ? '준비 중...' : 'PDF'}
              </button>

              {/* Secondary: 더보기 드롭다운 */}
              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu((v) => !v)}
                  className="px-2.5 py-1.5 text-slate-600 bg-slate-100 text-xs font-medium rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1"
                >
                  더보기
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {showMoreMenu && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 py-1 animate-scale-in">
                    <button
                      onClick={() => {
                        handleCopyLink();
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"
                        />
                      </svg>
                      링크 복사
                    </button>
                    <button
                      onClick={() => {
                        setShowShareMenu(true);
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.684 13.342a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316"
                        />
                      </svg>
                      SNS 공유
                    </button>
                    <button
                      onClick={() => {
                        setShowQr(true);
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                        />
                      </svg>
                      QR 코드
                    </button>
                    <button
                      onClick={() => {
                        downloadVCard(resume);
                        setShowMoreMenu(false);
                        toast('연락처(.vcf) 다운로드 완료', 'success');
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                      title="연락처를 주소록에 바로 추가할 수 있는 vCard 파일 다운로드"
                    >
                      <svg
                        className="w-4 h-4 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      연락처 저장 (vCard)
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await copySignatureToClipboard(resume, {
                            shareUrl: window.location.href,
                            accent: themeAccent,
                          });
                          toast('이메일 서명 복사됨 — Gmail/Outlook 에 붙여넣기', 'success');
                        } catch {
                          toast('복사 실패 — 브라우저 권한 확인', 'error');
                        }
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                      title="이메일 서명을 HTML 로 클립보드에 복사"
                    >
                      <svg
                        className="w-4 h-4 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      이메일 서명 복사
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await downloadSocialCard(resume, {
                            shareUrl: window.location.href,
                            accent: themeAccent,
                          });
                          toast('공유 카드(PNG) 다운로드 완료', 'success');
                        } catch {
                          toast('카드 생성 실패 — SVG 다운로드로 대체', 'error');
                          downloadSocialCardSvg(resume, {
                            shareUrl: window.location.href,
                            accent: themeAccent,
                          });
                        }
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                      title="카카오·슬랙 공유용 1200×630 PNG 카드 다운로드"
                    >
                      <svg
                        className="w-4 h-4 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      공유 카드 이미지 저장
                    </button>
                    <button
                      onClick={() => {
                        downloadJsonResume(resume, { canonical: window.location.href });
                        toast('JSON Resume (.json) 다운로드 완료', 'success');
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                      title="jsonresume.org 표준 포맷으로 내보내기 (다른 툴 임포트 가능)"
                    >
                      <svg
                        className="w-4 h-4 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                        />
                      </svg>
                      JSON Resume 표준 내보내기
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await copyPlainText(resume);
                          toast('ATS-friendly 텍스트 복사됨', 'success');
                        } catch {
                          toast('복사 실패', 'error');
                        }
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                      title="포맷 제거된 plain text — ATS 파서 친화적"
                    >
                      <svg
                        className="w-4 h-4 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 10h16M4 14h10M4 18h10"
                        />
                      </svg>
                      Plain Text 복사 (ATS)
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await copyMarkdown(resume);
                          toast('Markdown 복사됨 — GitHub README/Notion 에 붙여넣기', 'success');
                        } catch {
                          toast('복사 실패', 'error');
                        }
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                      title="GitHub README / dev.to / Notion 용 Markdown 복사"
                    >
                      <svg
                        className="w-4 h-4 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 20H5a2 2 0 01-2-2V6a2 2 0 012-2h5m5 0h4a2 2 0 012 2v12a2 2 0 01-2 2h-4m-5-5l4-4m0 0l-4-4m4 4H9"
                        />
                      </svg>
                      Markdown 복사
                    </button>
                    <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                    <button
                      onClick={() => {
                        setShowAttachments(true);
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                      </svg>
                      첨부파일
                    </button>
                    <button
                      onClick={() => {
                        setShowVersions(true);
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      버전 관리
                    </button>
                  </div>
                )}
              </div>

              {/* Bookmark & Social */}
              {resume.visibility === 'public' && <BookmarkButton resumeId={id!} />}
              {(() => {
                const currentUser = getUser();
                const isOtherUser =
                  currentUser && resume.userId && currentUser.id !== resume.userId;
                if (!isOtherUser) return null;
                return (
                  <>
                    <FollowButton userId={resume.userId!} />
                    <SendMessageButton
                      userId={resume.userId!}
                      userName={resume.personalInfo.name || '사용자'}
                    />
                    {resume.visibility === 'public' && (
                      <ReportButton endpoint={`/api/resumes/${id!}/report`} targetLabel="이력서" />
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          {/* Theme selector — visual thumbnail strip */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none">
            {resumeThemes.map((t) => {
              const currentUser = getUser();
              const isAdminUser =
                currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
              const locked =
                t.premium && !isAdminUser && (!currentUser?.plan || currentUser.plan === 'free');
              const colors = accentColorMap[t.accentColor] || accentColorMap.slate;
              const isSelected = themeId === t.id;
              const hasColorHeader =
                t.headerStyle.includes('bg-gradient') ||
                t.headerStyle.includes('bg-[') ||
                t.headerStyle.includes('bg-slate-900');

              return (
                <button
                  key={t.id}
                  onClick={() => {
                    if (locked) return;
                    setThemeId(t.id);
                    toast(`테마: ${t.name}`, 'success');
                  }}
                  disabled={locked}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all duration-200 border-2 focus-ring-accent ${
                    locked
                      ? 'opacity-40 cursor-not-allowed border-transparent'
                      : isSelected
                        ? `border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-sm ring-1 ${colors.ring} scale-[1.02]`
                        : 'border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:-translate-y-0.5'
                  }`}
                  title={locked ? '프로 플랜 전용' : t.description}
                  aria-pressed={isSelected}
                >
                  {/* Mini preview swatch */}
                  <div className="w-14 h-10 rounded-md overflow-hidden border border-slate-200 bg-white relative">
                    {/* Header bar preview */}
                    <div
                      className={`h-3.5 w-full ${
                        hasColorHeader
                          ? t.headerStyle.includes('from-purple')
                            ? 'bg-gradient-to-r from-blue-500 via-cyan-400 to-sky-400'
                            : t.headerStyle.includes('from-indigo')
                              ? 'bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-400'
                              : t.headerStyle.includes('from-pink')
                                ? 'bg-gradient-to-r from-sky-200 via-blue-200 to-cyan-200'
                                : t.headerStyle.includes('bg-[#0d1117]')
                                  ? 'bg-[#0d1117]'
                                  : t.headerStyle.includes('bg-[#1a1a2e]')
                                    ? 'bg-[#1a1a2e]'
                                    : t.headerStyle.includes('bg-slate-900')
                                      ? 'bg-slate-800'
                                      : colors.dot
                          : colors.bgLight
                      }`}
                    />
                    {/* Body lines preview */}
                    <div className="px-1.5 pt-1 space-y-0.5">
                      <div className={`h-0.5 w-full rounded-full ${colors.dot} opacity-60`} />
                      <div className="h-0.5 w-3/4 rounded-full bg-slate-200" />
                      <div className="h-0.5 w-5/6 rounded-full bg-slate-200" />
                    </div>
                    {/* Accent dot */}
                    <div
                      className={`absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${colors.dot}`}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                    <span
                      className={`text-[10px] leading-none whitespace-nowrap ${isSelected ? 'font-semibold text-blue-700' : 'text-slate-500'}`}
                    >
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
            const isOwner = (() => {
              const u = getUser();
              return (
                u &&
                resume &&
                (u.id === resume.userId || u.role === 'admin' || u.role === 'superadmin')
              );
            })();
            if (!isOwner) return null;
            return (
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-3 flex flex-wrap items-center gap-3">
                {/* Color presets */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 mr-0.5">색상</span>
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.hex || 'default'}
                      onClick={() => setCustomAccentHex(c.hex)}
                      title={c.label}
                      className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
                        customAccentHex === c.hex
                          ? 'border-slate-900 dark:border-slate-100 scale-110'
                          : 'border-transparent'
                      }`}
                      style={{ background: c.hex || '#94a3b8' }}
                    />
                  ))}
                  <label className="flex items-center gap-1 cursor-pointer" title="직접 색상 선택">
                    <input
                      type="color"
                      value={customAccentHex || '#6366f1'}
                      onChange={(e) => setCustomAccentHex(e.target.value)}
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
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">폰트</span>
                  <select
                    value={customFont}
                    onChange={(e) => setCustomFont(e.target.value)}
                    className="text-[11px] px-2 py-0.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 focus:ring-1 focus:ring-blue-400"
                  >
                    {FONTS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
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
                  onSlugUpdated={(newSlug) =>
                    setResume((prev) => (prev ? { ...prev, slug: newSlug } : prev))
                  }
                />
              );
            })()}

            <CompletenessBar resume={resume} />

            {/* ─── 섹션 1: 이력서 완성도 / 품질 ──────────────────────── */}
            <PanelSection
              title="이력서 완성도"
              subtitle="AI 점수·감사·체크리스트 — 이력서 기본기 점검"
              icon="📊"
            >
              <ResumeAuditPanel resume={resume} />
              <ReadabilityPanel resume={resume} />
              <KoreanCheckerPanel
                resume={resume}
                resumeId={id}
                onApplyFix={async (fixed) => {
                  if (!id) return;
                  const { id: _omit, createdAt: _c, updatedAt: _u, ...payload } = fixed;
                  void _omit;
                  void _c;
                  void _u;
                  await updateResume(id, payload as any);
                  setResume(fixed);
                }}
              />
              <Suspense
                fallback={
                  <div className="imp-card h-12 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl" />
                }
              >
                <ResumeScoreboard resume={resume} />
                <AtsScorePanel resume={resume} />
                <ResumeChecklist resume={resume} />
              </Suspense>
            </PanelSection>

            {/* ─── 섹션 2: AI 도구 ────────────────────────────────── */}
            <PanelSection
              title="AI 어시스턴트"
              subtitle="자동 생성·변환·분석 — 외부 문서 병합, 한줄소개, JD 매칭"
              icon="✨"
            >
              <PitchPanel resume={resume} />
              <DocumentEnhancePanel
                resumeId={id!}
                resume={resume}
                onApplied={(r) => setResume(r)}
              />
              <JdMatchPanel resume={resume} />
              <NonItAssistantPanel resume={resume} />
              <AudioSummaryPanel resume={resume} />
            </PanelSection>

            {/* ─── 섹션 3: 경력 인사이트 ─────────────────────────── */}
            <PanelSection
              title="경력 인사이트"
              subtitle="성장 추이·스킬 레이더·유사 이력서"
              icon="📈"
            >
              <SkillProficiencyPanel resume={resume} />
              <CareerGrowthChart resume={resume} />
              <CareerTimeline resume={resume} />
              <CareerPathSuggestion resume={resume} />
              <Suspense
                fallback={
                  <div className="imp-card h-12 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl" />
                }
              >
                <SkillChart resume={resume} />
                <SimilarityPanel resume={resume} />
                <AchievementBadges resume={resume} />
                <ProjectShowcase resume={resume} />
                <SalaryEstimate resume={resume} />
              </Suspense>
              <SimilarResumes resume={resume} />
              <KeywordAnalysis resume={resume} />
            </PanelSection>

            {/* ─── 섹션 4: 기록·첨부 ─────────────────────────────── */}
            <PanelSection title="기록·첨부" subtitle="변환 이력·트렌드·첨부파일" icon="📁">
              <Suspense
                fallback={
                  <div className="imp-card h-12 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl" />
                }
              >
                <TransformHistory resumeId={id!} />
                <ResumeTrend resumeId={id!} />
              </Suspense>
              <AttachmentList resumeId={id!} />
              <ResumeAnalytics resumeId={id!} />
            </PanelSection>
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
                <svg
                  className="w-4 h-4 text-slate-600 dark:text-slate-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <select
                value={fitToWidth ? 'fit' : zoomLevel}
                onChange={(e) => {
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
                {ZOOM_LEVELS.map((z) => (
                  <option key={z} value={z}>
                    {z}%
                  </option>
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
                <svg
                  className="w-4 h-4 text-slate-600 dark:text-slate-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleFitToWidth}
                data-resume-toolbar-active={fitToWidth ? 'true' : 'false'}
                className={`p-1.5 rounded-lg border transition-colors text-xs font-medium ${
                  fitToWidth
                    ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-400'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                }`}
                aria-label="너비 맞춤"
                title="너비에 맞추기"
              >
                {/* horizontal double arrow — fit-to-width 의미 (좌우 양방향) */}
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
                    d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                  />
                </svg>
              </button>
              <button
                onClick={handleFullscreen}
                className="p-1.5 rounded-lg border bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 transition-colors"
                aria-label={isFullscreen ? '전체화면 종료' : '전체화면'}
                title={isFullscreen ? '전체화면 종료' : '전체화면'}
              >
                {isFullscreen ? (
                  /* arrows-pointing-in — 4-corner inward (전체화면 종료) */
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
                      d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25"
                    />
                  </svg>
                ) : (
                  /* arrows-pointing-out — 4-corner outward (전체화면 진입) */
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
                      d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                    />
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
              <div ref={contentRef}>
                <ResumePreview
                  resume={resume}
                  themeId={themeId}
                  customAccentHex={customAccentHex || undefined}
                  customFont={customFont || undefined}
                />
                {/* 인쇄 전용: 하단에 QR + Career DNA 핑거프린트 자동 삽입 */}
                <PrintFooter resume={resume} />
              </div>
            </div>
            {resume.skills.length > 0 && (
              <div className="max-w-[210mm] mx-auto px-1">
                <SkillEndorsement resumeId={id!} skills={resume.skills} />
              </div>
            )}
            {/* Page break indicators */}
            {!fitToWidth && zoomLevel >= 100 && (
              <div className="no-print absolute inset-0 pointer-events-none" aria-hidden="true">
                {/* A4 page height ~297mm, show indicator every 297mm * (zoomLevel/100) */}
                {[1, 2, 3].map((page) => (
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
          <Suspense
            fallback={
              <div className="max-w-[210mm] mx-auto mt-6 h-32 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl" />
            }
          >
            <div className="max-w-[210mm] mx-auto mt-6">
              <CommentSection resumeId={id!} isPublic={resume.visibility === 'public'} />
            </div>
          </Suspense>
          <AICareerAdvisor resume={resume} />
        </div>

        {/* Sticky bottom action bar — mobile only */}
        <div className="sm:hidden no-print fixed bottom-0 left-0 right-0 z-50 bg-white/95 border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-around px-2 py-2 gap-1">
            <div className="relative" ref={shareMenuRef}>
              <button
                onClick={() => setShowShareMenu((v) => !v)}
                className="flex flex-col items-center gap-0.5 px-2 py-1 text-slate-600 rounded-lg active:bg-slate-100 transition-colors"
              >
                <span className="text-base">🔗</span>
                <span className="text-[10px]">공유</span>
              </button>
              {showShareMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-44 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg z-50">
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-t-xl"
                  >
                    🔗 링크 복사
                  </button>
                  <button
                    onClick={handleShareKakao}
                    className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    💬 KakaoTalk
                  </button>
                  <button
                    onClick={handleShareLinkedIn}
                    className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    💼 LinkedIn
                  </button>
                  <button
                    onClick={handleShareEmail}
                    className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-b-xl"
                  >
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
              className="flex flex-col items-center gap-0.5 px-2 py-1 text-slate-700 rounded-lg active:bg-slate-100 transition-colors"
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
            onRestore={() => {
              queryClient.invalidateQueries({ queryKey: ['resume', id] });
            }}
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

      {showScoreCard && resume && (
        <ResumeScoreCard resume={resume} onClose={() => setShowScoreCard(false)} />
      )}

      {/* Print preparing overlay */}
      {printPreparing && (
        <div className="fixed inset-0 z-[9999] bg-white/80 flex items-center justify-center no-print">
          <div className="bg-white rounded-2xl shadow-xl px-8 py-6 flex flex-col items-center gap-3 border border-slate-200">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-700">인쇄 준비 중...</p>
          </div>
        </div>
      )}
    </>
  );
}
