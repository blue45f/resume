import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from '@/components/Toast';
import { getUser } from '@/lib/auth';
import { PLANS } from '@/lib/plans';

const API_URL = import.meta.env.VITE_API_URL || '';

interface RecentUser {
  id: string;
  name: string | null;
  email: string;
  provider: string;
  createdAt: string;
}

interface Stats {
  users: { total: number; today: number; week: number; month: number };
  resumes: { total: number; today: number; week: number; public: number };
  content: { templates: number; tags: number; comments: number; versions: number };
  activity: { applications: number; transforms: number; totalViews: number };
  recentUsers?: RecentUser[];
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'content' | 'plans'>('stats');
  const user = getUser();
  const navigate = useNavigate();

  const tabs = [
    { id: 'stats' as const, label: '통계', icon: '📊' },
    { id: 'users' as const, label: '사용자', icon: '👥' },
    { id: 'content' as const, label: '콘텐츠', icon: '📝' },
    { id: 'plans' as const, label: '요금제', icon: '💰' },
  ];

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      navigate('/');
    }
  }, [user]);

  const loadStats = () => {
    setLoading(true);
    fetch(`${API_URL}/api/health/admin/stats`)
      .then(r => r.ok ? r.json() : null)
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    document.title = '관리자 통계 — 이력서공방';
    loadStats();
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);

  const StatCard = ({ label, value, sub, color = 'blue' }: { label: string; value: number; sub?: string; color?: string }) => {
    const colorMap: Record<string, string> = {
      blue: 'text-blue-600', green: 'text-green-600', purple: 'text-purple-600',
      amber: 'text-amber-600', rose: 'text-rose-600', indigo: 'text-indigo-600',
    };
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
        <p className={`text-2xl font-bold ${colorMap[color] || 'text-blue-600'}`}>{value.toLocaleString()}</p>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
      </div>
    );
  };

  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) return null;

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">관리자 통계</h1>
          <button
            onClick={() => loadStats()}
            className="text-xs px-3 py-2 min-h-[44px] min-w-[44px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-200 transition-colors"
          >
            새로고침
          </button>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">사이트 전체 현황을 한눈에 확인합니다</p>

        {/* Tab navigation */}
        <div className="flex gap-1 mb-6 overflow-x-auto scrollbar-none">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] text-sm rounded-xl whitespace-nowrap transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400">불러오는 중...</div>
        ) : !stats ? (
          <div className="text-center py-16 text-slate-400">통계를 불러올 수 없습니다</div>
        ) : (
          <>
            {activeTab === 'stats' && (
              <div className="space-y-6 animate-fade-in-up">
                {/* Users */}
                <section>
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-blue-500 rounded" />
                    회원
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label="전체 회원" value={stats.users.total} color="blue" />
                    <StatCard label="오늘 가입" value={stats.users.today} color="green" />
                    <StatCard label="이번 주" value={stats.users.week} color="purple" />
                    <StatCard label="이번 달" value={stats.users.month} color="indigo" />
                  </div>
                </section>

                {/* Resumes */}
                <section>
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-green-500 rounded" />
                    이력서
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label="전체 이력서" value={stats.resumes.total} color="green" />
                    <StatCard label="오늘 생성" value={stats.resumes.today} color="blue" />
                    <StatCard label="이번 주" value={stats.resumes.week} color="purple" />
                    <StatCard label="공개 이력서" value={stats.resumes.public} color="amber" />
                  </div>
                </section>

                {/* Content */}
                <section>
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-purple-500 rounded" />
                    콘텐츠
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label="템플릿" value={stats.content.templates} color="purple" />
                    <StatCard label="태그" value={stats.content.tags} color="indigo" />
                    <StatCard label="댓글" value={stats.content.comments} color="rose" />
                    <StatCard label="버전 기록" value={stats.content.versions} color="amber" />
                  </div>
                </section>

                {/* Activity */}
                <section>
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-amber-500 rounded" />
                    활동
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <StatCard label="총 조회수" value={stats.activity.totalViews} color="amber" />
                    <StatCard label="AI 변환" value={stats.activity.transforms} color="blue" />
                    <StatCard label="지원 내역" value={stats.activity.applications} color="green" />
                  </div>
                </section>

                {/* Weekly Overview */}
                <section>
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-rose-500 rounded" />
                    주간 활동
                  </h2>
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                      {[
                        { label: '신규 회원', value: stats.users.week, max: Math.max(stats.users.week, stats.resumes.week, 1), color: 'bg-blue-500' },
                        { label: '신규 이력서', value: stats.resumes.week, max: Math.max(stats.users.week, stats.resumes.week, 1), color: 'bg-green-500' },
                        { label: '총 활동', value: stats.content.versions, max: Math.max(stats.content.versions, 1), color: 'bg-purple-500' },
                      ].map(item => (
                        <div key={item.label} className="text-center">
                          <div className="h-24 flex items-end justify-center mb-2">
                            <div
                              className={`w-8 ${item.color} rounded-t transition-all duration-500`}
                              style={{ height: `${Math.max((item.value / item.max) * 100, 8)}%` }}
                            />
                          </div>
                          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{item.value}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-6 animate-fade-in-up">
                {/* Recent Users */}
                {stats.recentUsers && stats.recentUsers.length > 0 && (
                  <section>
                    <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-indigo-500 rounded" />
                      최근 가입 회원
                    </h2>
                    {/* Mobile card layout */}
                    <div className="space-y-2 sm:hidden">
                      {stats.recentUsers.map(u => (
                        <div key={u.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{u.name || '—'}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              u.provider === 'google' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                              u.provider === 'github' ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300' :
                              u.provider === 'kakao' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                              'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            }`}>{u.provider}</span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{new Date(u.createdAt).toLocaleDateString('ko-KR')}</p>
                        </div>
                      ))}
                    </div>
                    {/* Desktop table layout */}
                    <div className="hidden sm:block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900 text-left">
                            <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">이름</th>
                            <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">이메일</th>
                            <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">로그인</th>
                            <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">가입일</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {stats.recentUsers.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                              <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 font-medium">{u.name || '—'}</td>
                              <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{u.email}</td>
                              <td className="px-4 py-2.5">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  u.provider === 'google' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                  u.provider === 'github' ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300' :
                                  u.provider === 'kakao' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                                  'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                }`}>
                                  {u.provider}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-xs text-slate-400 dark:text-slate-500">{new Date(u.createdAt).toLocaleDateString('ko-KR')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

                {/* User Management */}
                <section>
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-rose-500 rounded" />
                    사용자 관리
                  </h2>
                  <UserManagement />
                </section>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="space-y-6 animate-fade-in-up">
                {/* Recent Public Resumes */}
                <section>
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-green-500 rounded" />
                    공개 이력서 관리
                  </h2>
                  <RecentResumes />
                </section>

                {/* Content Moderation */}
                <section>
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-red-500 rounded" />
                    콘텐츠 관리
                  </h2>
                  <ContentModeration />
                </section>
              </div>
            )}

            {activeTab === 'plans' && (
              <div className="space-y-6 animate-fade-in-up">
                {/* Plan Configuration */}
                <section>
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-blue-500 rounded" />
                    요금제 설정
                  </h2>
                  <PlanConfig />
                </section>

                {/* Quick Admin Links */}
                <section>
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-slate-500 rounded" />
                    관리 도구
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: '템플릿 관리', to: '/templates', icon: '📄' },
                      { label: '태그 관리', to: '/tags', icon: '🏷️' },
                      { label: '공개 이력서', to: '/explore', icon: '🔍' },
                      { label: '사용 가이드', to: '/tutorial', icon: '📖' },
                    ].map(link => (
                      <Link key={link.to} to={link.to} className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-sm transition-all duration-200 text-sm text-slate-700 dark:text-slate-300">
                        <span>{link.icon}</span>
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

function UserManagement() {
  const [users, setUsers] = useState<{ id: string; name: string; email: string; provider: string; role: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const perPage = 10;

  const load = () => {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/auth/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`이 사용자를 ${newRole === 'admin' ? '관리자로 지정' : '일반 사용자로 변경'}하시겠습니까?`)) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/auth/admin/users/${userId}/role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      toast(`역할이 ${newRole}로 변경되었습니다`, 'success');
      load();
    } else {
      toast('변경에 실패했습니다', 'error');
    }
  };

  if (loading) return <p className="text-sm text-slate-400 py-4 text-center">불러오는 중...</p>;

  const filtered = users.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <input
          type="search"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="이름 또는 이메일 검색..."
          className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-xs text-slate-400 shrink-0">{filtered.length}명</span>
      </div>
      {/* Mobile card layout */}
      <div className="space-y-2 sm:hidden">
        {paginated.map(u => (
          <div key={u.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{u.name || '—'}</span>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  u.provider === 'google' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                  u.provider === 'github' ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300' :
                  u.provider === 'local' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                }`}>{u.provider}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  u.role === 'admin' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}>{u.role || 'user'}</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-2">{u.email}</p>
            <button
              onClick={() => toggleRole(u.id, u.role || 'user')}
              className={`text-xs px-3 py-2 min-h-[44px] w-full rounded-lg transition-colors ${
                u.role === 'admin'
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100'
              }`}
            >
              {u.role === 'admin' ? '관리자 해제' : '관리자 지정'}
            </button>
          </div>
        ))}
      </div>
      {/* Desktop table layout */}
      <div className="hidden sm:block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 text-left">
              <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">이름</th>
              <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">이메일</th>
              <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">로그인</th>
              <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">역할</th>
              <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {paginated.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 font-medium">{u.name || '—'}</td>
                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{u.email}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    u.provider === 'google' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                    u.provider === 'github' ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300' :
                    u.provider === 'local' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                    'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                  }`}>{u.provider}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    u.role === 'admin' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}>{u.role || 'user'}</span>
                </td>
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => toggleRole(u.id, u.role || 'user')}
                    className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                      u.role === 'admin'
                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100'
                    }`}
                  >
                    {u.role === 'admin' ? '해제' : '관리자 지정'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-slate-400">{page} / {totalPages} 페이지</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-2 min-h-[44px] min-w-[44px] text-xs bg-slate-100 dark:bg-slate-700 rounded-lg disabled:opacity-30">이전</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-2 min-h-[44px] min-w-[44px] text-xs bg-slate-100 dark:bg-slate-700 rounded-lg disabled:opacity-30">다음</button>
          </div>
        </div>
      )}
    </div>
  );
}

function RecentResumes() {
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {

    fetch(`${API_URL}/api/resumes/public?limit=50`)
      .then(r => r.ok ? r.json() : { data: [] })
      .then(d => setResumes(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleHide = async (id: string) => {
    if (!confirm('이 이력서를 비공개로 변경하시겠습니까?')) return;
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/api/resumes/${id}/visibility`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ visibility: 'private' }),
    });
    if (res.ok) {
      toast('비공개로 변경되었습니다', 'success');
      setResumes(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 이력서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/api/resumes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      toast('이력서가 삭제되었습니다', 'success');
      setResumes(prev => prev.filter(r => r.id !== id));
    }
  };

  if (loading) return <p className="text-sm text-slate-400 py-4 text-center">불러오는 중...</p>;
  if (resumes.length === 0) return <p className="text-sm text-slate-400 py-4 text-center">공개 이력서가 없습니다</p>;

  const totalPages = Math.ceil(resumes.length / perPage);
  const paginated = resumes.slice((page - 1) * perPage, page * perPage);

  return (
    <div>
      <div className="space-y-2">
        {paginated.map(r => (
          <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 gap-2">
            <div className="min-w-0 flex-1">
              <Link to={`/resumes/${r.id}/preview`} className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 truncate block">
                {r.title || '제목 없음'}
              </Link>
              <span className="text-xs text-slate-400">{r.personalInfo?.name || '이름 없음'}</span>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button onClick={() => handleHide(r.id)} className="text-xs px-3 py-2 min-h-[44px] flex-1 sm:flex-initial bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-100 transition-colors">
                숨기기
              </button>
              <button onClick={() => handleDelete(r.id)} className="text-xs px-3 py-2 min-h-[44px] flex-1 sm:flex-initial bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 transition-colors">
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-slate-400">{page} / {totalPages} 페이지</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-2 min-h-[44px] min-w-[44px] text-xs bg-slate-100 dark:bg-slate-700 rounded-lg disabled:opacity-30">이전</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-2 min-h-[44px] min-w-[44px] text-xs bg-slate-100 dark:bg-slate-700 rounded-lg disabled:opacity-30">다음</button>
          </div>
        </div>
      )}
    </div>
  );
}

function PlanConfig() {
  const [plans, setPlans] = useState(PLANS.map(p => ({ ...p })));
  const [saved, setSaved] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  const updateFeature = (planIdx: number, feature: string, value: any) => {
    setPlans(prev => {
      const updated = [...prev];
      updated[planIdx] = {
        ...updated[planIdx],
        features: { ...updated[planIdx].features, [feature]: value },
      };
      return updated;
    });
    setSaved(false);
  };

  const updatePrice = (planIdx: number, price: number) => {
    setPlans(prev => {
      const updated = [...prev];
      updated[planIdx] = { ...updated[planIdx], price };
      return updated;
    });
    setSaved(false);
  };

  const handleSave = () => {
    // In production, this would save to backend
    localStorage.setItem('admin-plan-config', JSON.stringify(plans));
    setSaved(true);
    toast('요금제 설정이 저장되었습니다', 'success');
  };

  return (
    <div className="space-y-4">
      {plans.map((plan, planIdx) => (
        <div key={plan.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <button onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)} className="w-full flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">{plan.badge}</span>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">{plan.name}</h4>
            </div>
            <div className="flex items-center gap-3">
              {plan.id !== 'free' && (
                <span className="text-xs text-slate-400">{plan.price.toLocaleString()}원/월</span>
              )}
              <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedPlan === plan.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          {expandedPlan === plan.id && (
          <>
          {plan.id !== 'free' && (
            <div className="flex items-center gap-2 mb-3 mt-2">
              <span className="text-xs text-slate-500">월 가격:</span>
              <input
                type="number"
                value={plan.price}
                onChange={e => updatePrice(planIdx, parseInt(e.target.value) || 0)}
                className="w-24 px-2 py-1 text-sm text-right border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100"
              />
              <span className="text-xs text-slate-400">원</span>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            {[
              { key: 'maxResumes', label: '이력서 수', type: 'number' },
              { key: 'aiTransformsPerMonth', label: 'AI 변환/월', type: 'number' },
              { key: 'themes', label: '테마 수', type: 'number' },
              { key: 'atsCheck', label: 'ATS 검사', type: 'boolean' },
              { key: 'aiCoaching', label: 'AI 코칭', type: 'boolean' },
              { key: 'coverLetter', label: '자소서', type: 'boolean' },
              { key: 'translation', label: '번역', type: 'boolean' },
              { key: 'jobTracker', label: '지원관리', type: 'boolean' },
              { key: 'prioritySupport', label: '우선지원', type: 'boolean' },
            ].map(feat => (
              <div key={feat.key} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <span className="text-xs text-slate-600 dark:text-slate-400">{feat.label}</span>
                {feat.type === 'boolean' ? (
                  <button
                    onClick={() => updateFeature(planIdx, feat.key, !(plan.features as any)[feat.key])}
                    className={`w-10 h-6 min-w-[44px] rounded-full transition-colors ${(plan.features as any)[feat.key] ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <span className={`block w-4 h-4 bg-white rounded-full transition-transform ${(plan.features as any)[feat.key] ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                ) : (
                  <input
                    type="number"
                    value={(plan.features as any)[feat.key]}
                    onChange={e => updateFeature(planIdx, feat.key, parseInt(e.target.value) || 0)}
                    className="w-16 px-1.5 py-0.5 text-xs text-right border border-slate-200 dark:border-slate-600 rounded dark:bg-slate-800 dark:text-slate-200"
                  />
                )}
              </div>
            ))}
          </div>
          </>
          )}
        </div>
      ))}
      <button onClick={handleSave} className="px-5 py-3 min-h-[44px] bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">
        {saved ? '\u2713 저장됨' : '설정 저장'}
      </button>
      <p className="text-xs text-slate-400">-1 = 무제한, 0 = 사용 불가</p>
    </div>
  );
}

function ContentModeration() {
  const handleHideResume = async (resumeId: string) => {
    if (!confirm('이 이력서를 비공개로 변경하시겠습니까?')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/resumes/${resumeId}/visibility`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ visibility: 'private' }),
    });
    if (res.ok) {
      toast('이력서가 비공개로 변경되었습니다', 'success');
    } else {
      toast('변경에 실패했습니다', 'error');
    }
  };

  const handleDeleteComment = async (resumeId: string, commentId: string) => {
    if (!confirm('이 댓글을 삭제하시겠습니까?')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/resumes/${resumeId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      toast('댓글이 삭제되었습니다', 'success');
    } else {
      toast('삭제에 실패했습니다', 'error');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        부적절한 공개 콘텐츠를 비공개로 전환하거나 댓글을 삭제할 수 있습니다.
      </p>
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/explore"
            className="flex-1 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-center"
          >
            공개 이력서 검토 &rarr;
          </Link>
          <Link
            to="/applications"
            className="flex-1 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-center"
          >
            지원 목록 검토 &rarr;
          </Link>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 whitespace-pre-line">
          관리자 계정으로 이력서를 열면 모든 댓글에 &quot;삭제&quot; 버튼이 표시됩니다.{'\n'}공개 이력서의 &quot;공개 설정&quot;을 &quot;비공개&quot;로 변경하면 탐색에서 숨겨집니다.
        </p>
      </div>
    </div>
  );
}
