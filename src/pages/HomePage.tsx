import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { CardGridSkeleton } from '@/components/Skeleton';
import { toast } from '@/components/Toast';
import QuickImportModal from '@/components/QuickImportModal';
import Footer from '@/components/Footer';
import { timeAgo } from '@/lib/time';
import type { ResumeSummary, Tag } from '@/types/resume';
import { fetchResumes, deleteResume, duplicateResume, fetchTags, fetchBookmarks } from '@/lib/api';
import ResumeThumbnail from '@/components/ResumeThumbnail';
import DashboardStats from '@/components/DashboardStats';
import NetworkStats from '@/components/NetworkStats';
import RecentActivity from '@/components/RecentActivity';
import HiringTrends from '@/components/HiringTrends';
import CareerInsights from '@/components/CareerInsights';
import OnboardingBanner from '@/components/OnboardingBanner';
import { t } from '@/lib/i18n';
import { getUser } from '@/lib/auth';
import { API_URL } from '@/lib/config';
import ShareMenu from '@/components/ShareMenu';


function SiteStatsBar() {
  const [stats, setStats] = useState<{ users: number; resumes: number; views: number; templates: number } | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/health/stats`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) setStats({ users: d.users.total, resumes: d.resumes.total, views: d.activity.totalViews, templates: d.content.templates });
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-wrap justify-center gap-6 text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
      <span><strong className="text-slate-700 dark:text-slate-300 text-sm">{stats?.users || '—'}</strong> 회원</span>
      <span><strong className="text-slate-700 dark:text-slate-300 text-sm">{stats?.resumes || '—'}</strong> 이력서</span>
      <span><strong className="text-slate-700 dark:text-slate-300 text-sm">{stats?.views?.toLocaleString() || '—'}</strong> 조회</span>
      <span><strong className="text-slate-700 dark:text-slate-300 text-sm">{stats?.templates || 26}</strong> 템플릿</span>
    </div>
  );
}

export default function HomePage() {
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [tags, setTags] = useState<(Tag & { resumeCount: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [filterVisibility, setFilterVisibility] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'title' | 'viewCount'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [showImport, setShowImport] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [bookmarks, setBookmarks] = useState<{ id: string; resumeId: string; title: string; name: string }[]>([]);
  const [serverError, setServerError] = useState(false);
  const navigate = useNavigate();
  const user = getUser();

  const load = async (signal?: AbortSignal) => {
    try {
      setServerError(false);
      const [resumeData, tagData] = await Promise.all([fetchResumes(), fetchTags()]);
      if (signal?.aborted) return;
      setResumes(resumeData);
      setTags(tagData);
      if (user) fetchBookmarks().then(setBookmarks).catch(() => {});
    } catch (err) {
      if (signal?.aborted) return;
      setServerError(true);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const ac = new AbortController();
    load(ac.signal);
    return () => ac.abort();
  }, []);

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
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(r => r.id)));
  };

  const handleBulkDelete = async () => {
    if (!confirm(`선택한 ${selectedIds.size}개의 이력서를 삭제하시겠습니까?`)) return;
    for (const id of selectedIds) {
      try { await deleteResume(id); } catch {}
    }
    toast(`${selectedIds.size}개 이력서가 삭제되었습니다`, 'success');
    setSelectedIds(new Set());
    setSelectMode(false);
    load();
  };

  const filtered = resumes
    .filter(r => filterTag ? r.tags?.some(t => t.id === filterTag) : true)
    .filter(r => filterVisibility === 'all' ? true : r.visibility === filterVisibility)
    .filter(r => !searchQuery || (r.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || (r.personalInfo?.name || '').toLowerCase().includes(searchQuery.toLowerCase()));

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
        <main id="main-content" className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main">
          <div className="h-8 bg-slate-200 rounded w-48 mb-6 animate-pulse" />
          <CardGridSkeleton count={6} />
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main">
        {serverError && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-sm text-amber-800 dark:text-amber-300">서버가 시작 중입니다. 무료 호스팅 특성상 첫 로딩에 30~60초 소요될 수 있습니다.</p>
            </div>
            <button onClick={() => { setLoading(true); load(); }} className="shrink-0 px-3 py-1 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-colors">
              재시도
            </button>
          </div>
        )}
        {user && (user.userType === 'recruiter' || user.userType === 'company') && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
            <p className="text-sm text-emerald-800 dark:text-emerald-300">🏢 채용 대시보드에서 공고와 스카우트를 관리하세요</p>
            <Link to="/recruiter" className="shrink-0 px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors">대시보드</Link>
          </div>
        )}
        {resumes.length === 0 ? (
          <div className="py-12 sm:py-16 animate-fade-in">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium mb-4 animate-fade-in">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                AI 기반 이력서 관리 플랫폼
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 mb-4 tracking-tight">
                {t('home.welcome').split(/스마트하게|smartly|スマートに/).length > 1 ? (
                  <>{t('home.welcome').split(/스마트하게|smartly|スマートに/)[0]}<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{t('home.welcome').match(/스마트하게|smartly|スマートに/)?.[0]}</span>{t('home.welcome').split(/스마트하게|smartly|スマートに/)[1]}</>
                ) : t('home.welcome')}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                {t('home.welcomeDesc')}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl sm:max-w-3xl mx-auto mb-10">
              <Link to="/resumes/new" className="flex flex-col items-center p-6 bg-white dark:bg-slate-800 rounded-xl border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📝</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{t('home.directWrite')}</span>
                <span className="text-xs text-slate-400 mt-1">템플릿 선택 후 작성</span>
              </Link>
              <Link to="/auto-generate" className="flex flex-col items-center p-6 bg-white dark:bg-slate-800 rounded-xl border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">🤖</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{t('home.aiGenerate')}</span>
                <span className="text-xs text-slate-400 mt-1">텍스트 붙여넣기만</span>
              </Link>
              <button onClick={() => setShowImport(true)} className="flex flex-col items-center p-6 bg-white dark:bg-slate-800 rounded-xl border-2 border-green-200 dark:border-green-800 hover:border-green-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📋</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{t('home.quickImport')}</span>
                <span className="text-xs text-slate-400 mt-1">텍스트 붙여넣기</span>
              </button>
              <Link to="/explore" className="flex flex-col items-center p-6 bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-slate-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">🔍</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{t('home.explore')}</span>
                <span className="text-xs text-slate-400 mt-1">공개 이력서 탐색</span>
              </Link>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto mt-12 mb-10">
              {[
                {
                  icon: (<svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>),
                  title: 'AI 분석 5종 세트',
                  desc: 'ATS 통과율 검사, JD 매칭도 분석, 예상 면접 질문까지 - 서류 합격률을 높이는 데이터 기반 인사이트',
                  bg: 'bg-blue-50 dark:bg-blue-900/20',
                },
                {
                  icon: (<svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>),
                  title: '26개 직종별 템플릿',
                  desc: '개발자, 디자이너, 마케터 등 직종에 최적화된 레이아웃과 15종 테마로 프로페셔널한 이력서 완성',
                  bg: 'bg-purple-50 dark:bg-purple-900/20',
                },
                {
                  icon: (<svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
                  title: '완전 무료로 시작',
                  desc: '오픈소스 LLM 활용으로 비용 부담 없이 시작하세요. 핵심 기능 모두 무료, 숨겨진 비용 없음',
                  bg: 'bg-emerald-50 dark:bg-emerald-900/20',
                },
              ].map(f => (
                <div key={f.title} className={`${f.bg} rounded-xl p-5 text-center animate-fade-in-up hover:-translate-y-1 transition-transform duration-200`}>
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-white dark:bg-slate-800 rounded-xl shadow-sm mb-3">
                    {f.icon}
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">{f.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

            {/* Testimonials / Social proof */}
            <div className="max-w-3xl mx-auto mt-10 mb-10">
              <h3 className="text-center text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-6">사용자 후기</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { name: '김서연', role: '프론트엔드 개발자', text: 'AI 피드백 덕분에 이력서 퀄리티가 확 올라갔어요. JD 매칭 분석으로 맞춤 이력서를 작성하니 면접 기회가 2배로 늘었습니다.', avatar: 'S', color: 'bg-blue-500' },
                  { name: '이준호', role: 'UX 디자이너', text: '직종별 템플릿이 정말 유용해요. 포트폴리오 스타일의 이력서를 5분 만에 만들 수 있어서 시간을 많이 아꼈습니다.', avatar: 'J', color: 'bg-purple-500' },
                  { name: '박지민', role: '마케팅 매니저', text: 'ATS 검사 기능이 특히 인상적이에요. 어떤 키워드가 부족한지 바로 알 수 있어서 서류 통과율이 확실히 높아졌습니다.', avatar: 'J', color: 'bg-emerald-500' },
                ].map(testimonial => (
                  <div key={testimonial.name} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 animate-fade-in-up">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className={`w-8 h-8 ${testimonial.color} rounded-full flex items-center justify-center text-white text-xs font-bold`}>{testimonial.avatar}</div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{testimonial.name}</p>
                        <p className="text-xs text-slate-400">{testimonial.role}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">&ldquo;{testimonial.text}&rdquo;</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center space-x-4">
              <Link to="/tutorial" className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">사용 가이드 보기 &rarr;</Link>
              <Link to="/pricing" className="text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 transition-colors">요금제 보기 &rarr;</Link>
              <Link to="/jobs" className="text-sm text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors">채용 공고 보기 &rarr;</Link>
            </div>

            <SiteStatsBar />
          </div>
        ) : (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                {t('home.myResumes')} ({filtered.length})
              </h1>
            </div>

            <OnboardingBanner />

            <DashboardStats />

            <NetworkStats />

            {user && (!user.plan || user.plan === 'free') && resumes.length >= 2 && (
              <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between animate-fade-in">
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">프로 플랜으로 업그레이드</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">무제한 AI 변환, 자소서, 번역 기능을 사용하세요</p>
                </div>
                <Link to="/pricing" className="shrink-0 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
                  요금제 보기
                </Link>
              </div>
            )}

            {bookmarks.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">북마크한 이력서</h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {bookmarks.slice(0, 5).map(b => (
                    <Link
                      key={b.id}
                      to={`/resumes/${b.resumeId}/preview`}
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

            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  type="text"
                  placeholder="이력서 검색..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-1.5">
                {[
                  { value: 'all', label: '전체', icon: '📋' },
                  { value: 'public', label: '공개', icon: '🌐' },
                  { value: 'link-only', label: '링크', icon: '🔗' },
                  { value: 'private', label: '비공개', icon: '🔒' },
                ].map(opt => (
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
              <div className="flex gap-2 mb-4 overflow-x-auto py-1 -my-1 px-1 -mx-1" role="group" aria-label="태그 필터">
                <button
                  onClick={() => setFilterTag(null)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    !filterTag ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  aria-pressed={!filterTag}
                >
                  전체
                </button>
                {tags.map(tag => (
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
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    if (sortBy === opt.value) setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
                    else { setSortBy(opt.value as any); setSortOrder('desc'); }
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
                onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  selectMode ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {selectMode ? '선택 취소' : '선택'}
              </button>
              {selectMode && (
                <>
                  <button onClick={selectAll} className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200">
                    {selectedIds.size === filtered.length ? '전체 해제' : '전체 선택'}
                  </button>
                  {selectedIds.size > 0 && (
                    <button onClick={handleBulkDelete} className="text-xs px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200">
                      {selectedIds.size}개 삭제
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Resume grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {sorted.map((resume, index) => (
                <article
                  key={resume.id}
                  className={`card-hover bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 focus-within:ring-2 focus-within:ring-blue-500 animate-fade-in-up stagger-${Math.min(index + 1, 6)} border-l-4 ${resume.visibility === 'public' ? 'border-l-emerald-400' : resume.visibility === 'link-only' ? 'border-l-blue-400' : 'border-l-slate-300'}`}
                >
                  <div className="flex gap-3">
                    {/* Thumbnail preview */}
                    <div className="hidden sm:block w-20 shrink-0">
                      <ResumeThumbnail
                        resume={resume}
                        onClick={() => navigate(`/resumes/${resume.id}/preview`)}
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
                      <p className="text-xs text-slate-400 mb-2" title={new Date(resume.updatedAt).toLocaleString('ko-KR')}>
                        {timeAgo(resume.updatedAt)}
                      </p>

                      {/* Tags */}
                      {resume.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {resume.tags.map(tag => (
                            <span
                              key={tag.id}
                              className="px-2 py-0.5 text-xs rounded-full"
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
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          {resume.viewCount || 0}
                        </span>
                        <span className="flex items-center gap-1" title={`공개: ${resume.visibility || 'private'}`}>
                          {resume.visibility === 'public' ? '🌐 공개' : resume.visibility === 'link-only' ? '🔗 링크' : '🔒 비공개'}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/resumes/${resume.id}/edit`}
                          className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                          aria-label={`${resume.title} 편집`}
                          title="편집"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </Link>
                        <Link
                          to={`/resumes/${resume.id}/preview`}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-200"
                          aria-label={`${resume.title} 미리보기`}
                          title="미리보기"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </Link>
                        <button
                          onClick={() => handleDuplicate(resume.id)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200"
                          aria-label={`${resume.title} 복제`}
                          title="복제"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </button>
                        <ShareMenu
                          url={`${window.location.origin}/resumes/${resume.id}/preview`}
                          title={resume.title || '이력서'}
                          description={`${resume.personalInfo.name || ''}의 이력서`}
                        />
                        <button
                          onClick={() => handleDelete(resume.id, resume.title)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                          aria-label={`${resume.title} 삭제`}
                          title="삭제"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
          onSuccess={(id) => { setShowImport(false); navigate(`/resumes/${id}/edit`); }}
        />
      )}
    </>
  );
}
