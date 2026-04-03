import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getUser } from '@/lib/auth';
import { timeAgo } from '@/lib/time';
import { API_URL } from '@/lib/config';
import { fetchResumes } from '@/lib/api';
import type { ResumeSummary } from '@/types/resume';


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

const SKILL_COLORS = [
  { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
  { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
  { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
  { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400' },
  { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-600 dark:text-rose-400' },
  { bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-600 dark:text-cyan-400' },
];

function getSkillColor(index: number) {
  return SKILL_COLORS[index % SKILL_COLORS.length];
}

/** Calculate match score between user skills and job required skills */
function calculateMatchScore(userSkills: Set<string>, jobSkills: string): number {
  if (!jobSkills || userSkills.size === 0) return 0;
  const required = jobSkills.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  if (required.length === 0) return 0;
  const matched = required.filter(s => userSkills.has(s));
  return Math.round((matched.length / required.length) * 100);
}

function MatchBadge({ score }: { score: number }) {
  if (score <= 0) return null;
  let colorClass = '';
  if (score >= 80) colorClass = 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
  else if (score >= 60) colorClass = 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
  else if (score >= 30) colorClass = 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800';
  else colorClass = 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';

  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-md border ${colorClass}`} title="매칭률">
      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
      {score}%
    </span>
  );
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [userResumes, setUserResumes] = useState<ResumeSummary[]>([]);
  const user = getUser();
  const isRecruiter = user?.userType === 'recruiter' || user?.userType === 'company';
  const isPersonal = user?.userType === 'personal';

  // Load user's resume skills for match scoring
  useEffect(() => {
    if (user) {
      fetchResumes().then(setUserResumes).catch(() => {});
    }
  }, []);

  const userSkills = useMemo((): Set<string> => {
    const skills = new Set<string>();
    userResumes.forEach(r => {
      r.skills?.forEach(sk => {
        sk.items.split(',').forEach(item => {
          const trimmed = item.trim().toLowerCase();
          if (trimmed) skills.add(trimmed);
        });
      });
    });
    return skills;
  }, [userResumes]);

  useEffect(() => {
    document.title = '채용 공고 — 이력서공방';
    loadJobs();
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);

  const loadJobs = (query?: string) => {
    const qs = query ? `?q=${encodeURIComponent(query)}` : '';
    fetch(`${API_URL}/api/jobs${qs}`)
      .then(r => r.ok ? r.json() : [])
      .then(setJobs)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadJobs(search);
  };

  const handleSelectJob = (id: string) => {
    setSelectedId(id);
    setMobileDetailOpen(true);
  };

  const filteredJobs = typeFilter === 'all' ? jobs : jobs.filter(j => j.type === typeFilter);
  const selected = filteredJobs.find(j => j.id === selectedId);

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">채용 공고</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{filteredJobs.length}개의 공고</p>
          </div>
          {isRecruiter && (
            <Link to="/jobs/new" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">
              + 공고 등록
            </Link>
          )}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="포지션, 회사, 기술로 검색..." className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500" />
          <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">검색</button>
        </form>

        {/* Job type filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {[{ key: 'all', label: '전체' }, { key: 'fulltime', label: '정규직' }, { key: 'contract', label: '계약직' }, { key: 'parttime', label: '파트타임' }, { key: 'intern', label: '인턴' }].map(opt => (
            <button
              key={opt.key}
              onClick={() => { setTypeFilter(opt.key); setSelectedId(null); setMobileDetailOpen(false); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                typeFilter === opt.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 animate-pulse">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-3" />
                  <div className="flex gap-2">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-12" />
                  </div>
                </div>
              ))}
            </div>
            <div className="lg:col-span-2 hidden lg:block">
              <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 animate-pulse">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-3" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4" />
                <div className="space-y-2">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4/6" />
                </div>
              </div>
            </div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.193 23.193 0 0112 15c-3.183 0-6.22-.64-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">채용공고가 없습니다</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
              {search ? `"${search}"에 대한 검색 결과가 없습니다.` : typeFilter !== 'all' ? `${JOB_TYPES[typeFilter]} 공고가 아직 없습니다.` : '등록된 채용 공고가 없습니다.'}
            </p>
            {(search || typeFilter !== 'all') && (
              <button
                onClick={() => { setSearch(''); setTypeFilter('all'); loadJobs(); }}
                className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                필터 초기화
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile: full-screen detail overlay */}
            {mobileDetailOpen && selected && (
              <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 overflow-y-auto lg:hidden">
                <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setMobileDetailOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h2 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{selected.position}</h2>
                </div>
                <div className="p-4">
                  <JobDetailPanel job={selected} isPersonal={isPersonal} userSkills={userSkills} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Job list */}
              <div className="lg:col-span-1 space-y-2 max-h-[calc(100vh-16rem)] overflow-y-auto lg:pr-1">
                {filteredJobs.map(j => (
                  <button
                    key={j.id}
                    onClick={() => handleSelectJob(j.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                      selectedId === j.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-sm hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{j.position}</h3>
                        {user && userSkills.size > 0 && j.skills && (
                          <MatchBadge score={calculateMatchScore(userSkills, j.skills)} />
                        )}
                      </div>
                      <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">{timeAgo(j.createdAt)}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{j.company}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-400">
                      {j.location && (
                        <span className="flex items-center gap-0.5">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          {j.location}
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">{JOB_TYPES[j.type] || j.type}</span>
                      {j.salary && <span className="text-emerald-600 dark:text-emerald-400 font-medium">{j.salary}</span>}
                    </div>
                    {j.skills && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {j.skills.split(',').slice(0, 4).map((s, i) => {
                          const c = getSkillColor(i);
                          return (
                            <span key={i} className={`px-1.5 py-0.5 text-xs ${c.bg} ${c.text} rounded`}>{s.trim()}</span>
                          );
                        })}
                        {j.skills.split(',').length > 4 && (
                          <span className="px-1.5 py-0.5 text-xs text-slate-400">+{j.skills.split(',').length - 4}</span>
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Desktop detail panel */}
              <div className="lg:col-span-2 hidden lg:block">
                {selected ? (
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 sticky top-20">
                    <JobDetailPanel job={selected} isPersonal={isPersonal} userSkills={userSkills} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <svg className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.193 23.193 0 0112 15c-3.183 0-6.22-.64-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">채용 공고를 선택하세요</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

/* Extracted detail panel for reuse in desktop and mobile */
function JobDetailPanel({ job, isPersonal }: { job: JobPost; isPersonal: boolean }) {
  return (
    <>
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{job.position}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{job.company}</p>
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500 dark:text-slate-400">
          {job.location && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {job.location}
            </span>
          )}
          {job.salary && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {job.salary}
            </span>
          )}
          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-lg font-medium">{JOB_TYPES[job.type] || job.type}</span>
          <span>{timeAgo(job.createdAt)}</span>
        </div>
      </div>

      {/* Company info */}
      <div className="mb-5 p-3 bg-slate-50 dark:bg-slate-750 rounded-xl border border-slate-100 dark:border-slate-700">
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          회사 정보
        </h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-xs text-slate-400 dark:text-slate-500">회사명</span>
            <p className="text-slate-700 dark:text-slate-300 font-medium">{job.company}</p>
          </div>
          {job.user?.companyName && (
            <div>
              <span className="text-xs text-slate-400 dark:text-slate-500">등록자</span>
              <p className="text-slate-700 dark:text-slate-300">{job.user.companyName}</p>
            </div>
          )}
          {job.location && (
            <div>
              <span className="text-xs text-slate-400 dark:text-slate-500">근무지</span>
              <p className="text-slate-700 dark:text-slate-300">{job.location}</p>
            </div>
          )}
          {job.salary && (
            <div>
              <span className="text-xs text-slate-400 dark:text-slate-500">급여</span>
              <p className="text-emerald-600 dark:text-emerald-400 font-medium">{job.salary}</p>
            </div>
          )}
        </div>
      </div>

      {/* Required skills */}
      {job.skills && (
        <div className="mb-5">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">요구 기술</h4>
          <div className="flex flex-wrap gap-1.5">
            {job.skills.split(',').map((s, i) => {
              const c = getSkillColor(i);
              return (
                <span key={i} className={`px-2.5 py-1 text-xs font-medium ${c.bg} ${c.text} rounded-lg`}>{s.trim()}</span>
              );
            })}
          </div>
        </div>
      )}

      {/* Description */}
      {job.description && (
        <div className="mb-5">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">상세 설명</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">{job.description}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
        {isPersonal ? (
          <Link
            to={`/applications?company=${encodeURIComponent(job.company)}&position=${encodeURIComponent(job.position)}`}
            className="flex-1 py-2.5 text-center bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            지원하기
          </Link>
        ) : (
          <>
            <Link
              to={`/applications?company=${encodeURIComponent(job.company)}&position=${encodeURIComponent(job.position)}`}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-xl hover:bg-slate-200 transition-colors"
            >
              지원 추가
            </Link>
            <Link
              to={`/jobs/new?copyFrom=${job.id}`}
              className="px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
            >
              복사해서 새 공고
            </Link>
          </>
        )}
        <Link
          to={`/cover-letter?company=${encodeURIComponent(job.company)}&position=${encodeURIComponent(job.position)}`}
          className={`${isPersonal ? '' : 'flex-1'} px-4 py-2.5 text-center bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors`}
        >
          이 공고로 자소서 작성
        </Link>
      </div>
    </>
  );
}
