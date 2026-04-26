import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useJobStats } from '@/hooks/useApi';
import { useSiteStatsPublic, usePublicGet, usePopularSkills } from '@/hooks/useResources';
import { ROUTES } from '@/lib/routes';

interface SiteStats {
  users: { total: number; today: number; thisWeek: number };
  resumes: { total: number; public: number; today: number };
  activity: { totalViews: number };
  content: { templates: number };
  community: { posts: number; comments: number };
  jobs: { active: number };
}

interface PopularResume {
  id: string;
  title: string;
  viewCount: number;
  personalInfo?: { name?: string };
  skills?: { items: string }[];
}

interface PopularSkill {
  skill: string;
  count: number;
}

function CountUp({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target <= 0) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <>{count.toLocaleString()}</>;
}

function JobStatsSection() {
  const [filterLocation, setFilterLocation] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterSkill, setFilterSkill] = useState('');

  const { data, isLoading: loading } = useJobStats(
    filterLocation || undefined,
    filterType || undefined,
    filterSkill || undefined,
  );

  if (loading && !data)
    return (
      <div className="mt-8 imp-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
          <div className="stagger-children grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );

  if (!data) return null;

  const TYPE_LABELS: Record<string, string> = {
    full_time: '정규직',
    contract: '계약직',
    intern: '인턴',
    part_time: '파트타임',
    freelance: '프리랜서',
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-sm">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">채용 통계</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">총 {data.total}개 공고 분석</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 imp-card p-3">
        <select
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
          className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="">전체 지역</option>
          {data.byLocation.map((l: { name: string; count: number }) => (
            <option key={l.name} value={l.name}>
              {l.name} ({l.count})
            </option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="">전체 유형</option>
          {data.byType.map((t: { name: string; count: number }) => (
            <option key={t.name} value={t.name}>
              {TYPE_LABELS[t.name] || t.name} ({t.count})
            </option>
          ))}
        </select>
        <input
          value={filterSkill}
          onChange={(e) => setFilterSkill(e.target.value)}
          placeholder="기술 스택 필터..."
          className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100 flex-1 min-w-[120px]"
        />
        {(filterLocation || filterType || filterSkill) && (
          <button
            onClick={() => {
              setFilterLocation('');
              setFilterType('');
              setFilterSkill('');
            }}
            className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            초기화
          </button>
        )}
      </div>

      <div className="stagger-children grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Company */}
        <div className="imp-card p-5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-amber-500 rounded" />
            채용 기업 TOP 10
          </h3>
          <div className="space-y-2">
            {data.byCompany.map((c: { name: string; count: number }, i: number) => (
              <div key={c.name} className="flex items-center gap-3">
                <span
                  className={`w-5 text-xs font-bold text-right ${i < 3 ? 'text-amber-600' : 'text-slate-400'}`}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                      {c.name}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                      {c.count}건
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${(c.count / (data.byCompany[0]?.count || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {data.byCompany.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">데이터 없음</p>
            )}
          </div>
        </div>

        {/* By Location */}
        <div className="imp-card p-5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-blue-500 rounded" />
            지역별 분포
          </h3>
          <div className="space-y-2">
            {data.byLocation.map((l: { name: string; count: number }, i: number) => (
              <div key={l.name} className="flex items-center gap-3">
                <span
                  className={`w-5 text-xs font-bold text-right ${i < 3 ? 'text-blue-600' : 'text-slate-400'}`}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{l.name}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                      {l.count}건
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full"
                      style={{ width: `${(l.count / (data.byLocation[0]?.count || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {data.byLocation.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">데이터 없음</p>
            )}
          </div>
        </div>

        {/* By Skill */}
        <div className="imp-card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-sky-500 rounded" />
            채용 요구 기술 TOP 20
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.bySkill.map((s: any) => {
              const maxCount = data.bySkill[0]?.count || 1;
              const opacity = 0.4 + (s.count / maxCount) * 0.6;
              return (
                <span
                  key={s.skill || s.name}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border border-sky-200 dark:border-sky-800 transition-colors hover:bg-sky-50 dark:hover:bg-sky-900/20"
                  style={{ opacity }}
                >
                  <span className="font-medium text-sky-700 dark:text-sky-300">
                    {s.skill || s.name}
                  </span>
                  <span className="text-xs text-sky-400">{s.count}</span>
                </span>
              );
            })}
            {data.bySkill.length === 0 && (
              <p className="text-sm text-slate-400 py-4">데이터 없음</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StatsPage() {
  const [resumeFilter, setResumeFilter] = useState('');
  const statsQuery = useSiteStatsPublic();
  const popularQuery = usePublicGet<{ data?: PopularResume[]; items?: PopularResume[] }>(
    ['public-resumes', 'top-viewed'],
    '/api/resumes?visibility=public&limit=10&sort=viewCount',
    { staleTime: 60_000 },
  );
  const skillsQuery = usePopularSkills();

  const stats: SiteStats | null = (statsQuery.data as SiteStats | null) ?? null;
  const popular: PopularResume[] = (
    (popularQuery.data?.data || popularQuery.data?.items || []) as PopularResume[]
  ).slice(0, 10);
  const skills: PopularSkill[] = (
    Array.isArray(skillsQuery.data)
      ? (skillsQuery.data as any[]).map((s: any) => ({ skill: s.skill || s.name, count: s.count }))
      : []
  ).slice(0, 15);
  const loading = statsQuery.isLoading || popularQuery.isLoading || skillsQuery.isLoading;

  useEffect(() => {
    document.title = '전체 통계 — 이력서공방';
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, []);

  if (loading)
    return (
      <>
        <Header />
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
            <div className="stagger-children grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </>
    );

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8"
        role="main"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-sky-700 rounded-xl flex items-center justify-center shadow-sm">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <h1 className="heading-accent text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              이력서공방 통계
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              플랫폼 전체 현황을 한눈에 확인하세요
            </p>
          </div>
        </div>

        {stats && (
          <>
            {/* Main stats grid */}
            <div className="stagger-children grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                {
                  label: '전체 회원',
                  value: stats.users.total,
                  sub: `오늘 +${stats.users.today}`,
                  color: 'from-blue-500 to-sky-700',
                  icon: '👥',
                },
                {
                  label: '이력서',
                  value: stats.resumes.total,
                  sub: `공개 ${stats.resumes.public}개`,
                  color: 'from-emerald-500 to-teal-600',
                  icon: '📄',
                },
                {
                  label: '총 조회수',
                  value: stats.activity.totalViews,
                  sub: '',
                  color: 'from-blue-500 to-cyan-600',
                  icon: '👀',
                },
                {
                  label: '커뮤니티',
                  value: stats.community.posts,
                  sub: `댓글 ${stats.community.comments}개`,
                  color: 'from-amber-500 to-orange-600',
                  icon: '💬',
                },
              ].map((s) => (
                <div key={s.label} className="relative overflow-hidden imp-card p-5">
                  <div
                    className={`absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br ${s.color} rounded-full opacity-10`}
                  />
                  <span className="text-2xl mb-2 block">{s.icon}</span>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                    <CountUp target={s.value} />
                  </p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    {s.label}
                  </p>
                  {s.sub && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{s.sub}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Secondary stats */}
            <div className="stagger-children grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {[
                { label: '이번 주 가입', value: stats.users.thisWeek, icon: '📈' },
                { label: '오늘 이력서', value: stats.resumes.today, icon: '✍️' },
                { label: '템플릿', value: stats.content.templates, icon: '🎨' },
                { label: '채용공고', value: stats.jobs.active, icon: '💼' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-center border border-slate-100 dark:border-slate-700/50"
                >
                  <span className="text-lg">{s.icon}</span>
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1">
                    <CountUp target={s.value} />
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="stagger-children grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Popular resumes */}
          <div className="imp-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-blue-500 rounded" />
                인기 이력서
              </h2>
              <input
                value={resumeFilter}
                onChange={(e) => setResumeFilter(e.target.value)}
                placeholder="직종/기술 필터..."
                className="px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100 w-32"
              />
            </div>
            {(() => {
              const filtered = resumeFilter.trim()
                ? popular.filter((r) => {
                    const q = resumeFilter.toLowerCase();
                    const skillText =
                      r.skills
                        ?.map((s) => s.items)
                        .join(',')
                        .toLowerCase() || '';
                    return (
                      r.title.toLowerCase().includes(q) ||
                      skillText.includes(q) ||
                      (r.personalInfo?.name || '').toLowerCase().includes(q)
                    );
                  })
                : popular;
              return filtered.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">
                  {resumeFilter ? '필터 결과 없음' : '데이터가 없습니다'}
                </p>
              ) : (
                <div className="space-y-2">
                  {filtered.map((r, i) => (
                    <Link
                      key={r.id}
                      to={ROUTES.resume.preview(r.id)}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          i < 3
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                          {r.title || '제목 없음'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {r.personalInfo?.name || '익명'}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0 flex items-center gap-1">
                        <svg
                          className="w-3 h-3"
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
                        {r.viewCount?.toLocaleString()}
                      </span>
                    </Link>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Popular skills */}
          <div className="imp-card p-5">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-emerald-500 rounded" />
              인기 기술 스택 TOP 15
            </h2>
            {skills.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">데이터가 없습니다</p>
            ) : (
              <div className="space-y-2">
                {skills.map((s, i) => {
                  const maxCount = skills[0]?.count || 1;
                  const pct = Math.round((s.count / maxCount) * 100);
                  return (
                    <div key={s.skill} className="flex items-center gap-3">
                      <span
                        className={`w-6 text-xs font-bold text-right shrink-0 ${i < 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {s.skill}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                            {s.count}명
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Job Stats Section */}
        <JobStatsSection />

        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          통계는 실시간으로 업데이트됩니다
        </div>
      </main>
      <Footer />
    </>
  );
}
