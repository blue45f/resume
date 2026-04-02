import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from '@/components/Toast';
import { getUser } from '@/lib/auth';

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
  const user = getUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
    }
  }, [user]);

  useEffect(() => {
    document.title = '관리자 통계 — 이력서공방';
    fetch(`${API_URL}/api/health/admin/stats`)
      .then(r => r.ok ? r.json() : null)
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
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

  if (!user || user.role !== 'admin') return null;

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">관리자 통계</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">사이트 전체 현황을 한눈에 확인합니다</p>

        {loading ? (
          <div className="text-center py-16 text-slate-400">불러오는 중...</div>
        ) : !stats ? (
          <div className="text-center py-16 text-slate-400">통계를 불러올 수 없습니다</div>
        ) : (
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
            {/* Recent Users */}
            {stats.recentUsers && stats.recentUsers.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-indigo-500 rounded" />
                  최근 가입 회원
                </h2>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 text-left">
                        <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">이름</th>
                        <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:table-cell">이메일</th>
                        <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">로그인</th>
                        <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">가입일</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {stats.recentUsers.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 font-medium">{u.name || '—'}</td>
                          <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 hidden sm:table-cell">{u.email}</td>
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

            {/* Weekly Overview */}
            <section>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-rose-500 rounded" />
                주간 활동
              </h2>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="grid grid-cols-3 gap-4">
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

            {/* Content Moderation */}
            <section className="mt-6">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-red-500 rounded" />
                콘텐츠 관리
              </h2>
              <ContentModeration />
            </section>

            {/* User Management */}
            <section>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-rose-500 rounded" />
                사용자 관리
              </h2>
              <UserManagement />
            </section>

            {/* Quick Admin Links */}
            <section className="mt-6">
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
      </main>
      <Footer />
    </>
  );
}

function UserManagement() {
  const [users, setUsers] = useState<{ id: string; name: string; email: string; provider: string; role: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-900 text-left">
            <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">이름</th>
            <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:table-cell">이메일</th>
            <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">로그인</th>
            <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">역할</th>
            <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">관리</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
          {users.map(u => (
            <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 font-medium">{u.name || '—'}</td>
              <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 hidden sm:table-cell truncate max-w-[200px]">{u.email}</td>
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
        <p className="text-xs text-slate-400 dark:text-slate-500">
          관리자 계정으로 탐색 페이지에서 이력서를 열면 비공개 전환 및 댓글 삭제가 가능합니다.
        </p>
      </div>
    </div>
  );
}
