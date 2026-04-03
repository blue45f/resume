import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ErrorRetry from '@/components/ErrorRetry';
import { API_URL } from '@/lib/config';
import { timeAgo } from '@/lib/time';

interface JobPost {
  id: string;
  company: string;
  position: string;
  location: string;
  salary: string;
  type: string;
  skills: string;
  description: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string; companyName?: string };
}

const JOB_TYPES: Record<string, string> = {
  fulltime: '정규직', contract: '계약직', parttime: '파트타임', intern: '인턴',
};

function parseSalaryToNumber(salary: string): number | null {
  if (!salary) return null;
  const cleaned = salary.replace(/[^0-9]/g, '');
  return cleaned ? parseInt(cleaned, 10) : null;
}

function detectIndustry(jobs: JobPost[]): string {
  const text = jobs.map(j => `${j.skills} ${j.description} ${j.position}`).join(' ').toLowerCase();
  if (/react|node|python|java|개발|프론트|백엔드|devops|cloud|aws|데이터|ai|ml/.test(text)) return 'IT/소프트웨어';
  if (/금융|은행|보험|투자|핀테크/.test(text)) return '금융';
  if (/제조|생산|공장|설비/.test(text)) return '제조';
  if (/마케팅|광고|홍보|pr/.test(text)) return '마케팅';
  if (/디자인|ui|ux/.test(text)) return '디자인';
  return '기타';
}

