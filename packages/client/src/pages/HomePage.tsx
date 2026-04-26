import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import { useScrollRevealAll } from '@/hooks/useScrollReveal';
import { CardGridSkeleton } from '@/components/Skeleton';
import { toast } from '@/components/Toast';
import QuickImportModal from '@/components/QuickImportModal';
import Footer from '@/components/Footer';
import { timeAgo } from '@/lib/time';
import { ROUTES, withQuery } from '@/lib/routes';
import type { ResumeSummary, Tag, Resume } from '@/types/resume';
import {
  deleteResume,
  duplicateResume,
  fetchResume,
  fetchStudyGroups,
  fetchJobInterviewQuestions,
  type StudyGroup,
  type JobInterviewQuestion,
} from '@/lib/api';
import {
  useResumes,
  useTags,
  useBookmarks,
  useSystemContent,
  useSiteStatsPublic,
  usePublicGet,
} from '@/hooks/useResources';
import ResumeThumbnail from '@/components/ResumeThumbnail';
import DashboardStats from '@/components/DashboardStats';
import ProfileViewers from '@/components/ProfileViewers';
import NetworkStats from '@/components/NetworkStats';
import RecentActivity from '@/components/RecentActivity';
import HiringTrends from '@/components/HiringTrends';
import CareerInsights from '@/components/CareerInsights';
import OnboardingBanner from '@/components/OnboardingBanner';
import ProfileCompleteness from '@/components/ProfileCompleteness';
import ProfileWizard from '@/components/ProfileWizard';
import ResumeHealthRing from '@/widgets/resume-health-ring';
import InterviewRoulette from '@/widgets/interview-roulette';
import CareerLevel from '@/widgets/career-level';
import { ResumeHealthBoost } from '@/widgets/resume-health-boost';
const BannerSlider = lazy(() => import('@/components/BannerSlider'));
import NoticePopup from '@/components/NoticePopup';
import WhatsNewModal from '@/components/WhatsNewModal';
import { t, tx } from '@/lib/i18n';
import { getUser } from '@/lib/auth';
import ShareMenu from '@/components/ShareMenu';

interface HomeContent {
  highlights?: { title: string; desc: string; bg: string }[];
  features?: { icon: string; title: string; desc: string; color: string }[];
  testimonials?: { text: string; author: string; stars: number }[];
  socialProofTitle?: string;
}

