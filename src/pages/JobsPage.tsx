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

  const selected = jobs.find(j => j.id === selectedId);

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">채용 공고</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{jobs.length}개의 공고</p>
          </div>
          {isRecruiter && (
            <Link to="/jobs/new" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">
              + 공고 등록
            </Link>
          )}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="포지션, 회사, 기술로 검색..." className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500" />
          <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">검색</button>
        </form>

        {loading ? (
          <div className="text-center py-12 text-slate-400">불러오는 중...</div>
        ) : jobs.length === 0 ? (
          <EmptyState type="search" query={search || undefined} />
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
                    <Link to="/applications"
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