export default function CompanyPage() {
  const { name } = useParams<{ name: string }>();
  const companyName = decodeURIComponent(name || '');
  const [allJobs, setAllJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadJobs = () => {
    setError(false);
    setLoading(true);
    fetch(`${API_URL}/api/jobs`)
      .then(r => r.ok ? r.json() : [])
      .then(setAllJobs)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    document.title = `${companyName} — 회사 정보 — 이력서공방`;
    loadJobs();
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, [companyName]);

  const companyJobs = useMemo(
    () => allJobs.filter(j => j.company === companyName),
    [allJobs, companyName]
  );
  const activeJobs = useMemo(
    () => companyJobs.filter(j => j.status === 'active'),
    [companyJobs]
  );

  const locations = useMemo(() => {
    const locs = new Set<string>();
    companyJobs.forEach(j => { if (j.location) locs.add(j.location); });
    return Array.from(locs);
  }, [companyJobs]);

  const allSkills = useMemo(() => {
    const skillMap = new Map<string, number>();
    companyJobs.forEach(j => {
      if (j.skills) {
        j.skills.split(',').forEach(s => {
          const trimmed = s.trim();
          if (trimmed) skillMap.set(trimmed, (skillMap.get(trimmed) || 0) + 1);
        });
      }
    });
    return Array.from(skillMap.entries()).sort((a, b) => b[1] - a[1]);
  }, [companyJobs]);

  const salaryStats = useMemo(() => {
    const salaries = companyJobs
      .map(j => parseSalaryToNumber(j.salary))
      .filter((n): n is number => n !== null);
    if (salaries.length === 0) return null;
    const min = Math.min(...salaries);
    const max = Math.max(...salaries);
    const avg = Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length);
    return { min, max, avg };
  }, [companyJobs]);

  const jobTypes = useMemo(() => {
    const types = new Map<string, number>();
    companyJobs.forEach(j => types.set(j.type, (types.get(j.type) || 0) + 1));
    return Array.from(types.entries());
  }, [companyJobs]);

  const industry = useMemo(() => detectIndustry(companyJobs), [companyJobs]);

  const estimatedSize = companyJobs.length >= 10 ? '대기업' : companyJobs.length >= 5 ? '중견기업' : companyJobs.length >= 2 ? '중소기업' : '스타트업';

  if (error) {
    return (
      <>
        <Header />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <ErrorRetry onRetry={loadJobs} />
        </main>
        <Footer />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
            <div className="grid grid-cols-3 gap-4 mt-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (companyJobs.length === 0) {
    return (
      <>
        <Header />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 text-center">
          <svg className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">"{companyName}" 회사 정보를 찾을 수 없습니다</h2>
          <p className="text-sm text-slate-500 mb-4">해당 회사의 채용 공고가 등록되어 있지 않습니다.</p>
          <Link to="/jobs" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors">
            채용 공고 보기
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const companyUser = companyJobs[0]?.user;

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-6">
          <Link to="/jobs" className="hover:text-blue-600 transition-colors">채용 공고</Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <span className="text-slate-700 dark:text-slate-300">{companyName}</span>
        </nav>

        {/* Company Header */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0">
              {companyName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">{companyName}</h1>
              {companyUser?.companyName && companyUser.companyName !== companyName && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{companyUser.companyName}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-2.5 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">{industry}</span>
                <span className="px-2.5 py-1 text-xs font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-full">{estimatedSize}</span>
                {locations.map(loc => (
                  <span key={loc} className="px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full">
                    {loc}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{activeJobs.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">채용 중인 공고</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{companyJobs.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">전체 공고</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
            {salaryStats ? (
              <>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {salaryStats.avg >= 10000 ? `${(salaryStats.avg / 10000).toFixed(0)}만` : `${salaryStats.avg}만`}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">평균 연봉</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-slate-400">-</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">연봉 비공개</p>
              </>
            )}
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{allSkills.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">요구 기술 수</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Company Details */}
          <div className="lg:col-span-1 space-y-4">
            {/* Job types breakdown */}
            {jobTypes.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">채용 형태</h3>
                <div className="space-y-2">
                  {jobTypes.map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">{JOB_TYPES[type] || type}</span>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{count}건</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Salary range */}
            {salaryStats && salaryStats.min !== salaryStats.max && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">연봉 범위</h3>
                <div className="relative h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                  <div
                    className="absolute inset-y-0 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                    style={{ left: `${(salaryStats.min / salaryStats.max) * 70}%`, right: '0%' }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{salaryStats.min >= 10000 ? `${(salaryStats.min / 10000).toFixed(0)}만원` : `${salaryStats.min}만원`}</span>
                  <span>{salaryStats.max >= 10000 ? `${(salaryStats.max / 10000).toFixed(0)}만원` : `${salaryStats.max}만원`}</span>
                </div>
              </div>
            )}

            {/* Tech Stack */}
            {allSkills.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">기술 스택</h3>
                <div className="flex flex-wrap gap-1.5">
                  {allSkills.slice(0, 15).map(([skill, count]) => (
                    <span
                      key={skill}
                      className="px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg"
                      title={`${count}개 공고에서 요구`}
                    >
                      {skill}
                      {count > 1 && <span className="ml-1 text-blue-400 dark:text-blue-500">({count})</span>}
                    </span>
                  ))}
                  {allSkills.length > 15 && (
                    <span className="px-2 py-1 text-xs text-slate-400">+{allSkills.length - 15}개</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Job Listings */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  채용 중인 포지션 ({activeJobs.length})
                </h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {activeJobs.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500">현재 채용 중인 포지션이 없습니다</div>
                ) : (
                  activeJobs.map(job => (
                    <div key={job.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/jobs?selected=${job.id}`}
                            className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            {job.position}
                          </Link>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                            {job.location && (
                              <span className="flex items-center gap-0.5">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                {job.location}
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">{JOB_TYPES[job.type] || job.type}</span>
                            {job.salary && <span className="text-emerald-600 dark:text-emerald-400 font-medium">{job.salary}</span>}
                            <span>{timeAgo(job.createdAt)}</span>
                          </div>
                          {job.skills && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {job.skills.split(',').slice(0, 5).map((s, i) => (
                                <span key={i} className="px-1.5 py-0.5 text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded">
                                  {s.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <Link
                          to={`/applications?company=${encodeURIComponent(job.company)}&position=${encodeURIComponent(job.position)}`}
                          className="shrink-0 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          지원하기
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