const DEFAULT_HIGHLIGHTS = [
  {
    title: 'AI 분석 5종 세트',
    desc: 'ATS 통과율 검사, JD 매칭도 분석, 예상 면접 질문까지 - 서류 합격률을 높이는 데이터 기반 인사이트',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    title: '26개 직종별 템플릿',
    desc: '개발자, 디자이너, 마케터 등 직종에 최적화된 레이아웃과 15종 테마로 프로페셔널한 이력서 완성',
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
  },
  {
    title: '완전 무료로 시작',
    desc: '오픈소스 LLM 활용으로 비용 부담 없이 시작하세요. 핵심 기능 모두 무료, 숨겨진 비용 없음',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
];

const DEFAULT_FEATURES = [
  {
    icon: '✨',
    title: 'AI 이력서 작성',
    desc: '직종별 최적화된 문구를 AI가 자동 생성',
    color: 'from-blue-500 to-sky-600',
  },
  {
    icon: '📊',
    title: 'ATS 점수 분석',
    desc: '채용 시스템 호환성을 실시간으로 분석',
    color: 'from-blue-500 to-cyan-600',
  },
  {
    icon: '🎨',
    title: '전문 템플릿',
    desc: '디자이너가 제작한 고품질 이력서 템플릿',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: '🔗',
    title: '이력서 공유',
    desc: '고유 URL로 이력서를 간편하게 공유',
    color: 'from-amber-500 to-orange-600',
  },
  {
    icon: '📧',
    title: '자기소개서',
    desc: 'AI가 회사/포지션에 맞는 자소서 작성',
    color: 'from-sky-500 to-blue-600',
  },
  {
    icon: '📈',
    title: '커리어 분석',
    desc: '업계 트렌드와 연봉 데이터 인사이트',
    color: 'from-cyan-500 to-blue-600',
  },
];

const DEFAULT_TESTIMONIALS = [
  { text: 'AI가 자동으로 써준 이력서로 취업에 성공했어요!', author: '소프트웨어 개발자', stars: 5 },
  { text: '템플릿이 너무 예뻐서 면접관에게 칭찬받았습니다.', author: 'UX 디자이너', stars: 5 },
  { text: 'ATS 분석 기능 덕분에 서류 통과율이 높아졌어요.', author: '마케터', stars: 5 },
];

function CommunityWidget() {
  const { data } = usePublicGet<any>(['home-community'], '/api/community?limit=5&page=1', {
    staleTime: 60_000,
  });
  const posts: {
    id: string;
    title: string;
    category: string;
    likeCount: number;
    createdAt: string;
  }[] = data?.items ? data.items.slice(0, 5) : [];

  if (!posts.length) return null;

  const CAT_COLORS: Record<string, string> = {
    notice: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    free: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    tips: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    resume: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'cover-letter': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    question: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };
  const CAT_LABELS: Record<string, string> = {
    notice: '공지',
    free: '자유',
    tips: '취업팁',
    resume: '이력서피드백',
    'cover-letter': '자소서',
    question: '질문',
  };

  return (
    <div className="mb-6 imp-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <span className="w-5 h-5 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 rounded-md flex items-center justify-center text-xs">
            💬
          </span>
          커뮤니티 최신 글
        </h3>
        <Link
          to={ROUTES.community.list}
          className="text-xs text-sky-700 dark:text-sky-400 hover:underline"
        >
          더보기 →
        </Link>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {posts.map((post) => (
          <Link
            key={post.id}
            to={ROUTES.community.post(post.id)}
            className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <span
              className={`shrink-0 text-xs px-1.5 py-0.5 rounded-md font-medium ${CAT_COLORS[post.category] || CAT_COLORS.free}`}
            >
              {CAT_LABELS[post.category] || '자유'}
            </span>
            <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 truncate">
              {post.title}
            </span>
            <span className="shrink-0 flex items-center gap-1 text-xs text-slate-400">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              {post.likeCount}
            </span>
          </Link>
        ))}
      </div>
      <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-700/30 border-t border-slate-100 dark:border-slate-700">
        <Link
          to={ROUTES.community.write}
          className="text-xs text-sky-700 dark:text-sky-400 hover:underline font-medium"
        >
          + 새 글 작성하기
        </Link>
      </div>
    </div>
  );
}

/* ── 면접 크로스 추천 위젯 (스터디 그룹 + 예상 질문) ─────────────── */
function InterviewDiscoveryWidget() {
  const groupsQuery = useQuery({
    queryKey: ['home-study-groups', { limit: 20 }],
    queryFn: () => fetchStudyGroups({ limit: 20 }),
    staleTime: 60_000,
  });
  const questionsQuery = useQuery({
    queryKey: ['home-job-interview-questions', { limit: 20 }],
    queryFn: () => fetchJobInterviewQuestions({ limit: 20 }),
    staleTime: 60_000,
  });
  const loading = groupsQuery.isLoading || questionsQuery.isLoading;
  const groups: StudyGroup[] = groupsQuery.data
    ? [...groupsQuery.data.items].sort((a, b) => b.memberCount - a.memberCount).slice(0, 5)
    : [];
  const questions: JobInterviewQuestion[] = questionsQuery.data
    ? [...questionsQuery.data]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
    : [];

  if (loading) {
    return (
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="imp-card p-5">
            <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mb-3" />
            <div className="space-y-2">
              {[0, 1, 2].map((j) => (
                <div
                  key={j}
                  className="h-10 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (groups.length === 0 && questions.length === 0) return null;

  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      {groups.length > 0 && (
        <div className="imp-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span className="w-5 h-5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-md flex items-center justify-center text-xs">
                👥
              </span>
              인기 면접 스터디 그룹
            </h3>
            <Link
              to={withQuery(ROUTES.jobs.list, { tab: 'internal' })}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              더보기 →
            </Link>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {groups.map((g) => (
              <li
                key={g.id}
                className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {g.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {g.companyName || '전체'}
                    {g.position ? ` · ${g.position}` : ''}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                  {g.memberCount}/{g.maxMembers}명
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {questions.length > 0 && (
        <div className="imp-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md flex items-center justify-center text-xs">
                💡
              </span>
              최근 생성된 면접 질문
            </h3>
            <Link
              to={ROUTES.interview.prep}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              더보기 →
            </Link>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {questions.map((q) => (
              <li
                key={q.id}
                className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-800 dark:text-slate-200 truncate">
                    {q.question}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {q.companyName}
                    {q.position ? ` · ${q.position}` : ''}
                  </p>
                </div>
                <Link
                  to={withQuery(ROUTES.interview.prep, { position: q.position || '' })}
                  className="shrink-0 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  보기
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ── 주간 지원 목표 위젯 ─────────────────────────────── */
function getWeekKey(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const week = Math.floor((now.getTime() - startOfYear.getTime()) / (7 * 86400000));
  return `${now.getFullYear()}-W${week}`;
}

function WeeklyGoalWidget() {
  const [goal, setGoal] = useState<number>(() => {
    return parseInt(localStorage.getItem('weekly-goal') || '5', 10);
  });
  const [applied, setApplied] = useState<number>(() => {
    const stored = localStorage.getItem(`weekly-applied-${getWeekKey()}`);
    return stored ? parseInt(stored, 10) : 0;
  });
  const [editingGoal, setEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(goal);

  const pct = Math.min(100, Math.round((applied / goal) * 100));
  const r = 28;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;

  const addOne = () => {
    const next = applied + 1;
    setApplied(next);
    localStorage.setItem(`weekly-applied-${getWeekKey()}`, String(next));
  };

  const saveGoal = () => {
    if (tempGoal > 0 && tempGoal <= 50) {
      setGoal(tempGoal);
      localStorage.setItem('weekly-goal', String(tempGoal));
    }
    setEditingGoal(false);
  };

  const goalColor =
    pct >= 100 ? '#10b981' : pct >= 60 ? '#6366f1' : pct >= 30 ? '#f59e0b' : '#ef4444';

  return (
    <div className="mb-6 imp-card p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <span className="text-base">🎯</span> 이번 주 지원 목표
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} 주 기준
          </p>
        </div>
        {editingGoal ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={50}
              value={tempGoal}
              onChange={(e) => setTempGoal(Number(e.target.value))}
              className="w-16 px-2 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveGoal();
                if (e.key === 'Escape') setEditingGoal(false);
              }}
              autoFocus
            />
            <button
              onClick={saveGoal}
              className="text-xs px-2 py-1 bg-sky-700 text-white rounded-lg hover:bg-sky-700"
            >
              저장
            </button>
            <button
              onClick={() => setEditingGoal(false)}
              className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg"
            >
              취소
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setTempGoal(goal);
              setEditingGoal(true);
            }}
            className="text-xs text-slate-400 hover:text-sky-700 dark:hover:text-sky-400 transition-colors"
          >
            목표 변경
          </button>
        )}
      </div>

      <div className="flex items-center gap-5">
        {/* Circular progress */}
        <div className="relative shrink-0">
          <svg width="72" height="72" viewBox="0 0 72 72" className="rotate-[-90deg]">
            <circle
              cx="36"
              cy="36"
              r={r}
              fill="none"
              stroke="rgba(148,163,184,0.2)"
              strokeWidth="6"
            />
            <circle
              cx="36"
              cy="36"
              r={r}
              fill="none"
              stroke={goalColor}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{applied}</span>
            <span className="text-[10px] text-slate-400">/{goal}</span>
          </div>
        </div>

        {/* Info and CTA */}
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            {pct >= 100 ? (
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                🎉 이번 주 목표 달성!
              </p>
            ) : (
              <p className="text-sm text-slate-700 dark:text-slate-300">
                <strong className="text-sky-700 dark:text-sky-400">
                  {Math.max(0, goal - applied)}건
                </strong>{' '}
                더 지원하면 목표 달성!
              </p>
            )}
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{pct}% 진행됨</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addOne}
              className="px-3 py-1.5 text-xs font-medium bg-sky-700 text-white rounded-lg hover:bg-sky-700 transition-colors"
            >
              + 지원 추가
            </button>
            <Link
              to={ROUTES.jobs.applications}
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              지원 관리
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target <= 0) return;
    let start = 0;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      if (current !== start) {
        start = current;
        setValue(current);
      }
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

function AnimatedStat({ value, label }: { value: number; label: string }) {
  const animated = useCountUp(value);
  return (
    <div className="flex flex-col items-center px-4 py-3 imp-card shadow-sm min-w-[100px]">
      <strong className="text-lg font-bold text-slate-800 dark:text-slate-200 tabular-nums">
        {value > 0 ? animated.toLocaleString() : '—'}
      </strong>
      <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</span>
    </div>
  );
}

function SiteStatsBar() {
  const { data: d } = useSiteStatsPublic();
  const stats: { users: number; resumes: number; views: number; templates: number } | null = d
    ? {
        users: d.users.total,
        resumes: d.resumes.total,
        views: d.activity.totalViews,
        templates: d.content.templates,
      }
    : null;

  return (
    <div className="flex flex-wrap justify-center gap-3 mt-8">
      <AnimatedStat value={stats?.users || 0} label="회원" />
      <AnimatedStat value={stats?.resumes || 0} label="이력서" />
      <AnimatedStat value={stats?.views || 0} label="조회" />
      <AnimatedStat value={stats?.templates || 0} label="템플릿" />
    </div>
  );
}

export default function HomePage() {
  const queryClient = useQueryClient();
  const user = getUser();
  const resumesQuery = useResumes(!!user);
  const resumes: ResumeSummary[] = (resumesQuery.data as ResumeSummary[] | undefined) ?? [];
  const tagsQuery = useTags(!!user);
  const tags: (Tag & { resumeCount: number })[] =
    (tagsQuery.data as (Tag & { resumeCount: number })[] | undefined) ?? [];
  const bookmarksQuery = useBookmarks(!!user);
  const bookmarks =
    (bookmarksQuery.data as
      | { id: string; resumeId: string; title: string; name: string }[]
      | undefined) ?? [];
  const loading = !!user && (resumesQuery.isLoading || tagsQuery.isLoading);
  const serverError = !!resumesQuery.error;
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [filterVisibility, setFilterVisibility] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'title' | 'viewCount'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [showImport, setShowImport] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const navigate = useNavigate();

  useScrollRevealAll('.reveal');

  const load = () => {
    queryClient.invalidateQueries({ queryKey: ['resumes'] });
    queryClient.invalidateQueries({ queryKey: ['tags'] });
    queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
  };

  // Load first resume for ProfileWizard
  const firstResumeId = resumes[0]?.id;
  const [wizardResume, setWizardResume] = useState<Resume | null>(null);
  useEffect(() => {
    if (firstResumeId && user) {
      fetchResume(firstResumeId)
        .then(setWizardResume)
        .catch(() => {});
    } else {
      setWizardResume(null);
    }
  }, [firstResumeId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
        window.location.href = '/resumes/new';
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const { data: homeContent = {} } = useSystemContent<HomeContent>('homepage');
  const safeContent: HomeContent = homeContent ?? {};
  const highlights = safeContent.highlights?.length ? safeContent.highlights : DEFAULT_HIGHLIGHTS;
  const features = safeContent.features?.length ? safeContent.features : DEFAULT_FEATURES;
  const testimonials = safeContent.testimonials?.length
    ? safeContent.testimonials
    : DEFAULT_TESTIMONIALS;
  const socialProofTitle = safeContent.socialProofTitle || '이미 수천 명이 선택했습니다';

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title || '제목 없음'}" 이력서를 삭제하시겠습니까?`)) return;
    try {
      await deleteResume(id);
      toast('이력서가 삭제되었습니다', 'success');
      load();
    } catch {
      toast('삭제에 실패했습니다', 'error');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateResume(id);
      toast('이력서가 복제되었습니다', 'success');
      load();
    } catch {
      toast('복제에 실패했습니다', 'error');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((r) => r.id)));
  };

  const handleBulkDelete = async () => {
    if (!confirm(`선택한 ${selectedIds.size}개의 이력서를 삭제하시겠습니까?`)) return;
    for (const id of selectedIds) {
      try {
        await deleteResume(id);
      } catch {}
    }
    toast(`${selectedIds.size}개 이력서가 삭제되었습니다`, 'success');
    setSelectedIds(new Set());
    setSelectMode(false);
    load();
  };

  const filtered = resumes
    .filter((r) => (filterTag ? r.tags?.some((t) => t.id === filterTag) : true))
    .filter((r) => (filterVisibility === 'all' ? true : r.visibility === filterVisibility))
    .filter(
      (r) =>
        !searchQuery ||
        (r.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.personalInfo?.name || '').toLowerCase().includes(searchQuery.toLowerCase()),
    );

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case 'title':
        cmp = (a.title || '').localeCompare(b.title || '', 'ko');
        break;
      case 'viewCount':
        cmp = (a.viewCount || 0) - (b.viewCount || 0);
        break;
      case 'updatedAt':
      default:
        cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
    }
    return sortOrder === 'desc' ? -cmp : cmp;
  });

  if (loading) {
    return (
      <>
        <Header />
        <main
          id="main-content"
          className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
          role="main"
          aria-busy="true"
        >
          <div className="h-8 bg-slate-200 rounded w-48 mb-6 animate-pulse" />
          <CardGridSkeleton count={6} />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <NoticePopup />
      <WhatsNewModal />
      <Header />
      <main
        id="main-content"
        className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-in fade-in-0 slide-in-from-bottom-1 duration-300"
        role="main"
      >
        <Suspense fallback={null}>
          <BannerSlider />
        </Suspense>
        {serverError && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-amber-500 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                서버가 시작 중입니다. 무료 호스팅 특성상 첫 로딩에 30~60초 소요될 수 있습니다.
              </p>
            </div>
            <button
              onClick={() => {
                load();
              }}
              className="shrink-0 px-3 py-1 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-colors"
            >
              재시도
            </button>
          </div>
        )}
        {user && (user.userType === 'recruiter' || user.userType === 'company') && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
            <p className="text-sm text-emerald-800 dark:text-emerald-300">
              🏢 채용 대시보드에서 공고와 스카우트를 관리하세요
            </p>
            <Link
              to={ROUTES.recruiter.dashboard}
              className="shrink-0 px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            >
              대시보드
            </Link>
          </div>
        )}
        {resumes.length === 0 ? (
          <div className="py-10 sm:py-16 animate-fade-in">
            {/* Hero — Editorial typographic. left-aligned, asymmetric, no gradient text or mesh blobs.
                ".impeccable.md" 톤(refined/professional/calm) + 진중한 데이터 신뢰감. */}
            <section
              aria-label="이력서공방 소개"
              className="relative mb-12 sm:mb-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10"
            >
              {/* main column — 헤드라인 + 카피 + CTA */}
              <div className="lg:col-span-8">
                <div className="inline-flex items-center gap-2 mb-6 sm:mb-8 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700 dark:text-slate-300">
                  <span className="relative flex w-2 h-2" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  AI 기반 이력서·자기소개서 플랫폼
                </div>

                <h1
                  className="font-black text-slate-900 dark:text-slate-50 mb-6 tracking-[-0.035em] leading-[0.95] text-balance"
                  style={{ fontSize: 'clamp(2.5rem, 7vw, 5.25rem)' }}
                >
                  서류 합격률,
                  <br />
                  <span className="text-sky-700 dark:text-sky-400">데이터로</span> 올립니다.
                </h1>

                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed mb-9">
                  5종 AI 분석, 26개 직종 템플릿, 실시간 미리보기.{' '}
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    합격으로 가는 거리를 가장 짧게.
                  </span>
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-10">
                  <Link
                    to={ROUTES.resume.new}
                    className="btn-shine imp-btn group inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold rounded-xl hover:bg-slate-800 dark:hover:bg-white transition-colors duration-200 text-base shadow-sm focus-ring-accent"
                  >
                    무료로 시작하기
                    <svg
                      className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </Link>
                  <Link
                    to={ROUTES.resume.explore}
                    className="imp-btn group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-transparent text-slate-700 dark:text-slate-300 font-medium rounded-xl border border-slate-300 dark:border-slate-600 hover:border-slate-500 dark:hover:border-slate-400 transition-colors duration-200 text-base focus-ring-accent"
                  >
                    이력서 탐색
                    <svg
                      className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* aside column — typographic data points (큰 숫자 + uppercase label).
                  데이터 신뢰감 강조: 사용자가 "5종 AI 분석"이 진짜 임을 한눈에. */}
              <aside
                aria-label="플랫폼 핵심 지표"
                className="lg:col-span-4 lg:border-l lg:border-slate-200 dark:lg:border-slate-800 lg:pl-8 flex lg:flex-col gap-6 lg:gap-7 items-start"
              >
                <div className="flex-1 lg:flex-initial">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500 mb-1">
                    AI 분석
                  </div>
                  <div
                    className="number-ticker font-black text-slate-900 dark:text-slate-100 tabular-nums leading-none tracking-tight"
                    style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}
                  >
                    5
                    <span className="text-sky-700 dark:text-sky-400 text-[0.55em] font-bold align-top ml-0.5">
                      종
                    </span>
                  </div>
                </div>
                <div className="flex-1 lg:flex-initial" style={{ animationDelay: '120ms' }}>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500 mb-1">
                    직종 템플릿
                  </div>
                  <div
                    className="number-ticker font-black text-slate-900 dark:text-slate-100 tabular-nums leading-none tracking-tight"
                    style={{
                      fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
                      animationDelay: '120ms',
                    }}
                  >
                    26
                    <span className="text-sky-700 dark:text-sky-400 text-[0.55em] font-bold align-top ml-0.5">
                      개
                    </span>
                  </div>
                </div>
                <div className="flex-1 lg:flex-initial">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500 mb-1">
                    실시간
                  </div>
                  <div
                    className="number-ticker font-black text-slate-900 dark:text-slate-100 leading-none tracking-tight"
                    style={{
                      fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
                      animationDelay: '240ms',
                    }}
                  >
                    Live
                    <span className="text-emerald-600 dark:text-emerald-400 text-[0.55em] font-bold align-top ml-0.5 animate-pulse">
                      ●
                    </span>
                  </div>
                </div>
              </aside>
            </section>

            {/* Platform stats — 동적 운영 데이터 (SiteStatsBar는 그대로 유지) */}
            <SiteStatsBar />

            {/* Action grid — asymmetric (1 feature + 3 secondary).
                동일 카드 4개 반복 → primary 1개 강조 + secondary 3개 컴팩트. */}
            <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 max-w-3xl mx-auto mb-10 mt-12">
              {/* Primary feature — 새 이력서 */}
              <Link
                to={ROUTES.resume.new}
                className="sm:col-span-2 lg:col-span-6 lg:row-span-1 flex items-center gap-5 p-6 sm:p-7 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl hover:bg-slate-800 dark:hover:bg-white transition-colors group relative overflow-hidden"
              >
                <span className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/15 dark:bg-slate-900/10 shrink-0">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300 dark:text-sky-700 mb-1">
                    primary
                  </div>
                  <div className="font-bold text-base sm:text-lg leading-tight">
                    {t('home.directWrite')}
                  </div>
                  <div className="text-xs text-sky-100/90 dark:text-slate-600 mt-1">
                    템플릿 선택 후 작성
                  </div>
                </div>
                <svg
                  className="w-5 h-5 text-sky-200 dark:text-sky-700 group-hover:translate-x-0.5 transition-transform shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>

              {/* Secondary 1 — AI 생성 */}
              <Link
                to={ROUTES.resume.autoGenerate}
                className="lg:col-span-2 flex flex-col gap-2 p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 transition-colors group"
              >
                <span className="w-9 h-9 flex items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300">
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
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </span>
                <div>
                  <div className="font-semibold text-sm text-slate-800 dark:text-slate-200 leading-snug">
                    {t('home.aiGenerate')}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    텍스트 붙여넣기만
                  </div>
                </div>
              </Link>

              {/* Secondary 2 — Quick import */}
              <button
                onClick={() => setShowImport(true)}
                className="lg:col-span-2 flex flex-col gap-2 p-5 text-left bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 transition-colors group"
              >
                <span className="w-9 h-9 flex items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300">
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </span>
                <div>
                  <div className="font-semibold text-sm text-slate-800 dark:text-slate-200 leading-snug">
                    {t('home.quickImport')}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    텍스트 붙여넣기
                  </div>
                </div>
              </button>

              {/* Secondary 3 — 탐색 */}
              <Link
                to={ROUTES.resume.explore}
                className="lg:col-span-2 flex flex-col gap-2 p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 transition-colors group"
              >
                <span className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
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
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </span>
                <div>
                  <div className="font-semibold text-sm text-slate-800 dark:text-slate-200 leading-snug">
                    {t('home.explore')}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    공개 이력서 탐색
                  </div>
                </div>
              </Link>
            </div>

            {/* Section divider — left-aligned editorial heading (gradient line 제거) */}
            <div className="flex items-baseline gap-3 mt-14 mb-7">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 dark:text-slate-300">
                주요 기능
              </h2>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            </div>

            {/* Feature highlights — solid surface + sapphire accent (emoji 카드 정리) */}
            <div className="stagger-children grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
              {highlights.map((f, i) => (
                <div
                  key={f.title}
                  className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 overflow-hidden"
                >
                  <div
                    aria-hidden="true"
                    className="absolute top-0 left-0 right-0 h-px bg-sky-700 dark:bg-sky-400"
                  />
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-400 mb-2">
                    {`0${i + 1}`}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1.5 tracking-tight">
                    {f.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Bottom links — 통일 색상 (sky-700) + 화살표 마이크로 인터랙션 */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-12">
              {[
                { to: ROUTES.tutorial, label: '사용 가이드' },
                { to: ROUTES.pricing, label: '요금제' },
                { to: ROUTES.jobs.list, label: '채용 공고' },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="group inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-300 transition-colors"
                >
                  {link.label}
                  <svg
                    className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Link>
              ))}
            </div>

            {/* Features Grid — gradient icon → solid + 단색 background */}
            <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
              {features.map((feat, i) => (
                <div
                  key={i}
                  className="group p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 transition-colors duration-200 cursor-default"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center text-lg mb-3">
                    {feat.icon}
                  </div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-1">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Social Proof */}
            <div className="mt-14 reveal">
              <h2 className="text-xl font-bold text-center text-slate-800 dark:text-slate-200 mb-8">
                {socialProofTitle}
              </h2>
              <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {testimonials.map((review, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex gap-0.5 mb-2">
                      {Array.from({ length: review.stars }).map((_, j) => (
                        <span key={j} className="text-amber-400 text-sm">
                          ★
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-3 leading-relaxed">
                      "{review.text}"
                    </p>
                    <p className="text-xs text-slate-400 font-medium">— {review.author}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                {t('home.myResumes')} ({filtered.length})
              </h1>
            </div>

            <ProfileCompleteness />
            <OnboardingBanner />

            {wizardResume && resumes.length > 0 && (
              <ProfileWizard resume={wizardResume} resumeId={resumes[0].id} />
            )}

            {/* 창의적 위젯: 이력서 헬스 링 + 커리어 레벨 (2열) */}
            {user && resumes.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] gap-4 mb-6">
                <ResumeHealthRing resumes={resumes} />
                <CareerLevel user={user} resumes={resumes} />
              </div>
            )}

            <DashboardStats />

            <ProfileViewers />

            <NetworkStats />

            {user && (!user.plan || user.plan === 'free') && resumes.length >= 2 && (
              <div className="mb-4 p-3 bg-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between animate-fade-in">
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    프로 플랜으로 업그레이드
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    무제한 AI 변환, 자소서, 번역 기능을 사용하세요
                  </p>
                </div>
                <Link
                  to={ROUTES.pricing}
                  className="shrink-0 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  요금제 보기
                </Link>
              </div>
            )}

            {bookmarks.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  북마크한 이력서
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {bookmarks.slice(0, 5).map((b) => (
                    <Link
                      key={b.id}
                      to={ROUTES.resume.preview(b.resumeId)}
                      className="shrink-0 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                    >
                      {b.title || b.name || '이력서'}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <RecentActivity />

            <HiringTrends />

            <CareerInsights />

            <CommunityWidget />

            <InterviewDiscoveryWidget />

            {/* 창의적 위젯: 면접 질문 룰렛 */}
            <InterviewRoulette />

            {user?.userType === 'personal' && <WeeklyGoalWidget />}

            {/* 이력서 건강도 진단 — 다음 한 걸음 인사이트 */}
            {resumes.length > 0 && <ResumeHealthBoost resumes={resumes} />}

            {/* 내 이력서 섹션 헤딩 */}
            <div className="flex items-center justify-between mb-4 mt-2">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md flex items-center justify-center text-xs">
                  📄
                </span>
                {t('home.myResumes')}
                {resumes.length > 0 && (
                  <span className="text-sm font-normal text-slate-400 dark:text-slate-500">
                    ({resumes.length})
                  </span>
                )}
              </h2>
              <Link
                to={ROUTES.resume.new}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                {tx('resume.new')}
              </Link>
            </div>

            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="search"
                  role="searchbox"
                  placeholder={`${tx('home.myResumes')} ${tx('common.search')}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="이력서 검색"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: '전체', icon: '📋' },
                  { value: 'public', label: '공개', icon: '🌐' },
                  { value: 'link-only', label: '링크', icon: '🔗' },
                  { value: 'private', label: '비공개', icon: '🔒' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilterVisibility(opt.value)}
                    className={`px-2.5 py-1.5 text-xs rounded-lg whitespace-nowrap transition-colors ${
                      filterVisibility === opt.value
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tag filter */}
            {tags.length > 0 && (
              <div
                className="flex gap-2 mb-4 overflow-x-auto py-1 -my-1 px-1 -mx-1"
                role="group"
                aria-label="태그 필터"
              >
                <button
                  onClick={() => setFilterTag(null)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    !filterTag
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  aria-pressed={!filterTag}
                >
                  전체
                </button>
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => setFilterTag(filterTag === tag.id ? null : tag.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      filterTag === tag.id ? 'text-white' : 'text-slate-700 hover:opacity-80'
                    }`}
                    style={{
                      backgroundColor: filterTag === tag.id ? tag.color : `${tag.color}20`,
                      borderColor: tag.color,
                    }}
                    aria-pressed={filterTag === tag.id}
                  >
                    {tag.name} ({tag.resumeCount})
                  </button>
                ))}
              </div>
            )}

            {/* Sort */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-slate-500 dark:text-slate-400">정렬:</span>
              {[
                { value: 'updatedAt', label: '최근 수정' },
                { value: 'title', label: '이름순' },
                { value: 'viewCount', label: '조회수' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    if (sortBy === opt.value)
                      setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
                    else {
                      setSortBy(opt.value as any);
                      setSortOrder('desc');
                    }
                  }}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                    sortBy === opt.value
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                  {sortBy === opt.value && (
                    <span className="ml-1">{sortOrder === 'desc' ? '\u2193' : '\u2191'}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Bulk actions toolbar */}
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => {
                  setSelectMode(!selectMode);
                  setSelectedIds(new Set());
                }}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  selectMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {selectMode ? '선택 취소' : '선택'}
              </button>
              {selectMode && (
                <>
                  <button
                    onClick={selectAll}
                    className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200"
                  >
                    {selectedIds.size === filtered.length ? '전체 해제' : '전체 선택'}
                  </button>
                  {selectedIds.size > 0 && (
                    <button
                      onClick={handleBulkDelete}
                      className="text-xs px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200"
                    >
                      {selectedIds.size}개 삭제
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Resume grid */}
            <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
              {sorted.map((resume, index) => (
                <article
                  key={resume.id}
                  className={`relative card-lift-subtle imp-card p-4 sm:p-5 pl-5 sm:pl-6 focus-within:ring-2 focus-within:ring-[var(--color-accent)] focus-within:ring-offset-2 animate-fade-in-up stagger-${Math.min(index + 1, 6)} overflow-hidden`}
                >
                  <span
                    className={`accent-bar ${resume.visibility === 'public' ? 'accent-bar-public' : resume.visibility === 'link-only' ? 'accent-bar-link' : 'accent-bar-private'}`}
                    aria-hidden="true"
                  />
                  <div className="flex gap-3">
                    {/* Thumbnail preview */}
                    <div className="hidden sm:block w-20 shrink-0">
                      <ResumeThumbnail
                        resume={resume}
                        onClick={() => navigate(ROUTES.resume.preview(resume.id))}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      {selectMode && (
                        <div className="mb-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(resume.id)}
                            onChange={() => toggleSelect(resume.id)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            aria-label={`${resume.title} 선택`}
                          />
                        </div>
                      )}
                      <h2 className="font-semibold text-slate-900 dark:text-slate-100 truncate mb-1">
                        {resume.title || '제목 없음'}
                      </h2>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                        {resume.personalInfo.name || '이름 미입력'}
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        <p
                          className="text-xs text-slate-400"
                          title={new Date(resume.updatedAt).toLocaleString('ko-KR')}
                        >
                          {timeAgo(resume.updatedAt)}
                        </p>
                        {(() => {
                          const daysSinceUpdate = Math.floor(
                            (Date.now() - new Date(resume.updatedAt).getTime()) / 86400000,
                          );
                          if (daysSinceUpdate >= 60)
                            return (
                              <span
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full"
                                title="60일 이상 업데이트되지 않았습니다"
                              >
                                <svg
                                  className="w-2.5 h-2.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                  />
                                </svg>
                                오래된 이력서
                              </span>
                            );
                          if (daysSinceUpdate >= 30)
                            return (
                              <span
                                className="badge-xs badge-amber"
                                title="30일 이상 업데이트되지 않았습니다"
                              >
                                <svg
                                  className="w-2.5 h-2.5"
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
                                업데이트 필요
                              </span>
                            );
                          return null;
                        })()}
                      </div>

                      {/* Tags */}
                      {resume.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {resume.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className="px-2 py-1 text-xs rounded-full"
                              style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Stats row */}
                      <div className="flex items-center gap-3 mb-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1" title="조회수">
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
                          {resume.viewCount || 0}
                        </span>
                        <span
                          className="flex items-center gap-1"
                          title={`공개: ${resume.visibility || 'private'}`}
                        >
                          {resume.visibility === 'public'
                            ? '🌐 공개'
                            : resume.visibility === 'link-only'
                              ? '🔗 링크'
                              : '🔒 비공개'}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-0.5">
                        <Link
                          to={ROUTES.resume.preview(resume.id)}
                          className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all duration-200"
                          aria-label={`${resume.title} 미리보기`}
                          title="미리보기"
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
                              d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                            />
                          </svg>
                        </Link>
                        <Link
                          to={ROUTES.resume.edit(resume.id)}
                          className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                          aria-label={`${resume.title} 편집`}
                          title="편집"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDuplicate(resume.id)}
                          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200"
                          aria-label={`${resume.title} 복제`}
                          title="복제"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </button>
                        <ShareMenu
                          url={`${window.location.origin}/resumes/${resume.id}/preview`}
                          title={resume.title || '이력서'}
                          description={`${resume.personalInfo.name || ''}의 이력서`}
                        />
                        <button
                          onClick={() => handleDelete(resume.id, resume.title)}
                          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                          aria-label={`${resume.title} 삭제`}
                          title="삭제"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
      {showImport && (
        <QuickImportModal
          onClose={() => setShowImport(false)}
          onSuccess={(id) => {
            setShowImport(false);
            navigate(ROUTES.resume.edit(id));
          }}
        />
      )}
    </>
  );
}
