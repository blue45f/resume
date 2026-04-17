import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as RadixDialog from '@radix-ui/react-dialog';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from '@/components/Toast';
import { getUser } from '@/lib/auth';
import { PLANS } from '@/lib/plans';
import { API_URL } from '@/lib/config';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const CHART_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

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
  coaching?: {
    totalCoaches: number;
    activeCoaches: number;
    totalSessions: number;
    totalCommission: number;
    byStatus: {
      requested?: number;
      confirmed?: number;
      completed?: number;
      cancelled?: number;
      refunded?: number;
    };
  };
  recentUsers?: RecentUser[];
  // Extended stats for charts
  dailyUsers?: number[];
  dailyResumes?: number[];
  topFeatures?: { name: string; count: number }[];
  revenue?: { thisMonth: number; lastMonth: number };
}

type TabId =
  | 'stats'
  | 'users'
  | 'content'
  | 'moderation'
  | 'settings'
  | 'plans'
  | 'banners'
  | 'notices'
  | 'community'
  | 'extlinks'
  | 'permissions'
  | 'forbidden-words';

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
    { id: 'banners', label: '배너', icon: '🖼' },
    { id: 'notices', label: '공지사항', icon: '📢' },
    { id: 'community', label: '커뮤니티', icon: '💬' },
    { id: 'extlinks', label: '채용링크', icon: '🔗' },
    { id: 'content', label: '콘텐츠', icon: '📝' },
    { id: 'permissions', label: '권한 관리', icon: '🔐' },
    { id: 'forbidden-words', label: '금칙어', icon: '🚫' },
    { id: 'moderation', label: '신고 관리', icon: '🛡' },
    { id: 'settings', label: '시스템', icon: '⚙', superOnly: true },
    { id: 'plans', label: '요금제', icon: '💰' },
  ];

  const visibleTabs = tabs.filter((t) => !t.superOnly || isSuperAdmin);

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
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          // Generate mock daily data if API doesn't provide it yet
          if (!data.dailyUsers) {
            data.dailyUsers = Array.from({ length: 7 }, () =>
              Math.floor(Math.random() * (data.users.today * 3 + 5)),
            );
            data.dailyUsers[6] = data.users.today;
          }
          if (!data.dailyResumes) {
            data.dailyResumes = Array.from({ length: 7 }, () =>
              Math.floor(Math.random() * (data.resumes.today * 3 + 5)),
            );
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
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, []);

  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) return null;

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        role="main"
      >
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            관리자 대시보드
          </h1>
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full">
                SuperAdmin
              </span>
            )}
            <button
              onClick={() => loadStats()}
              className="text-xs px-3 py-2 min-h-[44px] min-w-[44px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-200 transition-colors"
            >
              새로고침
            </button>
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          사이트 전체 현황을 한눈에 확인합니다
        </p>

        {/* Tab navigation */}
        <div className="flex gap-1 mb-6 overflow-x-auto scrollbar-none">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] text-sm rounded-xl whitespace-nowrap transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
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
            {activeTab === 'banners' && <AdminBannersTab />}
            {activeTab === 'notices' && <AdminNoticesTab />}
            {activeTab === 'community' && <AdminCommunityTab />}
            {activeTab === 'extlinks' && <AdminExtLinksTab />}
            {activeTab === 'permissions' && <AdminPermissionsTab />}
            {activeTab === 'forbidden-words' && <AdminForbiddenWordsTab />}
            {activeTab === 'users' && (
              <div className="space-y-6 animate-fade-in-up">
                {stats.recentUsers && stats.recentUsers.length > 0 && (
                  <section>
                    <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-indigo-500 rounded" />
                      최근 가입 회원
                    </h2>
                    <div className="space-y-2 sm:hidden">
                      {stats.recentUsers.map((u) => (
                        <div
                          key={u.id}
                          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {u.name || '—'}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${providerBadge(u.provider)}`}
                            >
                              {u.provider}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {u.email}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            {new Date(u.createdAt).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="hidden sm:block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900 text-left">
                            <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                              이름
                            </th>
                            <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                              이메일
                            </th>
                            <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                              로그인
                            </th>
                            <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                              가입일
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {stats.recentUsers.map((u) => (
                            <tr
                              key={u.id}
                              className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                            >
                              <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 font-medium">
                                {u.name || '—'}
                              </td>
                              <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">
                                {u.email}
                              </td>
                              <td className="px-4 py-2.5">
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full ${providerBadge(u.provider)}`}
                                >
                                  {u.provider}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-xs text-slate-400 dark:text-slate-500">
                                {new Date(u.createdAt).toLocaleDateString('ko-KR')}
                              </td>
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
                    ].map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        className="flex items-center gap-2 p-3 min-h-[44px] bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-sm transition-all duration-200 text-sm text-slate-700 dark:text-slate-300"
                      >
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
  return provider === 'google'
    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
    : provider === 'github'
      ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
      : provider === 'kakao'
        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
}

// ─── Helper: Plan badge ────────────────────────────────
function planBadge(plan?: string) {
  switch (plan) {
    case 'premium':
      return {
        text: 'Premium',
        cls: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      };
    case 'standard':
      return {
        text: 'Standard',
        cls: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      };
    default:
      return {
        text: 'Free',
        cls: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
      };
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

// ─── Recharts AreaChart Component ──────────────────────
function AreaChartCard({
  data,
  labels,
  color,
  title,
}: {
  data: number[];
  labels: string[];
  color: string;
  title: string;
}) {
  const chartData = data.map((val, i) => ({ name: labels[i], value: val }));
  const gradientId = `grad-${title.replace(/\s/g, '')}`;
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.15} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Recharts Horizontal BarChart Component ─────────────
function HorizontalBarChart({
  items,
  title,
}: {
  items: { name: string; count: number }[];
  title: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={Math.max(items.length * 36, 120)}>
        <RechartsBarChart
          data={items.map((i) => ({ name: i.name, value: i.count }))}
          layout="vertical"
          margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            width={70}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              fontSize: 12,
            }}
            formatter={(v: number) => [v.toLocaleString(), '횟수']}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {items.map((_, i) => (
              <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── 플랜별 분포 PieChart Component ─────────────────────
function PlanPieChart({ stats }: { stats: Stats }) {
  const planData = [
    { name: 'Free', value: Math.max(0, stats.users.total - 10) },
    { name: 'Standard', value: 7 },
    { name: 'Premium', value: 3 },
  ].filter((d) => d.value > 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3">플랜별 분포</h3>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={planData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={65}
            paddingAngle={3}
            dataKey="value"
          >
            {planData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              fontSize: 12,
            }}
            formatter={(v: number, name: string) => [`${v}명`, name]}
          />
          <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── StatCard Component ─────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  color = 'blue',
  icon,
  trend,
}: {
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
  icon?: string;
  trend?: { value: number; label: string };
}) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    amber: 'text-amber-600',
    rose: 'text-rose-600',
    indigo: 'text-indigo-600',
  };
  const bgMap: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20',
    green: 'bg-green-50 dark:bg-green-900/20',
    purple: 'bg-purple-50 dark:bg-purple-900/20',
    amber: 'bg-amber-50 dark:bg-amber-900/20',
    rose: 'bg-rose-50 dark:bg-rose-900/20',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20',
  };
  return (
    <div
      className={`${bgMap[color] || bgMap.blue} rounded-xl border border-slate-200/50 dark:border-slate-700/50 p-4`}
    >
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
          {trend.value >= 0 ? '+' : ''}
          {trend.value}% {trend.label}
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
          <StatCard
            label="오늘 가입자"
            value={stats.users.today}
            color="green"
            icon="👤"
            trend={{
              value:
                stats.users.week > 0
                  ? Math.round(((stats.users.today * 7) / stats.users.week - 1) * 100)
                  : 0,
              label: '주평균 대비',
            }}
          />
          <StatCard
            label="오늘 생성 이력서"
            value={stats.resumes.today}
            color="blue"
            icon="📄"
            trend={{
              value:
                stats.resumes.week > 0
                  ? Math.round(((stats.resumes.today * 7) / stats.resumes.week - 1) * 100)
                  : 0,
              label: '주평균 대비',
            }}
          />
          <StatCard
            label="활성 사용자 (7일)"
            value={stats.users.week}
            color="purple"
            icon="📈"
            sub={`전체 ${stats.users.total}명 중`}
          />
          <StatCard
            label="매출 (이번 달)"
            value={`${(stats.revenue?.thisMonth || 0).toLocaleString()}원`}
            color="amber"
            icon="💰"
            trend={
              stats.revenue?.lastMonth
                ? {
                    value: Math.round(
                      (stats.revenue.thisMonth / stats.revenue.lastMonth - 1) * 100,
                    ),
                    label: '전월 대비',
                  }
                : undefined
            }
          />
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
          <AreaChartCard
            data={stats.dailyUsers || [0, 0, 0, 0, 0, 0, stats.users.today]}
            labels={dayLabels}
            color="#6366f1"
            title="일별 신규 가입"
          />
          <AreaChartCard
            data={stats.dailyResumes || [0, 0, 0, 0, 0, 0, stats.resumes.today]}
            labels={dayLabels}
            color="#10b981"
            title="일별 이력서 생성"
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-amber-500 rounded" />
          인기 기능 / 플랜 분포
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <HorizontalBarChart items={stats.topFeatures || []} title="기능별 사용 횟수" />
          <PlanPieChart stats={stats} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-rose-500 rounded" />
          코칭 현황
        </h2>
        <CoachingStatsWidget coaching={stats.coaching} />
      </section>
    </div>
  );
}

function CoachingStatsWidget({ coaching }: { coaching?: Stats['coaching'] }) {
  const totalCoaches = coaching?.totalCoaches ?? 0;
  const activeCoaches = coaching?.activeCoaches ?? 0;
  const totalSessions = coaching?.totalSessions ?? 0;
  const totalCommission = coaching?.totalCommission ?? 0;
  const by = coaching?.byStatus || {};

  return (
    <div className="imp-card p-4 sm:p-5 space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="총 코치 수" value={totalCoaches} color="rose" icon="🎓" />
        <StatCard
          label="활성 코치"
          value={activeCoaches}
          color="green"
          icon="✅"
          sub={
            totalCoaches > 0
              ? `${Math.round((activeCoaches / totalCoaches) * 100)}% 활성`
              : undefined
          }
        />
        <StatCard label="총 세션 수" value={totalSessions} color="blue" icon="📅" />
        <StatCard
          label="총 플랫폼 수수료"
          value={`${totalCommission.toLocaleString()}원`}
          color="amber"
          icon="💰"
          sub="완료/확정 세션 합산 (15%)"
        />
      </div>

      {totalSessions > 0 && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            상태별 세션
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              {
                key: 'requested',
                label: '요청됨',
                cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
              },
              {
                key: 'confirmed',
                label: '확정',
                cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
              },
              {
                key: 'completed',
                label: '완료',
                cls: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
              },
              {
                key: 'cancelled',
                label: '취소',
                cls: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
              },
              {
                key: 'refunded',
                label: '환불',
                cls: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
              },
            ].map((item) => {
              const n = Number((by as any)[item.key] ?? 0);
              return (
                <span
                  key={item.key}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-full ${item.cls}`}
                >
                  {item.label} <span className="font-bold">{n}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 2. User Management (enhanced)
// ═══════════════════════════════════════════════════════════
function UserManagement() {
  const [users, setUsers] = useState<
    {
      id: string;
      name: string;
      email: string;
      provider: string;
      role: string;
      plan?: string;
      createdAt: string;
      lastLoginAt?: string;
    }[]
  >([]);
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
      .then((r) => (r.ok ? r.json() : []))
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (
      !confirm(
        `이 사용자를 ${newRole === 'admin' ? '관리자로 지정' : '일반 사용자로 변경'}하시겠습니까?`,
      )
    )
      return;
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
    return users.filter((u) => {
      const matchSearch =
        !search ||
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
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((u) => u.id)));
    }
  };

  const exportCSV = () => {
    const toExport =
      selectedIds.size > 0 ? filtered.filter((u) => selectedIds.has(u.id)) : filtered;
    if (toExport.length === 0) {
      toast('내보낼 사용자가 없습니다', 'error');
      return;
    }
    const header = '이름,이메일,로그인방식,역할,요금제,가입일,최근활동';
    const rows = toExport.map(
      (u) =>
        `"${u.name || ''}","${u.email}","${u.provider}","${u.role || 'user'}","${u.plan || 'free'}","${new Date(u.createdAt).toLocaleDateString('ko-KR')}","${u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('ko-KR') : '—'}"`,
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

  const providers = [...new Set(users.map((u) => u.provider))];

  return (
    <div>
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="이름 또는 이메일 검색..."
          className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={planFilter}
          onChange={(e) => {
            setPlanFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="all">모든 요금제</option>
          <option value="free">Free</option>
          <option value="standard">Standard</option>
          <option value="premium">Premium</option>
        </select>
        <select
          value={providerFilter}
          onChange={(e) => {
            setProviderFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="all">모든 로그인</option>
          {providers.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
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
        {paginated.map((u) => {
          const pb = planBadge(u.plan);
          return (
            <div
              key={u.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(u.id)}
                    onChange={() => toggleSelect(u.id)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {u.name || '—'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${pb.cls}`}>{pb.text}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${providerBadge(u.provider)}`}>
                    {u.provider}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      u.role === 'admin'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {u.role || 'user'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-1">{u.email}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
                최근 활동: {relativeTime(u.lastLoginAt)}
              </p>
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
                <input
                  type="checkbox"
                  checked={selectedIds.size === paginated.length && paginated.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
                />
              </th>
              <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                이름
              </th>
              <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                이메일
              </th>
              <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                로그인
              </th>
              <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                요금제
              </th>
              <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                역할
              </th>
              <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                최근 활동
              </th>
              <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {paginated.map((u) => {
              const pb = planBadge(u.plan);
              return (
                <tr
                  key={u.id}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${selectedIds.has(u.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                >
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(u.id)}
                      onChange={() => toggleSelect(u.id)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 font-medium">
                    {u.name || '—'}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                    {u.email}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${providerBadge(u.provider)}`}
                    >
                      {u.provider}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pb.cls}`}>
                      {pb.text}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        u.role === 'admin'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {u.role || 'user'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-400 dark:text-slate-500">
                    {relativeTime(u.lastLoginAt)}
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
              );
            })}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-slate-400">
            {page} / {totalPages} 페이지
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-2 min-h-[44px] min-w-[44px] text-xs bg-slate-100 dark:bg-slate-700 rounded-lg disabled:opacity-30"
            >
              이전
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-2 min-h-[44px] min-w-[44px] text-xs bg-slate-100 dark:bg-slate-700 rounded-lg disabled:opacity-30"
            >
              다음
            </button>
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
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => {
        // Demo data when API not yet implemented
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (itemId: string, action: 'approve' | 'reject') => {
    const reason = action === 'reject' ? rejectReason[itemId] || REJECT_REASONS[0] : undefined;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/health/admin/reports/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, reason }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId ? { ...i, status: action === 'approve' ? 'approved' : 'rejected' } : i,
          ),
        );
        toast(
          action === 'approve' ? '콘텐츠가 승인되었습니다' : '콘텐츠가 거부되었습니다',
          'success',
        );
      } else {
        toast('처리에 실패했습니다', 'error');
      }
    } catch {
      toast('처리에 실패했습니다', 'error');
    }
  };

  if (loading) return <p className="text-sm text-slate-400 py-4 text-center">불러오는 중...</p>;

  const pending = items.filter((i) => i.status === 'pending');
  const processed = items.filter((i) => i.status !== 'pending');

  return (
    <div className="space-y-4">
      {pending.length === 0 && processed.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
          <p className="text-3xl mb-2">🎉</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">신고된 콘텐츠가 없습니다</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            신고 API가 아직 연결되지 않았을 수 있습니다. /api/health/admin/reports 엔드포인트를
            확인하세요.
          </p>
        </div>
      )}

      {pending.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            대기중 ({pending.length}건)
          </p>
          <div className="space-y-2">
            {pending.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-red-200 dark:border-red-900/30 p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          item.type === 'resume'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                        }`}
                      >
                        {item.type === 'resume' ? '이력서' : '댓글'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {relativeTime(item.reportedAt)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium truncate">
                      {item.title || item.content || item.targetId}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      사유: {item.reason} | 신고자: {item.reporterEmail}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <select
                    value={rejectReason[item.id] || REJECT_REASONS[0]}
                    onChange={(e) =>
                      setRejectReason((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    className="flex-1 text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100"
                  >
                    {REJECT_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
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
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            처리 완료 ({processed.length}건)
          </p>
          <div className="space-y-1">
            {processed.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      item.status === 'approved'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}
                  >
                    {item.status === 'approved' ? '승인' : '거부'}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {item.title || item.targetId}
                  </span>
                </div>
                <span className="text-xs text-slate-400 shrink-0">
                  {relativeTime(item.reportedAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// NEW: AdminBannersTab
// ═══════════════════════════════════════════════════════════
interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  linkUrl?: string;
  bgColor: string;
  isActive: boolean;
  order: number;
  startAt?: string;
  endAt?: string;
}

const BANNER_COLORS = [
  {
    label: '인디고',
    value: 'linear-gradient(135deg, #6366f1, #9333ea)',
    preview: 'from-indigo-500 to-purple-600',
  },
  {
    label: '에메랄드',
    value: 'linear-gradient(135deg, #10b981, #0d9488)',
    preview: 'from-emerald-500 to-teal-600',
  },
  {
    label: '앰버',
    value: 'linear-gradient(135deg, #f59e0b, #f97316)',
    preview: 'from-amber-400 to-orange-500',
  },
  {
    label: '로즈',
    value: 'linear-gradient(135deg, #f43f5e, #db2777)',
    preview: 'from-rose-500 to-pink-600',
  },
  {
    label: '슬레이트',
    value: 'linear-gradient(135deg, #334155, #0f172a)',
    preview: 'from-slate-700 to-slate-900',
  },
  {
    label: '스카이',
    value: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
    preview: 'from-sky-500 to-indigo-600',
  },
];

function AdminBannersTab() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [creating, setCreating] = useState(false);
  const token = localStorage.getItem('token');

  const emptyBanner: Omit<Banner, 'id' | 'order'> = {
    title: '',
    subtitle: '',
    imageUrl: '',
    linkUrl: '',
    bgColor: 'from-indigo-600 to-purple-600',
    isActive: true,
  };
  const [form, setForm] = useState({ ...emptyBanner });

  const load = () => {
    setLoading(true);
    fetch(`${API_URL}/api/banners`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setBanners(Array.isArray(d) ? d : []))
      .catch(() => setBanners([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    const method = editing ? 'PATCH' : 'POST';
    const url = editing ? `${API_URL}/api/banners/${editing.id}` : `${API_URL}/api/banners`;
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast(editing ? '배너가 수정되었습니다' : '배너가 생성되었습니다', 'success');
      setEditing(null);
      setCreating(false);
      setForm({ ...emptyBanner });
      load();
    } else {
      toast('저장 실패', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('배너를 삭제하시겠습니까?')) return;
    const res = await fetch(`${API_URL}/api/banners/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      toast('삭제되었습니다', 'success');
      load();
    }
  };

  const handleToggleActive = async (b: Banner) => {
    const res = await fetch(`${API_URL}/api/banners/${b.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isActive: !b.isActive }),
    });
    if (res.ok) load();
  };

  const startEdit = (b: Banner) => {
    setEditing(b);
    setCreating(true);
    setForm({
      title: b.title,
      subtitle: b.subtitle || '',
      imageUrl: b.imageUrl || '',
      linkUrl: b.linkUrl || '',
      bgColor: b.bgColor,
      isActive: b.isActive,
    });
  };

  const cancelForm = () => {
    setEditing(null);
    setCreating(false);
    setForm({ ...emptyBanner });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">배너 관리</h2>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="px-4 py-2 min-h-[44px] bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition-colors"
          >
            + 배너 추가
          </button>
        )}
      </div>

      {creating && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-indigo-200 dark:border-indigo-700 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {editing ? '배너 수정' : '새 배너 만들기'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                제목 *
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                placeholder="배너 제목"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                부제목
              </label>
              <input
                value={form.subtitle}
                onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                placeholder="배너 설명 (선택)"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                링크 URL
              </label>
              <input
                value={form.linkUrl}
                onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                배경 이미지
              </label>
              <div className="flex gap-2 items-center">
                <input
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                  placeholder="이미지 URL 직접 입력"
                />
                <label className="cursor-pointer px-3 py-2 min-h-[44px] flex items-center text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition-colors whitespace-nowrap">
                  파일 업로드
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const fd = new FormData();
                      fd.append('file', file);
                      fd.append('upload_preset', 'resume_upload');
                      try {
                        const res = await fetch(
                          'https://api.cloudinary.com/v1_1/democloud/image/upload',
                          { method: 'POST', body: fd },
                        );
                        if (res.ok) {
                          const data = await res.json();
                          setForm((f) => ({ ...f, imageUrl: data.secure_url }));
                          toast('이미지 업로드 완료', 'success');
                        } else {
                          toast('업로드 실패 — URL 직접 입력을 사용해주세요', 'error');
                        }
                      } catch {
                        toast('업로드 실패 — URL 직접 입력을 사용해주세요', 'error');
                      }
                    }}
                  />
                </label>
              </div>
              {form.imageUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={form.imageUrl}
                    alt="미리보기"
                    className="h-12 w-20 object-cover rounded-lg border border-slate-200 dark:border-slate-600"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <button
                    onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    제거
                  </button>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-2 block">
              배경 색상
            </label>
            <div className="flex gap-2 flex-wrap">
              {BANNER_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setForm((f) => ({ ...f, bgColor: c.value }))}
                  style={{ background: c.value }}
                  className={`px-3 py-1.5 text-xs text-white rounded-lg font-medium ${form.bgColor === c.value ? 'ring-2 ring-offset-2 ring-indigo-500 shadow-md' : 'opacity-80 hover:opacity-100'} transition-all`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          {form.title && (
            <div className="rounded-xl overflow-hidden">
              <div
                style={{
                  background: form.bgColor || 'linear-gradient(135deg, #6366f1, #9333ea)',
                  backgroundImage: form.imageUrl
                    ? `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${form.imageUrl})`
                    : form.bgColor,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  padding: '1.5rem',
                }}
              >
                <p className="font-bold text-white text-lg drop-shadow">{form.title}</p>
                {form.subtitle && (
                  <p className="text-white/90 text-sm mt-1 drop-shadow">{form.subtitle}</p>
                )}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!form.title}
              className="px-4 py-2 min-h-[44px] bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              저장
            </button>
            <button
              onClick={cancelForm}
              className="px-4 py-2 min-h-[44px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-xl hover:bg-slate-200 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-slate-400 text-sm">불러오는 중...</div>
      ) : banners.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          등록된 배너가 없습니다
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b) => (
            <div
              key={b.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              <div className={`h-2 bg-gradient-to-r ${b.bgColor}`} />
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${b.isActive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}
                    >
                      {b.isActive ? '활성' : '비활성'}
                    </span>
                    <span className="text-xs text-slate-400">순서 {b.order}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                    {b.title}
                  </p>
                  {b.subtitle && <p className="text-xs text-slate-400 truncate">{b.subtitle}</p>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleToggleActive(b)}
                    className={`w-10 h-6 rounded-full transition-colors ${b.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <span
                      className={`block w-4 h-4 bg-white rounded-full transition-transform shadow mx-auto ${b.isActive ? 'translate-x-2' : '-translate-x-2'}`}
                    />
                  </button>
                  <button
                    onClick={() => startEdit(b)}
                    className="px-3 py-2 min-h-[44px] text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="px-3 py-2 min-h-[44px] text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// NEW: AdminNoticesTab
// ═══════════════════════════════════════════════════════════
interface Notice {
  id: string;
  title: string;
  content: string;
  type: string;
  isPopup: boolean;
  isPinned: boolean;
  allowComments: boolean;
  viewCount: number;
  startAt?: string;
  endAt?: string;
  createdAt: string;
  author?: { id: string; name: string; avatar: string };
  _count?: { comments: number };
}

const NOTICE_TYPE_LABELS: Record<string, string> = {
  GENERAL: '일반',
  MAINTENANCE: '점검',
  EVENT: '이벤트',
  UPDATE: '업데이트',
  URGENT: '긴급',
};
const NOTICE_TYPE_COLORS: Record<string, string> = {
  GENERAL: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  MAINTENANCE: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  EVENT: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  UPDATE: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  URGENT: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
};

function AdminNoticesTab() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [historyNotice, setHistoryNotice] = useState<Notice | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [editReason, setEditReason] = useState('');
  const token = localStorage.getItem('token');

  type NoticeType = 'GENERAL' | 'MAINTENANCE' | 'EVENT' | 'UPDATE' | 'URGENT';
  const emptyForm = {
    title: '',
    content: '',
    type: 'GENERAL' as NoticeType,
    isPopup: false,
    isPinned: false,
    allowComments: true,
  };
  const [form, setForm] = useState({ ...emptyForm });

  const load = () => {
    setLoading(true);
    fetch(`${API_URL}/api/notices?limit=100`, {
      headers: { Authorization: `Bearer ${token}` } as any,
    })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setNotices(d.items || []))
      .catch(() => setNotices([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    const method = editing ? 'PATCH' : 'POST';
    const url = editing ? `${API_URL}/api/notices/${editing.id}` : `${API_URL}/api/notices`;
    const body = editing ? { ...form, reason: editReason } : form;
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } as any,
      body: JSON.stringify(body),
    });
    if (res.ok) {
      toast(editing ? '공지가 수정되었습니다' : '공지가 등록되었습니다', 'success');
      setEditing(null);
      setCreating(false);
      setForm({ ...emptyForm });
      setEditReason('');
      load();
    } else {
      toast('저장 실패', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('공지사항을 삭제하시겠습니까?')) return;
    const res = await fetch(`${API_URL}/api/notices/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` } as any,
    });
    if (res.ok) {
      toast('삭제되었습니다', 'success');
      load();
    }
  };

  const handleToggleComments = async (n: Notice) => {
    const res = await fetch(`${API_URL}/api/notices/${n.id}/toggle-comments`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } as any,
      body: JSON.stringify({ allow: !n.allowComments }),
    });
    if (res.ok) {
      toast(!n.allowComments ? '댓글을 허용했습니다' : '댓글을 비허용했습니다', 'success');
      load();
    }
  };

  const handleShowHistory = async (n: Notice) => {
    setHistoryNotice(n);
    setHistoryLoading(true);
    const res = await fetch(`${API_URL}/api/notices/${n.id}/history`, {
      headers: { Authorization: `Bearer ${token}` } as any,
    });
    if (res.ok) setHistory(await res.json());
    else setHistory([]);
    setHistoryLoading(false);
  };

  const startEdit = (n: Notice) => {
    setEditing(n);
    setCreating(true);
    setEditReason('');
    setForm({
      title: n.title,
      content: n.content,
      type: n.type as NoticeType,
      isPopup: n.isPopup,
      isPinned: n.isPinned,
      allowComments: n.allowComments,
    });
  };

  const cancelForm = () => {
    setEditing(null);
    setCreating(false);
    setForm({ ...emptyForm });
    setEditReason('');
  };

  return (
    <div className="space-y-6">
      {/* History modal */}
      {historyNotice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setHistoryNotice(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl mx-4 p-6 max-h-[80vh] overflow-y-auto animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                수정 히스토리 — {historyNotice.title}
              </h3>
              <button
                onClick={() => setHistoryNotice(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>
            {historyLoading ? (
              <div className="text-center py-6 text-slate-400 text-sm">불러오는 중...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-sm">수정 이력이 없습니다</div>
            ) : (
              <div className="space-y-3">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-xl p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {h.editor?.name || '관리자'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(h.createdAt).toLocaleString('ko')}
                      </span>
                    </div>
                    {h.reason && (
                      <p className="text-xs text-slate-500 mb-2 italic">사유: {h.reason}</p>
                    )}
                    <div className="text-xs text-slate-500">
                      <div className="mb-1">
                        <span className="font-medium">이전 제목:</span> {h.prevTitle}
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 mt-1 max-h-20 overflow-y-auto">
                        {h.prevContent}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">공지사항 관리</h2>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="px-4 py-2 min-h-[44px] bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition-colors"
          >
            + 공지 작성
          </button>
        )}
      </div>

      {creating && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-indigo-200 dark:border-indigo-700 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {editing ? '공지 수정' : '새 공지 작성'}
          </h3>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">제목 *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              placeholder="공지 제목"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">내용 *</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={5}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="공지 내용을 입력하세요"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">유형</label>
              <div className="flex gap-1.5 flex-wrap">
                {(['GENERAL', 'MAINTENANCE', 'EVENT', 'UPDATE', 'URGENT'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm((f) => ({ ...f, type: t }))}
                    className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${form.type === t ? (NOTICE_TYPE_COLORS[t] || '') + ' font-medium' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}
                  >
                    {NOTICE_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPopup}
                  onChange={(e) => setForm((f) => ({ ...f, isPopup: e.target.checked }))}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">팝업 공지</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPinned}
                  onChange={(e) => setForm((f) => ({ ...f, isPinned: e.target.checked }))}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">상단 고정</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.allowComments}
                  onChange={(e) => setForm((f) => ({ ...f, allowComments: e.target.checked }))}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">댓글 허용</span>
              </label>
            </div>
          </div>
          {editing && (
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                수정 사유 (히스토리에 기록됩니다)
              </label>
              <input
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                placeholder="예: 오탈자 수정, 내용 추가"
              />
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!form.title || !form.content}
              className="px-4 py-2 min-h-[44px] bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              저장
            </button>
            <button
              onClick={cancelForm}
              className="px-4 py-2 min-h-[44px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-xl hover:bg-slate-200 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-slate-400 text-sm">불러오는 중...</div>
      ) : notices.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          등록된 공지사항이 없습니다
        </div>
      ) : (
        <div className="space-y-2">
          {notices.map((n) => (
            <div
              key={n.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${NOTICE_TYPE_COLORS[n.type] || 'bg-slate-100 text-slate-500'}`}
                    >
                      {NOTICE_TYPE_LABELS[n.type] || n.type}
                    </span>
                    {n.isPinned && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                        📌 고정
                      </span>
                    )}
                    {n.isPopup && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                        팝업
                      </span>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${n.allowComments ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}
                    >
                      {n.allowComments ? '💬 댓글 ON' : '🔇 댓글 OFF'}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {n.title}
                  </p>
                  <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{n.content}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                    <span>👁 {n.viewCount || 0}</span>
                    <span>💬 {n._count?.comments || 0}</span>
                    {n.author && <span>작성: {n.author.name}</span>}
                    <span>{new Date(n.createdAt).toLocaleDateString('ko')}</span>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                  <button
                    onClick={() => handleToggleComments(n)}
                    className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors ${n.allowComments ? 'bg-slate-100 dark:bg-slate-700 text-slate-500' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'}`}
                  >
                    댓글 {n.allowComments ? 'OFF' : 'ON'}
                  </button>
                  <button
                    onClick={() => handleShowHistory(n)}
                    className="px-2.5 py-1.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    히스토리
                  </button>
                  <button
                    onClick={() => startEdit(n)}
                    className="px-2.5 py-1.5 text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="px-2.5 py-1.5 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Community Moderation Tab
// ═══════════════════════════════════════════════════════════
function AdminCommunityTab() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showHidden, setShowHidden] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const token = localStorage.getItem('token');

  const fetchPosts = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (category !== 'all') params.set('category', category);
    if (search) params.set('search', search);
    if (showHidden) params.set('showHidden', 'true');
    const r = await fetch(`${API_URL}/api/community?${params}`, {
      headers: { Authorization: `Bearer ${token}` } as any,
    });
    if (r.ok) {
      const data = await r.json();
      setPosts(data.items || []);
      setTotal(data.total || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [category, page, showHidden]);

  const deletePost = async (id: string) => {
    if (!confirm('게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    setActionId(id);
    const r = await fetch(`${API_URL}/api/community/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` } as any,
    });
    if (r.ok) {
      setPosts((p) => p.filter((x) => x.id !== id));
      setTotal((t) => t - 1);
    }
    setActionId(null);
  };

  const patchPost = async (id: string, data: Record<string, any>) => {
    setActionId(id);
    const r = await fetch(`${API_URL}/api/community/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } as any,
      body: JSON.stringify(data),
    });
    if (r.ok) {
      const updated = await r.json();
      setPosts((p) => p.map((x) => (x.id === id ? { ...x, ...updated } : x)));
    }
    setActionId(null);
  };

  const CATS = ['all', 'free', 'tips', 'resume', 'cover-letter', 'question'];
  const CAT_LABELS: Record<string, string> = {
    all: '전체',
    free: '자유',
    tips: '취업팁',
    resume: '이력서피드백',
    'cover-letter': '자소서',
    question: '질문',
  };
  const CAT_COLORS: Record<string, string> = {
    free: 'bg-slate-100 text-slate-600',
    tips: 'bg-yellow-100 text-yellow-700',
    resume: 'bg-blue-100 text-blue-700',
    'cover-letter': 'bg-purple-100 text-purple-700',
    question: 'bg-green-100 text-green-700',
  };

  const hiddenCount = posts.filter((p) => p.isHidden).length;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-indigo-500 rounded" />
          커뮤니티 게시글 관리
          <span className="text-slate-400 font-normal">({total}개)</span>
          {hiddenCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] bg-red-100 text-red-600 rounded-full font-medium">
              숨김 {hiddenCount}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          {/* Show hidden toggle */}
          <button
            onClick={() => setShowHidden((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${showHidden ? 'bg-slate-800 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200'}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {showHidden ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                />
              )}
            </svg>
            {showHidden ? '숨김 포함 중' : '숨김 제외 중'}
          </button>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchPosts()}
              placeholder="검색..."
              className="px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 w-40"
            />
            <button
              onClick={fetchPosts}
              className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              검색
            </button>
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 flex-wrap">
        {CATS.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setCategory(cat);
              setPage(1);
            }}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${category === cat ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
          >
            {CAT_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Post table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  제목
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  카테고리
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  작성자
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  조회/좋아요
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    게시글이 없습니다
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr
                    key={post.id}
                    className={`transition-colors ${post.isHidden ? 'bg-red-50/50 dark:bg-red-900/5 opacity-70' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'} ${actionId === post.id ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <td className="px-4 py-3 max-w-[250px]">
                      <div className="flex items-center gap-1.5">
                        {post.isPinned && (
                          <span className="text-amber-500 text-xs shrink-0">📌</span>
                        )}
                        {post.isHidden && (
                          <span className="text-xs px-1 py-0.5 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded shrink-0">
                            숨김
                          </span>
                        )}
                        <a
                          href={`/community/${post.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-900 dark:text-slate-100 hover:text-indigo-600 transition-colors font-medium truncate block"
                        >
                          {post.title}
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-lg font-medium ${CAT_COLORS[post.category] || 'bg-slate-100 text-slate-600'}`}
                      >
                        {CAT_LABELS[post.category] || post.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                      {post.user?.name || '알 수 없음'}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-slate-500 dark:text-slate-400">
                      <span>👁 {post.viewCount}</span>
                      <span className="mx-1 text-slate-300">·</span>
                      <span>♥ {post.likeCount}</span>
                      <span className="mx-1 text-slate-300">·</span>
                      <span>💬 {post._count?.comments ?? 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Pin toggle */}
                        <button
                          onClick={() => patchPost(post.id, { isPinned: !post.isPinned })}
                          className={`text-xs px-2 py-1 rounded-lg transition-colors ${post.isPinned ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 hover:bg-amber-50 hover:text-amber-600'}`}
                          title={post.isPinned ? '핀 해제' : '핀 고정'}
                        >
                          {post.isPinned ? '핀 해제' : '📌 핀'}
                        </button>
                        {/* Hide toggle */}
                        <button
                          onClick={() => patchPost(post.id, { isHidden: !post.isHidden })}
                          className={`text-xs px-2 py-1 rounded-lg transition-colors ${post.isHidden ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 hover:bg-slate-200'}`}
                          title={post.isHidden ? '숨김 해제' : '게시물 숨김'}
                        >
                          {post.isHidden ? '숨김 해제' : '🙈 숨김'}
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => deletePost(post.id)}
                          className="text-xs px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                          title="게시물 영구 삭제"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            이전
          </button>
          <span className="text-sm text-slate-500">
            {page} / {Math.ceil(total / 20)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / 20)}
            className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 4. System Settings (superadmin only)
// ═══════════════════════════════════════════════════════════
function SystemSettings() {
  const [maintenance, setMaintenance] = useState(
    () => localStorage.getItem('admin-maintenance') === 'true',
  );
  const [monetization, setMonetization] = useState(false);
  const [sysConfigLoaded, setSysConfigLoaded] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch(`${API_URL}/api/system-config/public`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setMonetization(d.monetization_enabled === 'true' || d.monetization_enabled === true);
          if (d.maintenance_mode === 'true' || d.maintenance_mode === true) setMaintenance(true);
        }
        setSysConfigLoaded(true);
      })
      .catch(() => setSysConfigLoaded(true));
  }, []);

  const toggleSysConfig = async (key: string, value: boolean) => {
    try {
      await fetch(`${API_URL}/api/system-config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ [key]: String(value) }),
      });
      toast(`설정이 저장되었습니다`, 'success');
    } catch {
      toast('저장 실패 — 설정이 로컬에만 반영됩니다', 'error');
    }
  };

  const [announcement, setAnnouncement] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('admin-announcement') || '{}').message || '';
    } catch {
      return '';
    }
  });
  const [bannerType, setBannerType] = useState<'info' | 'warning' | 'success' | 'promo'>(() => {
    try {
      return JSON.parse(localStorage.getItem('admin-announcement') || '{}').type || 'info';
    } catch {
      return 'info';
    }
  });
  const [bannerLink, setBannerLink] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('admin-announcement') || '{}').link || '';
    } catch {
      return '';
    }
  });
  const [bannerLinkText, setBannerLinkText] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('admin-announcement') || '{}').linkText || '';
    } catch {
      return '';
    }
  });
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
    const bannerData = announcement
      ? JSON.stringify({
          id: Date.now().toString(),
          message: announcement,
          type: bannerType,
          link: bannerLink || undefined,
          linkText: bannerLinkText || undefined,
        })
      : '';
    localStorage.setItem('admin-announcement', bannerData);

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
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                점검 모드 활성화
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                활성화 시 일반 사용자는 서비스에 접근할 수 없습니다
              </p>
            </div>
            <button
              onClick={() => {
                const next = !maintenance;
                setMaintenance(next);
                setSaved(false);
                toggleSysConfig('maintenance_mode', next);
              }}
              className={`w-12 h-7 rounded-full transition-colors ${maintenance ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
              <span
                className={`block w-5 h-5 bg-white rounded-full transition-transform shadow ${maintenance ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>
          {maintenance && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-xs text-red-700 dark:text-red-400 font-medium">
                주의: 점검 모드가 활성화되어 있습니다
              </p>
              <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
                관리자 계정을 제외한 모든 접근이 차단됩니다
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Monetization Toggle */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-emerald-500 rounded" />
          유료화 설정
        </h2>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                유료화 활성화
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {monetization
                  ? '현재 유료 플랜이 활성화되어 있습니다. 사용자에게 요금제 선택이 표시됩니다.'
                  : '현재 무료 운영 중입니다. 모든 기능이 무료로 제공됩니다.'}
              </p>
            </div>
            <button
              onClick={() => {
                const next = !monetization;
                setMonetization(next);
                toggleSysConfig('monetization_enabled', next);
              }}
              disabled={!sysConfigLoaded}
              className={`w-12 h-7 rounded-full transition-colors disabled:opacity-50 ${monetization ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
              <span
                className={`block w-5 h-5 bg-white rounded-full transition-transform shadow ${monetization ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>
          {!monetization && (
            <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                무료 운영 모드: 요금제 페이지에 "곧 유료 서비스 출시" 안내가 표시됩니다
              </p>
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
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            사이트 상단에 표시될 공지 메시지 (비워두면 표시하지 않음)
          </p>
          <div className="flex gap-2 mb-2">
            {(['info', 'warning', 'success', 'promo'] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setBannerType(t);
                  setSaved(false);
                }}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                  bannerType === t
                    ? {
                        info: 'bg-blue-600 text-white',
                        warning: 'bg-amber-500 text-white',
                        success: 'bg-emerald-600 text-white',
                        promo: 'bg-purple-600 text-white',
                      }[t]
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {{ info: '정보', warning: '경고', success: '성공', promo: '프로모션' }[t]}
              </button>
            ))}
          </div>
          <textarea
            value={announcement}
            onChange={(e) => {
              setAnnouncement(e.target.value);
              setSaved(false);
            }}
            placeholder="예: 4월 5일 02:00~06:00 서버 점검이 예정되어 있습니다."
            rows={2}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="grid grid-cols-2 gap-2 mt-2">
            <input
              value={bannerLink}
              onChange={(e) => {
                setBannerLink(e.target.value);
                setSaved(false);
              }}
              placeholder="링크 URL (선택)"
              className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100"
            />
            <input
              value={bannerLinkText}
              onChange={(e) => {
                setBannerLinkText(e.target.value);
                setSaved(false);
              }}
              placeholder="링크 텍스트 (선택)"
              className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          {announcement && (
            <div
              className={`mt-3 p-2.5 rounded-lg text-sm text-center text-white ${
                {
                  info: 'bg-blue-600',
                  warning: 'bg-amber-500',
                  success: 'bg-emerald-600',
                  promo: 'bg-gradient-to-r from-purple-600 to-indigo-600',
                }[bannerType]
              }`}
            >
              {announcement}
              {bannerLink && (
                <span className="ml-2 underline text-xs">{bannerLinkText || '자세히 보기'}</span>
              )}
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
                <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  엔드포인트
                </th>
                <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  제한
                </th>
                <th className="px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  상태
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {rateLimits.map((rl) => (
                <tr
                  key={rl.endpoint}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-700 dark:text-slate-300">
                    {rl.endpoint}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400">
                    {rl.limit}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                      {rl.status}
                    </span>
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
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setResumes(d.data || []))
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
      setResumes((prev) => prev.filter((r) => r.id !== id));
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
      setResumes((prev) => prev.filter((r) => r.id !== id));
    }
  };

  if (loading) return <p className="text-sm text-slate-400 py-4 text-center">불러오는 중...</p>;
  if (resumes.length === 0)
    return <p className="text-sm text-slate-400 py-4 text-center">공개 이력서가 없습니다</p>;

  const totalPages = Math.ceil(resumes.length / perPage);
  const paginated = resumes.slice((page - 1) * perPage, page * perPage);

  return (
    <div>
      <div className="space-y-2">
        {paginated.map((r) => (
          <div
            key={r.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 gap-2"
          >
            <div className="min-w-0 flex-1">
              <Link
                to={`/resumes/${r.id}/preview`}
                className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 truncate block"
              >
                {r.title || '제목 없음'}
              </Link>
              <span className="text-xs text-slate-400">{r.personalInfo?.name || '이름 없음'}</span>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={() => handleHide(r.id)}
                className="text-xs px-3 py-2 min-h-[44px] flex-1 sm:flex-initial bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-100 transition-colors"
              >
                숨기기
              </button>
              <button
                onClick={() => handleDelete(r.id)}
                className="text-xs px-3 py-2 min-h-[44px] flex-1 sm:flex-initial bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-slate-400">
            {page} / {totalPages} 페이지
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-2 min-h-[44px] min-w-[44px] text-xs bg-slate-100 dark:bg-slate-700 rounded-lg disabled:opacity-30"
            >
              이전
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-2 min-h-[44px] min-w-[44px] text-xs bg-slate-100 dark:bg-slate-700 rounded-lg disabled:opacity-30"
            >
              다음
            </button>
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
  const [plans, setPlans] = useState(PLANS.map((p) => ({ ...p })));
  const [saved, setSaved] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  const updateFeature = (planIdx: number, feature: string, value: any) => {
    setPlans((prev) => {
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
    setPlans((prev) => {
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
        <div
          key={plan.id}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
        >
          <button
            onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
            className="w-full flex items-center justify-between mb-1"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{plan.badge}</span>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">{plan.name}</h4>
            </div>
            <div className="flex items-center gap-3">
              {plan.id !== 'free' && (
                <span className="text-xs text-slate-400">{plan.price.toLocaleString()}원/월</span>
              )}
              <svg
                className={`w-4 h-4 text-slate-400 transition-transform ${expandedPlan === plan.id ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
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
                    onChange={(e) => updatePrice(planIdx, parseInt(e.target.value) || 0)}
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
                ].map((feat) => (
                  <div
                    key={feat.key}
                    className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded-lg"
                  >
                    <span className="text-xs text-slate-600 dark:text-slate-400">{feat.label}</span>
                    {feat.type === 'boolean' ? (
                      <button
                        onClick={() =>
                          updateFeature(planIdx, feat.key, !(plan.features as any)[feat.key])
                        }
                        className={`w-10 h-6 min-w-[44px] rounded-full transition-colors ${(plan.features as any)[feat.key] ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                      >
                        <span
                          className={`block w-4 h-4 bg-white rounded-full transition-transform ${(plan.features as any)[feat.key] ? 'translate-x-5' : 'translate-x-1'}`}
                        />
                      </button>
                    ) : (
                      <input
                        type="number"
                        value={(plan.features as any)[feat.key]}
                        onChange={(e) =>
                          updateFeature(planIdx, feat.key, parseInt(e.target.value) || 0)
                        }
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
      <button
        onClick={handleSave}
        className="px-5 py-3 min-h-[44px] bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
      >
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
          관리자 계정으로 이력서를 열면 모든 댓글에 &quot;삭제&quot; 버튼이 표시됩니다.{'\n'}공개
          이력서의 &quot;공개 설정&quot;을 &quot;비공개&quot;로 변경하면 탐색에서 숨겨집니다.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AdminExtLinksTab — 외부 채용 링크 관리
// ─────────────────────────────────────────────────────────────────────────────
interface ExtLink {
  id: string;
  name: string;
  url: string;
  logoEmoji: string;
  badgeText: string;
  description: string;
  gradientFrom: string;
  gradientTo: string;
  category: string;
  companySize: string;
  careerLevel: string;
  location: string;
  jobCategory: string;
  jobTypes: string;
  isActive: boolean;
  order: number;
  clickCount: number;
}

const EXT_COMPANY_SIZES = [
  { key: 'all', label: '전체' },
  { key: 'conglomerate', label: '대기업' },
  { key: 'public', label: '공기업' },
  { key: 'government', label: '공무원' },
  { key: 'medium', label: '중소기업' },
  { key: 'startup', label: '스타트업' },
  { key: 'small', label: '소규모' },
];
const EXT_CAREER_LEVELS = [
  { key: 'all', label: '전 경력' },
  { key: 'junior', label: '신입' },
  { key: 'mid', label: '경력' },
  { key: 'senior', label: '시니어' },
];
const EXT_JOB_CATEGORIES = [
  { key: 'all', label: '전 직종' },
  { key: 'it', label: 'IT/개발' },
  { key: 'planning', label: '기획' },
  { key: 'design', label: '디자인' },
  { key: 'marketing', label: '마케팅' },
  { key: 'finance', label: '금융' },
  { key: 'sales', label: '영업' },
  { key: 'hr', label: '인사' },
  { key: 'manufacturing', label: '제조' },
  { key: 'education', label: '교육' },
  { key: 'medical', label: '의료' },
  { key: 'legal', label: '법무' },
  { key: 'service', label: '서비스' },
  { key: 'research', label: '연구' },
];
const EXT_LOCATIONS = [
  { key: 'all', label: '전국' },
  { key: 'seoul', label: '서울' },
  { key: 'gyeonggi', label: '경기' },
  { key: 'busan', label: '부산' },
  { key: 'daegu', label: '대구' },
  { key: 'remote', label: '재택' },
  { key: 'nationwide', label: '전국가능' },
  { key: 'global', label: '글로벌' },
];
function AdminExtLinksTab() {
  const [links, setLinks] = useState<ExtLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<ExtLink> | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const load = () => {
    setLoading(true);
    fetch(`${API_URL}/api/jobs/external-links/list`)
      .then((r) => r.json())
      .then((data) => {
        setLinks(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const method = editing.id ? 'PUT' : 'POST';
      const url = editing.id
        ? `${API_URL}/api/jobs/external-links/${editing.id}`
        : `${API_URL}/api/jobs/external-links`;
      const res = await fetch(url, { method, headers, body: JSON.stringify(editing) });
      if (!res.ok) throw new Error();
      toast(editing.id ? '수정되었습니다' : '등록되었습니다', 'success');
      setEditing(null);
      load();
    } catch {
      toast('저장 실패', 'error');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const res = await fetch(`${API_URL}/api/jobs/external-links/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (res.ok) {
      toast('삭제되었습니다', 'success');
      load();
    } else toast('삭제 실패', 'error');
  };

  const handleToggleActive = async (link: ExtLink) => {
    await fetch(`${API_URL}/api/jobs/external-links/${link.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ isActive: !link.isActive }),
    });
    load();
  };

  const newLink: Partial<ExtLink> = {
    name: '',
    url: '',
    logoEmoji: '🔗',
    badgeText: '',
    description: '',
    gradientFrom: '#6366f1',
    gradientTo: '#4f46e5',
    category: 'general',
    companySize: 'all',
    careerLevel: 'all',
    location: 'all',
    jobCategory: 'all',
    jobTypes: 'all',
    isActive: true,
    order: 0,
  };

  const filtered = links.filter((l) =>
    filterActive === 'all' ? true : filterActive === 'active' ? l.isActive : !l.isActive,
  );

  const inputCls =
    'w-full px-2.5 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none';
  const labelCls = 'block text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5';
  const selCls = inputCls;

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-blue-500 rounded" />
          외부 채용 링크 관리 ({links.length}개)
        </h2>
        <button
          onClick={() => setEditing(newLink)}
          className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + 링크 추가
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: '전체' },
          { key: 'active', label: '활성' },
          { key: 'inactive', label: '비활성' },
        ].map((o) => (
          <button
            key={o.key}
            onClick={() => setFilterActive(o.key as any)}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${filterActive === o.key ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Edit modal */}
      <RadixDialog.Root
        open={!!editing}
        onOpenChange={(o) => {
          if (!o) setEditing(null);
        }}
      >
        <RadixDialog.Portal>
          <RadixDialog.Overlay className="fixed inset-0 z-[90] bg-black/50 animate-fade-in" />
          <RadixDialog.Content
            aria-describedby={undefined}
            className="fixed z-[91] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto animate-fade-in focus:outline-none"
          >
            {editing && (
              <>
                <RadixDialog.Title className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                  {editing.id ? '링크 수정' : '링크 추가'}
                </RadixDialog.Title>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>사이트명 *</label>
                    <input
                      className={inputCls}
                      value={editing.name || ''}
                      onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>URL *</label>
                    <input
                      className={inputCls}
                      value={editing.url || ''}
                      onChange={(e) => setEditing((p) => ({ ...p, url: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>이모지</label>
                    <input
                      className={inputCls}
                      value={editing.logoEmoji || ''}
                      onChange={(e) => setEditing((p) => ({ ...p, logoEmoji: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>뱃지 텍스트</label>
                    <input
                      className={inputCls}
                      value={editing.badgeText || ''}
                      onChange={(e) => setEditing((p) => ({ ...p, badgeText: e.target.value }))}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>설명</label>
                    <input
                      className={inputCls}
                      value={editing.description || ''}
                      onChange={(e) => setEditing((p) => ({ ...p, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>그라데이션 시작색</label>
                    <input
                      type="color"
                      className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer"
                      value={editing.gradientFrom || '#6366f1'}
                      onChange={(e) => setEditing((p) => ({ ...p, gradientFrom: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>그라데이션 끝색</label>
                    <input
                      type="color"
                      className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer"
                      value={editing.gradientTo || '#4f46e5'}
                      onChange={(e) => setEditing((p) => ({ ...p, gradientTo: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>기업 규모</label>
                    <select
                      className={selCls}
                      value={editing.companySize || 'all'}
                      onChange={(e) => setEditing((p) => ({ ...p, companySize: e.target.value }))}
                    >
                      {EXT_COMPANY_SIZES.map((o) => (
                        <option key={o.key} value={o.key}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>직종</label>
                    <select
                      className={selCls}
                      value={editing.jobCategory || 'all'}
                      onChange={(e) => setEditing((p) => ({ ...p, jobCategory: e.target.value }))}
                    >
                      {EXT_JOB_CATEGORIES.map((o) => (
                        <option key={o.key} value={o.key}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>경력 수준</label>
                    <select
                      className={selCls}
                      value={editing.careerLevel || 'all'}
                      onChange={(e) => setEditing((p) => ({ ...p, careerLevel: e.target.value }))}
                    >
                      {EXT_CAREER_LEVELS.map((o) => (
                        <option key={o.key} value={o.key}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>고용 형태</label>
                    <input
                      className={inputCls}
                      placeholder="all 또는 fulltime,intern"
                      value={editing.jobTypes || ''}
                      onChange={(e) => setEditing((p) => ({ ...p, jobTypes: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>지역</label>
                    <select
                      className={selCls}
                      value={editing.location || 'all'}
                      onChange={(e) => setEditing((p) => ({ ...p, location: e.target.value }))}
                    >
                      {EXT_LOCATIONS.map((o) => (
                        <option key={o.key} value={o.key}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>정렬 순서</label>
                    <input
                      type="number"
                      className={inputCls}
                      value={editing.order ?? 0}
                      onChange={(e) =>
                        setEditing((p) => ({ ...p, order: parseInt(e.target.value) || 0 }))
                      }
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="ext-active"
                      checked={editing.isActive ?? true}
                      onChange={(e) => setEditing((p) => ({ ...p, isActive: e.target.checked }))}
                      className="rounded"
                    />
                    <label
                      htmlFor="ext-active"
                      className="text-sm text-slate-600 dark:text-slate-300"
                    >
                      활성화
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 justify-end">
                  <button
                    onClick={() => setEditing(null)}
                    className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !editing.name || !editing.url}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? '저장 중...' : '저장'}
                  </button>
                </div>
              </>
            )}
          </RadixDialog.Content>
        </RadixDialog.Portal>
      </RadixDialog.Root>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8 text-slate-400">불러오는 중...</div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">사이트</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">
                    기업규모
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">직종</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">지역</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-slate-500">클릭</th>
                  <th className="text-center px-3 py-2 text-xs font-medium text-slate-500">상태</th>
                  <th className="text-center px-3 py-2 text-xs font-medium text-slate-500">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filtered.map((link) => (
                  <tr
                    key={link.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{link.logoEmoji}</span>
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-100">
                            {link.name}
                          </div>
                          <div className="text-xs text-slate-400 truncate max-w-[200px]">
                            {link.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {EXT_COMPANY_SIZES.find((o) => o.key === link.companySize)?.label ||
                        link.companySize}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {EXT_JOB_CATEGORIES.find((o) => o.key === link.jobCategory)?.label ||
                        link.jobCategory}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {EXT_LOCATIONS.find((o) => o.key === link.location)?.label || link.location}
                    </td>
                    <td className="px-3 py-2 text-xs text-right text-slate-500">
                      {link.clickCount.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => handleToggleActive(link)}
                        className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${link.isActive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}
                      >
                        {link.isActive ? '활성' : '비활성'}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditing(link)}
                          className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                          title="수정"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(link.id)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                          title="삭제"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-sm">
                      링크가 없습니다
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 권한 관리 탭 ─────────────────────────────────────────────── */

const PERM_CONTENT_TYPES = [
  { key: 'curatedJobs', label: '채용 정보', icon: '📋', desc: '외부 채용 공고 요약 카드' },
  { key: 'externalLinks', label: '채용 바로가기', icon: '🔗', desc: '주요 채용 사이트 링크' },
  { key: 'jobPosts', label: '채용 공고', icon: '📝', desc: '직접 등록 채용 공고' },
  { key: 'notices', label: '공지사항', icon: '📢', desc: '사이트 공지/이벤트' },
  { key: 'community', label: '커뮤니티', icon: '💬', desc: '게시판 글' },
  { key: 'banners', label: '배너', icon: '🖼', desc: '메인 페이지 배너' },
];

const PERM_ACTIONS = [
  { key: 'create', label: '생성' },
  { key: 'edit', label: '수정' },
  { key: 'delete', label: '삭제' },
];

const PERM_ROLES = [
  {
    key: 'all',
    label: '누구나',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    border: 'border-emerald-300 dark:border-emerald-700',
  },
  {
    key: 'user',
    label: '로그인 사용자',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    border: 'border-blue-300 dark:border-blue-700',
  },
  {
    key: 'recruiter',
    label: '채용담당자',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    border: 'border-purple-300 dark:border-purple-700',
  },
  {
    key: 'admin',
    label: '관리자',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    border: 'border-red-300 dark:border-red-700',
  },
  {
    key: 'author',
    label: '작성자 본인',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    border: 'border-amber-300 dark:border-amber-700',
  },
];

function AdminPermissionsTab() {
  const [perms, setPerms] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/system-config/permissions`)
      .then((r) => r.json())
      .then((data) => {
        setPerms(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getRoles = (contentType: string, action: string): string[] => {
    const key = `perm.${contentType}.${action}`;
    return (perms[key] || 'admin').split(',').map((r) => r.trim());
  };

  const toggleRole = (contentType: string, action: string, role: string) => {
    const key = `perm.${contentType}.${action}`;
    const current = getRoles(contentType, action);
    let next: string[];

    if (role === 'all') {
      next = current.includes('all') ? ['admin'] : ['all'];
    } else {
      next = current.filter((r) => r !== 'all');
      if (next.includes(role)) {
        next = next.filter((r) => r !== role);
        if (next.length === 0) next = ['admin'];
      } else {
        next.push(role);
      }
    }

    setPerms((prev) => ({ ...prev, [key]: next.join(',') }));
    setChanged(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/system-config/permissions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(perms),
      });
      if (res.ok) {
        const updated = await res.json();
        setPerms(updated);
        setChanged(false);
        toast('권한 설정이 저장되었습니다', 'success');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-slate-400 animate-pulse">권한 설정 로딩 중...</div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-indigo-500 rounded" />
            콘텐츠 권한 관리
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            콘텐츠별 생성/수정/삭제 권한을 설정합니다. 변경 후 저장 버튼을 클릭하세요.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !changed}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
            changed
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
          }`}
        >
          {saving ? '저장 중...' : changed ? '💾 변경사항 저장' : '변경 없음'}
        </button>
      </div>

      {/* Permission Cards */}
      <div className="space-y-4">
        {PERM_CONTENT_TYPES.map((ct) => (
          <div
            key={ct.key}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{ct.icon}</span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {ct.label}
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">{ct.desc}</p>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {PERM_ACTIONS.map((action) => {
                  const roles = getRoles(ct.key, action.key);
                  const isAll = roles.includes('all');
                  return (
                    <div key={action.key}>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2.5 flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${action.key === 'create' ? 'bg-emerald-500' : action.key === 'edit' ? 'bg-blue-500' : 'bg-red-500'}`}
                        />
                        {action.label}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {PERM_ROLES.map((role) => {
                          const active = isAll ? role.key === 'all' : roles.includes(role.key);
                          return (
                            <button
                              key={role.key}
                              onClick={() => toggleRole(ct.key, action.key, role.key)}
                              className={`px-2.5 py-1.5 text-[11px] font-medium rounded-lg border transition-all duration-150 ${
                                active
                                  ? `${role.color} ${role.border} shadow-sm`
                                  : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                              }`}
                            >
                              {active && <span className="mr-0.5">✓</span>}
                              {role.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">
          권한 등급 설명
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { ...PERM_ROLES[0], desc: '비로그인 사용자 포함 모든 방문자' },
            { ...PERM_ROLES[1], desc: '로그인한 모든 사용자 (개인/기업)' },
            { ...PERM_ROLES[2], desc: '채용담당자 또는 기업회원' },
            { ...PERM_ROLES[3], desc: '관리자 (admin/superadmin)' },
            { ...PERM_ROLES[4], desc: '해당 콘텐츠를 직접 작성한 사람' },
          ].map((r) => (
            <div key={r.key} className="flex items-start gap-2">
              <span
                className={`shrink-0 mt-0.5 px-2 py-0.5 text-[10px] font-bold rounded ${r.color}`}
              >
                {r.label}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {r.desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Forbidden Words Tab ─────────────────────────── */

interface ForbiddenWord {
  id: string;
  word: string;
  category: string;
  severity: string;
  isActive: boolean;
  createdAt: string;
}

const FORBIDDEN_CATEGORIES = [
  { value: 'general', label: '일반' },
  { value: 'profanity', label: '욕설' },
  { value: 'discrimination', label: '차별' },
  { value: 'spam', label: '스팸' },
  { value: 'adult', label: '성인' },
  { value: 'fraud', label: '사기' },
];

function AdminForbiddenWordsTab() {
  const [words, setWords] = useState<ForbiddenWord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    blocked: number;
    warned: number;
  } | null>(null);

  // Form
  const [formMode, setFormMode] = useState<'single' | 'bulk'>('single');
  const [newWord, setNewWord] = useState('');
  const [bulkWords, setBulkWords] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newSeverity, setNewSeverity] = useState('block');
  const [submitting, setSubmitting] = useState(false);

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Edit
  const [editing, setEditing] = useState<string | null>(null);
  const [editWord, setEditWord] = useState('');
  const [editCat, setEditCat] = useState('');
  const [editSev, setEditSev] = useState('');

  // Test
  const [testText, setTestText] = useState('');
  const [testResult, setTestResult] = useState<{
    blocked: boolean;
    matched: string[];
    warnings: string[];
  } | null>(null);

  const token = localStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (search) params.set('search', search);
      if (filterCat !== 'all') params.set('category', filterCat);
      const r = await fetch(`${API_URL}/api/forbidden-words?${params}`, { headers });
      if (r.ok) {
        const data = await r.json();
        setWords(data.items || []);
        setTotal(data.total || 0);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const r = await fetch(`${API_URL}/api/forbidden-words/stats`, { headers });
      if (r.ok) setStats(await r.json());
    } catch {}
  };

  useEffect(() => {
    load();
  }, [page, filterCat]);
  useEffect(() => {
    loadStats();
  }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleCreate = async () => {
    if (formMode === 'single' && !newWord.trim()) return;
    if (formMode === 'bulk' && !bulkWords.trim()) return;
    setSubmitting(true);
    try {
      if (formMode === 'single') {
        const r = await fetch(`${API_URL}/api/forbidden-words`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            word: newWord.trim(),
            category: newCategory,
            severity: newSeverity,
          }),
        });
        if (r.ok) {
          setNewWord('');
          toast('금칙어가 등록되었습니다', 'success');
          load();
          loadStats();
        } else {
          const data = await r.json();
          toast(data.message || '등록 실패', 'error');
        }
      } else {
        const wordList = bulkWords
          .split('\n')
          .map((w) => w.trim())
          .filter(Boolean);
        if (!wordList.length) return;
        const r = await fetch(`${API_URL}/api/forbidden-words/bulk`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ words: wordList, category: newCategory, severity: newSeverity }),
        });
        if (r.ok) {
          const data = await r.json();
          toast(`${data.created}개 등록, ${data.skipped}개 중복 건너뜀`, 'success');
          setBulkWords('');
          load();
          loadStats();
        }
      }
    } catch {
      toast('등록 중 오류가 발생했습니다', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (id: string) => {
    const r = await fetch(`${API_URL}/api/forbidden-words/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ word: editWord, category: editCat, severity: editSev }),
    });
    if (r.ok) {
      setEditing(null);
      toast('수정되었습니다', 'success');
      load();
      loadStats();
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await fetch(`${API_URL}/api/forbidden-words/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ isActive: !isActive }),
    });
    load();
    loadStats();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    await fetch(`${API_URL}/api/forbidden-words/${id}`, { method: 'DELETE', headers });
    load();
    loadStats();
  };

  const handleBulkDelete = async () => {
    if (!selected.size || !confirm(`${selected.size}개 금칙어를 삭제하시겠습니까?`)) return;
    await fetch(`${API_URL}/api/forbidden-words/bulk`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ ids: [...selected] }),
    });
    setSelected(new Set());
    load();
    loadStats();
  };

  const handleTest = async () => {
    if (!testText.trim()) return;
    const r = await fetch(`${API_URL}/api/forbidden-words/check`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text: testText }),
    });
    if (r.ok) setTestResult(await r.json());
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === words.length) setSelected(new Set());
    else setSelected(new Set(words.map((w) => w.id)));
  };

  const totalPages = Math.ceil(total / 30);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: '전체',
              value: stats.total,
              color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
            },
            {
              label: '활성',
              value: stats.active,
              color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
            },
            {
              label: '차단',
              value: stats.blocked,
              color: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
            },
            {
              label: '경고',
              value: stats.warned,
              color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
            },
          ].map((s) => (
            <div key={s.label} className={`${s.color} rounded-xl p-3 text-center`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Test panel */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
          <span className="w-1.5 h-4 bg-blue-500 rounded" />
          금칙어 테스트
        </h3>
        <div className="flex gap-2">
          <input
            value={testText}
            onChange={(e) => {
              setTestText(e.target.value);
              setTestResult(null);
            }}
            placeholder="텍스트를 입력하여 금칙어 포함 여부를 검사합니��..."
            className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleTest}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors shrink-0"
          >
            검사
          </button>
        </div>
        {testResult && (
          <div
            className={`mt-2 p-2.5 rounded-lg text-sm ${
              testResult.blocked
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                : testResult.warnings.length
                  ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                  : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
            }`}
          >
            {testResult.blocked
              ? `차단됨 — 금칙어 감지: ${testResult.matched.join(', ')}`
              : testResult.warnings.length
                ? `경고 — 주의 단어: ${testResult.warnings.join(', ')}`
                : '통과 — 금칙어가 감지되지 않았습니다'}
          </div>
        )}
      </div>

      {/* Add form */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <span className="w-1.5 h-4 bg-indigo-500 rounded" />
            금칙어 등록
          </h3>
          <div className="flex gap-1">
            <button
              onClick={() => setFormMode('single')}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${formMode === 'single' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
            >
              단일 등록
            </button>
            <button
              onClick={() => setFormMode('bulk')}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${formMode === 'bulk' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
            >
              일괄 등록
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {formMode === 'single' ? (
            <input
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="금칙어 입���..."
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          ) : (
            <textarea
              value={bulkWords}
              onChange={(e) => setBulkWords(e.target.value)}
              placeholder="금칙어를 한 줄에 하나씩 입력..."
              rows={4}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          )}
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100"
            >
              {FORBIDDEN_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <select
              value={newSeverity}
              onChange={(e) => setNewSeverity(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="block">차단 (등록 불가)</option>
              <option value="warn">경고 (허용)</option>
            </select>
            <button
              onClick={handleCreate}
              disabled={submitting}
              className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors ml-auto"
            >
              {submitting ? '등록 중...' : formMode === 'single' ? '등록' : '일괄 등록'}
            </button>
          </div>
        </div>
      </div>

      {/* Filters + list */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex flex-wrap gap-2 items-center">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="금칙어 검색..."
              className="flex-1 min-w-[150px] px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={filterCat}
              onChange={(e) => {
                setFilterCat(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="all">전체 카테��리</option>
              {FORBIDDEN_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            {selected.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
              >
                {selected.size}개 삭제
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-400 text-sm">불러오는 중...</div>
        ) : words.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            {search || filterCat !== 'all' ? '검색 결과가 없습니다' : '등록된 금칙어가 없습니다'}
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[40px_1fr_100px_80px_80px_100px] gap-2 px-4 py-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-100 dark:border-slate-700">
              <div>
                <input
                  type="checkbox"
                  checked={selected.size === words.length && words.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </div>
              <div>금칙어</div>
              <div>카테고리</div>
              <div>심각도</div>
              <div>상태</div>
              <div>관리</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {words.map((w) => (
                <div
                  key={w.id}
                  className={`px-4 py-2.5 ${selected.has(w.id) ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''}`}
                >
                  {editing === w.id ? (
                    <div className="flex flex-wrap gap-2 items-center">
                      <input
                        value={editWord}
                        onChange={(e) => setEditWord(e.target.value)}
                        className="flex-1 min-w-[120px] px-2 py-1 text-sm border border-indigo-300 rounded-lg dark:bg-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                      <select
                        value={editCat}
                        onChange={(e) => setEditCat(e.target.value)}
                        className="px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100"
                      >
                        {FORBIDDEN_CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={editSev}
                        onChange={(e) => setEditSev(e.target.value)}
                        className="px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100"
                      >
                        <option value="block">차단</option>
                        <option value="warn">경고</option>
                      </select>
                      <button
                        onClick={() => handleUpdate(w.id)}
                        className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <div className="sm:grid grid-cols-[40px_1fr_100px_80px_80px_100px] gap-2 items-center">
                      <div>
                        <input
                          type="checkbox"
                          checked={selected.has(w.id)}
                          onChange={() => toggleSelect(w.id)}
                          className="rounded"
                        />
                      </div>
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {w.word}
                      </div>
                      <div>
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                          {FORBIDDEN_CATEGORIES.find((c) => c.value === w.category)?.label ||
                            w.category}
                        </span>
                      </div>
                      <div>
                        <span
                          className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${
                            w.severity === 'block'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {w.severity === 'block' ? '차단' : '경고'}
                        </span>
                      </div>
                      <div>
                        <button
                          onClick={() => handleToggleActive(w.id, w.isActive)}
                          className={`px-2 py-0.5 text-[10px] rounded-full font-medium transition-colors ${
                            w.isActive
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                          }`}
                        >
                          {w.isActive ? '활성' : '비활성'}
                        </button>
                      </div>
                      <div className="flex gap-1 mt-1 sm:mt-0">
                        <button
                          onClick={() => {
                            setEditing(w.id);
                            setEditWord(w.word);
                            setEditCat(w.category);
                            setEditSev(w.severity);
                          }}
                          className="px-2 py-1 text-[10px] text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(w.id)}
                          className="px-2 py-1 text-[10px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-700 disabled:opacity-50 hover:bg-slate-200 transition-colors"
                >
                  이전
                </button>
                <span className="text-xs text-slate-500">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-700 disabled:opacity-50 hover:bg-slate-200 transition-colors"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
