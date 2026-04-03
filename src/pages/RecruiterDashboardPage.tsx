import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getUser } from '@/lib/auth';
import { timeAgo } from '@/lib/time';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function RecruiterDashboardPage() {
  const navigate = useNavigate();
  const user = getUser();
  const [jobs, setJobs] = useState<any[]>([]);
  const [scouts, setScouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = '리크루터 대시보드 — 이력서공방';
    if (!user || user.userType === 'personal') {
      navigate('/');
      return;
    }

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API_URL}/api/jobs/my`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`${API_URL}/api/social/scouts`, { headers }).then(r => r.ok ? r.json() : []),
    ])
      .then(([jobsData, scoutsData]) => {
        setJobs(jobsData);
        setScouts(scoutsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);

  if (!user || user.userType === 'personal') return null;

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">리크루터 대시보드</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{user.companyName || user.name}</p>
          </div>
          <Link to="/jobs/new" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">
            + 공고 등록
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">불러오는 중...</div>
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: '등록 공고', value: jobs.length, icon: '📋', color: 'text-blue-600' },
                { label: '활성 공고', value: jobs.filter((j: any) => j.status === 'active').length, icon: '✅', color: 'text-green-600' },
                { label: '보낸 스카우트', value: scouts.length, icon: '📨', color: 'text-purple-600' },
                { label: '인재 검색', value: '→', icon: '🔍', color: 'text-amber-600' },
              ].map(s => (
                <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
                  <span className="text-lg block mb-1">{s.icon}</span>
                  <span className={`text-2xl font-bold ${s.color} block`}>{s.value}</span>
                  <span className="text-xs text-slate-400">{s.label}</span>
                </div>
              ))}
            </div>

            {/* My Job Posts */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">내 채용 공고</h2>
                <Link to="/jobs" className="text-xs text-blue-600 hover:underline">전체 보기</Link>
              </div>
              {jobs.length === 0 ? (
                <div className="text-center py-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-400">등록된 공고가 없습니다</p>
                  <Link to="/jobs/new" className="text-sm text-blue-600 hover:underline mt-2 inline-block">첫 공고 등록하기</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {jobs.slice(0, 5).map((j: any) => (
                    <div key={j.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="min-w-0">
                        <Link to="/jobs" className="text-sm font-medium text-slate-900 dark:text-slate-100 hover:text-blue-600 truncate block">{j.position}</Link>
                        <span className="text-xs text-slate-400">{j.company} · {timeAgo(j.createdAt)}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${j.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                        {j.status === 'active' ? '활성' : j.status === 'closed' ? '마감' : '임시'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Quick Actions */}
            <section>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">빠른 작업</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: '인재 검색', to: '/explore', icon: '🔍' },
                  { label: '공고 등록', to: '/jobs/new', icon: '📝' },
                  { label: '스카우트 현황', to: '/scouts', icon: '📨' },
                  { label: '쪽지함', to: '/messages', icon: '💬' },
                ].map(a => (
                  <Link key={a.to} to={a.to} className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-sm transition-all duration-200 text-sm text-slate-700 dark:text-slate-300">
                    <span>{a.icon}</span>
                    {a.label}
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
