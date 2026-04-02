import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
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
                  <span className="w-1.5 h-4 bg-rose-500 rounded" />
                  최근 가입 회원
                </h2>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                        <th className="px-4 py-2 text-xs font-medium text-slate-500 dark:text-slate-400">이름</th>
                        <th className="px-4 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:table-cell">이메일</th>
                        <th className="px-4 py-2 text-xs font-medium text-slate-500 dark:text-slate-400">로그인</th>
                        <th className="px-4 py-2 text-xs font-medium text-slate-500 dark:text-slate-400">가입일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentUsers.map(u => (
                        <tr key={u.id} className="border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                          <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{u.name || '(미설정)'}</td>
                          <td className="px-4 py-2 text-slate-500 dark:text-slate-400 hidden sm:table-cell">{u.email}</td>
                          <td className="px-4 py-2 text-slate-500 dark:text-slate-400 capitalize">{u.provider}</td>
                          <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{new Date(u.createdAt).toLocaleDateString('ko-KR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

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
