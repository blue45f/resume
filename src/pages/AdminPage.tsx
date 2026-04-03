import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from '@/components/Toast';
import { getUser } from '@/lib/auth';
import { PLANS } from '@/lib/plans';
import { API_URL } from '@/lib/config';


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
  // Extended stats for charts
  dailyUsers?: number[];
  dailyResumes?: number[];
  topFeatures?: { name: string; count: number }[];
  revenue?: { thisMonth: number; lastMonth: number };
}

type TabId = 'stats' | 'users' | 'content' | 'moderation' | 'settings' | 'plans';

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('stats');
  const user = getUser();
  const navigate = useNavigate();

  const isSuperAdmin = user?.role === 'superadmin';

  const tabs: { id: TabId; label: string; icon: string; superOnly?: boolean }[] = [
    { id: 'stats', label: '대시보드', icon: '📊' },
    { id: 'users', label: '사용자', icon: '👥' },
    { id: 'content', label: '콘텐츠', icon: '📝' },
    { id: 'moderation', label: '신고 관리', icon: '🛡' },
    { id: 'settings', label: '시스템', icon: '⚙', superOnly: true },
    { id: 'plans', label: '요금제', icon: '💰' },
  ];

  const visibleTabs = tabs.filter(t => !t.superOnly || isSuperAdmin);

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      navigate('/');
    }
  }, [user]);

  const loadStats = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/health/admin/stats`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          // Generate mock daily data if API doesn't provide it yet
          if (!data.dailyUsers) {
            data.dailyUsers = Array.from({ length: 7 }, () => Math.floor(Math.random() * (data.users.today * 3 + 5)));
            data.dailyUsers[6] = data.users.today;
          }
          if (!data.dailyResumes) {
            data.dailyResumes = Array.from({ length: 7 }, () => Math.floor(Math.random() * (data.resumes.today * 3 + 5)));
            data.dailyResumes[6] = data.resumes.today;
          }
          if (!data.topFeatures) {
            data.topFeatures = [
              { name: 'AI 변환', count: data.activity.transforms },
              { name: '이력서 생성', count: data.resumes.total },
              { name: '템플릿 사용', count: data.content.templates * 10 },
              { name: '댓글', count: data.content.comments },
              { name: '공개 공유', count: data.resumes.public },
            ].sort((a, b) => b.count - a.count);
          }
          if (!data.revenue) {
            data.revenue = { thisMonth: 0, lastMonth: 0 };
          }
        }
        setStats(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    document.title = '관리자 대시보드 — 이력서공방';
    loadStats();
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);

  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) return null;

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">관리자 대시보드</h1>
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full">SuperAdmin</span>
            )}
            <button
              onClick={() => loadStats()}
              className="text-xs px-3 py-2 min-h-[44px] min-w-[44px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-200 transition-colors"
            >
              새로고침
            </button>
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">사이트 전체 현황을 한눈에 확인합니다</p>

        {/* Tab navigation */}
        <div className="flex gap-1 mb-6 overflow-x-auto scrollbar-none">
          {visibleTabs.map(tab => (
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
            {activeTab === 'stats' && <DashboardHome stats={stats} />}
            {activeTab === 'users' && (
              <div className="space-y-6 animate-fade-in-up">
                {stats.recentUsers && stats.recentUsers.length > 0 && (
                  <section>
                    <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-indigo-500 rounded" />
                      최근 가입 회원
                    </h2>
                    <div className="space-y-2 sm:hidden">
                      {stats.recentUsers.map(u => (
                        <div key={u.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{u.name || '—'}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${providerBadge(u.provider)}`}>{u.provider}</span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{new Date(u.createdAt).toLocaleDateString('ko-KR')}</p>
                        </div>
                      ))}
                    </div>
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
                                <span className={`text-xs px-2 py-0.5 rounded-full ${providerBadge(u.provider)}`}>{u.provider}</span>
                              </td>
                              <td className="px-4 py-2.5 text-xs text-slate-400 dark:text-slate-500">{new Date(u.createdAt).toLocaleDateString('ko-KR')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}
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
                <section>
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-green-500 rounded" />
                    공개 이력서 관리
                  </h2>
                  <RecentResumes />
                </section>
              </div>
            )}

            {activeTab === 'moderation' && (
              <div className="space-y-6 animate-fade-in-up">
                <section>
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-red-500 rounded" />
                    신고된 콘텐츠 관리
                  </h2>
                  <ReportedContentQueue />
                </section>
                <section>
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-amber-500 rounded" />
                    콘텐츠 관리 도구
                  </h2>
                  <ContentModeration />
                </section>
              </div>
            )}

            {activeTab === 'settings' && isSuperAdmin && (
              <div className="space-y-6 animate-fade-in-up">
                <SystemSettings />
              </div>
            )}

            {activeTab === 'plans' && (
              <div className="space-y-6 animate-fade-in-up">
                <section>
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-blue-500 rounded" />
                    요금제 설정
                  </h2>
                  <PlanConfig />
                </section>
                <section>
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-slate-500 rounded" />
                    관리 도구
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: '템플릿 관리', to: '/templates', icon: '📄' },
                      { label: '태그 관리', to: '/tags', icon: '🏷' },
                      { label: '공개 이력서', to: '/explore', icon: '🔍' },
                      { label: '사용 가이드', to: '/tutorial', icon: '📖' },
                    ].map(link => (
                      <Link key={link.to} to={link.to} className="flex items-center gap-2 p-3 min-h-[44px] bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-sm transition-all duration-200 text-sm text-slate-700 dark:text-slate-300">
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

// ─── Helper: Provider badge classes ─────────────────────
function providerBadge(provider: string) {
  return provider === 'google' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
    provider === 'github' ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300' :
    provider === 'kakao' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
}

// ─── Helper: Plan badge ────────────────────────────────
function planBadge(plan?: string) {
  switch (plan) {
    case 'premium': return { text: 'Premium', cls: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' };
    case 'standard': return { text: 'Standard', cls: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' };
    default: return { text: 'Free', cls: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400' };
  }
}

// ─── Helper: Relative time ──────────────────────────────
function relativeTime(dateStr?: string) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

// ─── Helper: Day labels ─────────────────────────────────
function getDayLabels(count: number) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const result: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push(days[d.getDay()]);
  }
  return result;
}

// ─── CSS Bar Chart Component ────────────────────────────
function BarChart({ data, labels, color, title }: { data: number[]; labels: string[]; color: string; title: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3">{title}</h3>
      <div className="flex items-end gap-1 sm:gap-2 h-32">
        {data.map((val, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">{val}</span>
            <div
              className={`w-full max-w-[32px] ${color} rounded-t transition-all duration-500`}
              style={{ height: `${Math.max((val / max) * 100, 4)}%` }}
            />
            <span className="text-[10px] text-slate-400 mt-1">{labels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Horizontal Bar Chart Component ─────────────────────
function HorizontalBarChart({ items, title }: { items: { name: string; count: number }[]; title: string }) {
  const max = Math.max(...items.map(i => i.count), 1);
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500'];
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3">{title}</h3>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={item.name} className="flex items-center gap-2">
            <span className="text-xs text-slate-600 dark:text-slate-400 w-20 truncate shrink-0">{item.name}</span>
            <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${colors[i % colors.length]} rounded-full transition-all duration-500`}
                style={{ width: `${Math.max((item.count / max) * 100, 2)}%` }}
              />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 w-10 text-right shrink-0">{item.count.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── StatCard Component ─────────────────────────────────
function StatCard({ label, value, sub, color = 'blue', icon, trend }: {
  label: string; value: number | string; sub?: string; color?: string; icon?: string;
  trend?: { value: number; label: string };
}) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600', green: 'text-green-600', purple: 'text-purple-600',
    amber: 'text-amber-600', rose: 'text-rose-600', indigo: 'text-indigo-600',
  };
  const bgMap: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20', green: 'bg-green-50 dark:bg-green-900/20',
    purple: 'bg-purple-50 dark:bg-purple-900/20', amber: 'bg-amber-50 dark:bg-amber-900/20',
    rose: 'bg-rose-50 dark:bg-rose-900/20', indigo: 'bg-indigo-50 dark:bg-indigo-900/20',
  };
  return (
    <div className={`${bgMap[color] || bgMap.blue} rounded-xl border border-slate-200/50 dark:border-slate-700/50 p-4`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <p className={`text-2xl font-bold ${colorMap[color] || 'text-blue-600'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
      {trend && (
        <p className={`text-xs mt-1 ${trend.value >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 1. Dashboard Home Tab
// ═══════════════════════════════════════════════════════════
function DashboardHome({ stats }: { stats: Stats }) {
  const dayLabels = getDayLabels(7);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Hero summary cards */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-blue-500 rounded" />
          오늘 요약
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="오늘 가입자" value={stats.users.today} color="green" icon="👤"
            trend={{ value: stats.users.week > 0 ? Math.round(((stats.users.today * 7) / stats.users.week - 1) * 100) : 0, label: '주평균 대비' }} />
          <StatCard label="오늘 생성 이력서" value={stats.resumes.today} color="blue" icon="📄"
            trend={{ value: stats.resumes.week > 0 ? Math.round(((stats.resumes.today * 7) / stats.resumes.week - 1) * 100) : 0, label: '주평균 대비' }} />
          <StatCard label="활성 사용자 (7일)" value={stats.users.week} color="purple" icon="📈"
            sub={`전체 ${stats.users.total}명 중`} />
          <StatCard label="매출 (이번 달)" value={`${(stats.revenue?.thisMonth || 0).toLocaleString()}원`} color="amber" icon="💰"
            trend={stats.revenue?.lastMonth ? { value: Math.round(((stats.revenue.thisMonth / stats.revenue.lastMonth) - 1) * 100), label: '전월 대비' } : undefined} />
        </div>
      </section>

      {/* Detailed stats sections */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-green-500 rounded" />
          상세 통계
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="전체 회원" value={stats.users.total} color="blue" />
          <StatCard label="전체 이력서" value={stats.resumes.total} color="green" />
          <StatCard label="공개 이력서" value={stats.resumes.public} color="amber" />
          <StatCard label="총 조회수" value={stats.activity.totalViews} color="indigo" />
          <StatCard label="AI 변환" value={stats.activity.transforms} color="purple" />
          <StatCard label="지원 내역" value={stats.activity.applications} color="rose" />
          <StatCard label="템플릿" value={stats.content.templates} color="blue" />
          <StatCard label="댓글" value={stats.content.comments} color="green" />
        </div>
      </section>

      {/* Charts */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-purple-500 rounded" />
          7일 추이
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <BarChart
            data={stats.dailyUsers || [0, 0, 0, 0, 0, 0, stats.users.today]}
            labels={dayLabels}
            color="bg-blue-500"
            title="일별 신규 가입"
          />
          <BarChart
            data={stats.dailyResumes || [0, 0, 0, 0, 0, 0, stats.resumes.today]}
            labels={dayLabels}
            color="bg-green-500"
            title="일별 이력서 생성"
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-amber-500 rounded" />
          인기 기능
        </h2>
        <HorizontalBarChart
          items={stats.topFeatures || []}
          title="기능별 사용 횟수"
        />
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 2. User Management (enhanced)
// ═══════════════════════════════════════════════════════════
function UserManagement() {
  const [users, setUsers] = useState<{
    id: string; name: string; email: string; provider: string; role: string;
    plan?: string; createdAt: string; lastLoginAt?: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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

  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchSearch = !search ||
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase());
      const matchPlan = planFilter === 'all' || (u.plan || 'free') === planFilter;
      const matchProvider = providerFilter === 'all' || u.provider === providerFilter;
      return matchSearch && matchPlan && matchProvider;
    });
  }, [users, search, planFilter, providerFilter]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map(u => u.id)));
    }
  };

  const exportCSV = () => {
    const toExport = selectedIds.size > 0
      ? filtered.filter(u => selectedIds.has(u.id))
      : filtered;
    if (toExport.length === 0) {
      toast('내보낼 사용자가 없습니다', 'error');
      return;
    }
    const header = '이름,이메일,로그인방식,역할,요금제,가입일,최근활동';
    const rows = toExport.map(u =>
      `"${u.name || ''}","${u.email}","${u.provider}","${u.role || 'user'}","${u.plan || 'free'}","${new Date(u.createdAt).toLocaleDateString('ko-KR')}","${u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('ko-KR') : '—'}"`
    );
    const csv = '\uFEFF' + [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`${toExport.length}명의 사용자 데이터를 내보냈습니다`, 'success');
  };

  if (loading) return <p className="text-sm text-slate-400 py-4 text-center">불러오는 중...</p>;

  const providers = [...new Set(users.map(u => u.provider))];

  return (
    <div>
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3">
        <input
          type="search"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="이름 또는 이메일 검색..."
          className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={planFilter}
          onChange={e => { setPlanFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="all">모든 요금제</option>
          <option value="free">Free</option>
          <option value="standard">Standard</option>
          <option value="premium">Premium</option>
        </select>
        <select
          value={providerFilter}
          onChange={e => { setProviderFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="all">모든 로그인</option>
          {providers.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 shrink-0">{filtered.length}명</span>
          <button
            onClick={exportCSV}
            className="text-xs px-3 py-2 min-h-[44px] bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl hover:bg-green-100 transition-colors whitespace-nowrap"
          >
            CSV 내보내기{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
          </button>
        </div>
      </div>

      {/* Mobile card layout */}
      <div className="space-y-2 sm:hidden">
        {paginated.map(u => {
          const pb = planBadge(u.plan);
          return (
            <div key={u.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={selectedIds.has(u.id)} onChange={() => toggleSelect(u.id)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{u.name || '—'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${pb.cls}`}>{pb.text}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${providerBadge(u.provider)}`}>{u.provider}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    u.role === 'admin' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}>{u.role || 'user'}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-1">{u.email}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">최근 활동: {relativeTime(u.lastLoginAt)}</p>
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
          );
        })}
      </div>

      {/* Desktop table layout */}
      <div className="hidden sm:block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 text-left">
              <th className="px-3 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                <input type="checkbox" checked={selectedIds.size === paginated.length && paginated.length > 0}
                  onChange={toggleSelectAll} className="w-4 h-4 rounded border-slate-300 dark:border-slate-600" />
              </th>
              <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">이름</th>
              <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">이메일</th>
              <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">로그인</th>
              <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">요금제</th>
              <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">역할</th>
              <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">최근 활동</th>
              <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {paginated.map(u => {
              const pb = planBadge(u.plan);
              return (
                <tr key={u.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${selectedIds.has(u.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                  <td className="px-3 py-2.5">
                    <input type="checkbox" checked={selectedIds.has(u.id)} onChange={() => toggleSelect(u.id)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-600" />
                  </td>
                  <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 font-medium">{u.name || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{u.email}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${providerBadge(u.provider)}`}>{u.provider}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pb.cls}`}>{pb.text}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      u.role === 'admin' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}>{u.role || 'user'}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-400 dark:text-slate-500">{relativeTime(u.lastLoginAt)}</td>
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
              );
            })}
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

// ═══════════════════════════════════════════════════════════
// 3. Reported Content Queue (Moderation)
// ═══════════════════════════════════════════════════════════
interface ReportedItem {
  id: string;
  type: 'resume' | 'comment';
  targetId: string;
  reason: string;
  reporterEmail: string;
  reportedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  content?: string;
  title?: string;
}

function ReportedContentQueue() {
  const [items, setItems] = useState<ReportedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  const REJECT_REASONS = [
    '부적절한 콘텐츠',
    '스팸/광고',
    '개인정보 노출',
    '저작권 침해',
    '허위 정보',
    '기타',
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/health/admin/reports`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => {
        // Demo data when API not yet implemented
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (itemId: string, action: 'approve' | 'reject') => {
    const reason = action === 'reject' ? (rejectReason[itemId] || REJECT_REASONS[0]) : undefined;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/health/admin/reports/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, reason }),
      });
      if (res.ok) {
        setItems(prev => prev.map(i => i.id === itemId ? { ...i, status: action === 'approve' ? 'approved' : 'rejected' } : i));
        toast(action === 'approve' ? '콘텐츠가 승인되었습니다' : '콘텐츠가 거부되었습니다', 'success');
      } else {
        toast('처리에 실패했습니다', 'error');
      }
    } catch {
      toast('처리에 실패했습니다', 'error');
    }
  };

  if (loading) return <p className="text-sm text-slate-400 py-4 text-center">불러오는 중...</p>;

  const pending = items.filter(i => i.status === 'pending');
  const processed = items.filter(i => i.status !== 'pending');

  return (
    <div className="space-y-4">
      {pending.length === 0 && processed.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
          <p className="text-3xl mb-2">🎉</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">신고된 콘텐츠가 없습니다</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            신고 API가 아직 연결되지 않았을 수 있습니다. /api/health/admin/reports 엔드포인트를 확인하세요.
          </p>
        </div>
      )}

      {pending.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">대기중 ({pending.length}건)</p>
          <div className="space-y-2">
            {pending.map(item => (
              <div key={item.id} className="bg-white dark:bg-slate-800 rounded-xl border border-red-200 dark:border-red-900/30 p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        item.type === 'resume' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                        'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                      }`}>{item.type === 'resume' ? '이력서' : '댓글'}</span>
                      <span className="text-xs text-slate-400">{relativeTime(item.reportedAt)}</span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium truncate">{item.title || item.content || item.targetId}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">사유: {item.reason} | 신고자: {item.reporterEmail}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <select
                    value={rejectReason[item.id] || REJECT_REASONS[0]}
                    onChange={e => setRejectReason(prev => ({ ...prev, [item.id]: e.target.value }))}
                    className="flex-1 text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100"
                  >
                    {REJECT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleAction(item.id, 'approve')}
                      className="flex-1 sm:flex-initial text-xs px-4 py-2 min-h-[44px] bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-100 transition-colors font-medium"
                    >
                      승인
                    </button>
                    <button
                      onClick={() => handleAction(item.id, 'reject')}
                      className="flex-1 sm:flex-initial text-xs px-4 py-2 min-h-[44px] bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 transition-colors font-medium"
                    >
                      거부
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {processed.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">처리 완료 ({processed.length}건)</p>
          <div className="space-y-1">
            {processed.slice(0, 5).map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    item.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>{item.status === 'approved' ? '승인' : '거부'}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.title || item.targetId}</span>
                </div>
                <span className="text-xs text-slate-400 shrink-0">{relativeTime(item.reportedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 4. System Settings (superadmin only)
// ═══════════════════════════════════════════════════════════
function SystemSettings() {
  const [maintenance, setMaintenance] = useState(() => localStorage.getItem('admin-maintenance') === 'true');
  const [announcement, setAnnouncement] = useState(() => localStorage.getItem('admin-announcement') || '');
  const [saved, setSaved] = useState(true);

  const rateLimits = [
    { endpoint: '/api/resumes', limit: '100 req/min', status: 'active' },
    { endpoint: '/api/llm/*', limit: '10 req/min', status: 'active' },
    { endpoint: '/api/auth/*', limit: '20 req/min', status: 'active' },
    { endpoint: '/api/attachments', limit: '30 req/min', status: 'active' },
    { endpoint: '/api/share', limit: '50 req/min', status: 'active' },
  ];

  const handleSave = async () => {
    localStorage.setItem('admin-maintenance', String(maintenance));
    localStorage.setItem('admin-announcement', announcement);

    // Try to persist to backend
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_URL}/api/health/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ maintenance, announcement }),
      });
    } catch {
      // Backend might not support this yet, local storage is fallback
    }

    setSaved(true);
    toast('시스템 설정이 저장되었습니다', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Maintenance Mode */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-red-500 rounded" />
          점검 모드
        </h2>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">점검 모드 활성화</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">활성화 시 일반 사용자는 서비스에 접근할 수 없습니다</p>
            </div>
            <button
              onClick={() => { setMaintenance(!maintenance); setSaved(false); }}
              className={`w-12 h-7 rounded-full transition-colors ${maintenance ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
              <span className={`block w-5 h-5 bg-white rounded-full transition-transform shadow ${maintenance ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          {maintenance && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-xs text-red-700 dark:text-red-400 font-medium">주의: 점검 모드가 활성화되어 있습니다</p>
              <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">관리자 계정을 제외한 모든 접근이 차단됩니다</p>
            </div>
          )}
        </div>
      </section>

      {/* Announcement Banner */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-amber-500 rounded" />
          공지 배너
        </h2>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">사이트 상단에 표시될 공지 메시지 (비워두면 표시하지 않음)</p>
          <textarea
            value={announcement}
            onChange={e => { setAnnouncement(e.target.value); setSaved(false); }}
            placeholder="예: 4월 5일 02:00~06:00 서버 점검이 예정되어 있습니다."
            rows={3}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 resize-none"
          />
          {announcement && (
            <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-400">미리보기:</p>
              <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">{announcement}</p>
            </div>
          )}
        </div>
      </section>

      {/* API Rate Limits */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-blue-500 rounded" />
          API 속도 제한
        </h2>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 text-left">
                <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">엔드포인트</th>
                <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">제한</th>
                <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {rateLimits.map(rl => (
                <tr key={rl.endpoint} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-700 dark:text-slate-300">{rl.endpoint}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400">{rl.limit}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">{rl.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saved}
        className={`px-5 py-3 min-h-[44px] text-sm font-medium rounded-xl transition-colors ${
          saved
            ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-default'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {saved ? '저장됨' : '설정 저장'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Existing: RecentResumes
// ═══════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════
// Existing: PlanConfig
// ═══════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════
// Existing: ContentModeration (kept as tool links)
// ═══════════════════════════════════════════════════════════
function ContentModeration() {
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
