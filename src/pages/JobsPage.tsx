import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EmptyState from '@/components/EmptyState';
import { getUser } from '@/lib/auth';
import { timeAgo } from '@/lib/time';

const API_URL = import.meta.env.VITE_API_URL || '';

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

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const user = getUser();
  const isRecruiter = user?.userType === 'recruiter' || user?.userType === 'company';

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
              onClick={() => { setTypeFilter(opt.key); setSelectedId(null); }}
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* List */}
            <div className="lg:col-span-1 space-y-2">
              {jobs.map(j => (
                <button
                  key={j.id}
                  onClick={() => setSelectedId(j.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                    selectedId === j.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-sm'
                  }`}
                >
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{j.position}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{j.company}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-400">
                    {j.location && <span>{j.location}</span>}
                    <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">{JOB_TYPES[j.type] || j.type}</span>
                  </div>
                  {j.skills && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {j.skills.split(',').slice(0, 4).map((s, i) => (
                        <span key={i} className="px-1.5 py-0.5 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded">{s.trim()}</span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Detail */}
            <div className="lg:col-span-2">
              {selected ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 sticky top-20">
                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{selected.position}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{selected.company}</p>
                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
                      {selected.location && <span>{selected.location}</span>}
                      {selected.salary && <span>{selected.salary}</span>}
                      <span>{JOB_TYPES[selected.type]}</span>
                      <span>{timeAgo(selected.createdAt)}</span>
                    </div>
                  </div>

                  {selected.skills && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">기술 스택</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selected.skills.split(',').map((s, i) => (
                          <span key={i} className="px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">{s.trim()}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selected.description && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">상세 설명</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">{selected.description}</p>
                    </div>
                  )}

                  <div className="flex gap-2 mt-6">
                    <Link to={`/cover-letter?company=${encodeURIComponent(selected.company)}&position=${encodeURIComponent(selected.position)}`}
                      className="flex-1 py-2.5 text-center bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">
                      이 공고로 자소서 작성
                    </Link>
                    <Link to={`/applications?company=${encodeURIComponent(selected.company)}&position=${encodeURIComponent(selected.position)}`}
                      className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-xl hover:bg-slate-200 transition-colors">
                      지원 추가
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-400">
                  <p className="text-sm">채용 공고를 선택하세요</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
