import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '@/lib/config';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardData {
  summary: {
    totalResumes: number;
    publicResumes: number;
    totalViews: number;
    totalTransforms: number;
    recentEdits: number;
  };
  previousMonth?: {
    totalResumes: number;
    publicResumes: number;
    totalViews: number;
    totalTransforms: number;
    recentEdits: number;
  };
  dailyViews?: number[];
}

function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null;
  const diff = current - previous;
  const pct = previous === 0 ? (current > 0 ? 100 : 0) : Math.round((diff / previous) * 100);
  if (pct === 0) return null;
  const isUp = pct > 0;
  return (
    <span
      className={`inline-flex items-center text-[10px] font-medium ${isUp ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}
    >
      <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {isUp ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        )}
      </svg>
      {Math.abs(pct)}%
    </span>
  );
}

const CHART_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function DashboardStats() {
  const [data, setData] = useState<DashboardData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    fetch(`${API_URL}/api/resumes/dashboard/analytics`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return null;

  const prev = data.previousMonth || {
    totalResumes: 0,
    publicResumes: 0,
    totalViews: 0,
    totalTransforms: 0,
    recentEdits: 0,
  };

  const stats = [
    {
      label: '이력서',
      value: data.summary.totalResumes,
      prevValue: prev.totalResumes,
      icon: '📄',
      color: 'text-blue-600',
      link: '/',
    },
    {
      label: '공개',
      value: data.summary.publicResumes,
      prevValue: prev.publicResumes,
      icon: '🌐',
      color: 'text-green-600',
      link: '/explore',
    },
    {
      label: '총 조회',
      value: data.summary.totalViews,
      prevValue: prev.totalViews,
      icon: '👁',
      color: 'text-sky-600',
      link: '/',
    },
    {
      label: 'AI 변환',
      value: data.summary.totalTransforms,
      prevValue: prev.totalTransforms,
      icon: '🤖',
      color: 'text-amber-600',
      link: '/templates',
    },
    {
      label: '최근 편집',
      value: data.summary.recentEdits,
      prevValue: prev.recentEdits,
      icon: '✏️',
      color: 'text-blue-700',
      link: '/',
    },
  ];

  // 조회수 AreaChart 데이터 (최근 7일)
  const viewsChartData = data.dailyViews
    ? data.dailyViews.slice(-7).map((v, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return { name: `${d.getMonth() + 1}/${d.getDate()}`, value: v };
      })
    : [];

  // 상태 분포 PieChart 데이터
  const pieData = [
    { name: '비공개', value: Math.max(0, data.summary.totalResumes - data.summary.publicResumes) },
    { name: '공개', value: data.summary.publicResumes },
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* 숫자 스탯 카드 */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {stats.map((s) => (
          <button
            key={s.label}
            onClick={() => navigate(s.link)}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 cursor-pointer group"
          >
            <span className="text-lg">{s.icon}</span>
            <div
              className={`text-xl font-bold ${s.color} mt-1 group-hover:scale-105 transition-transform`}
            >
              {s.value}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{s.label}</div>
            <TrendIndicator current={s.value} previous={s.prevValue} />
          </button>
        ))}
      </div>

      {/* 차트 영역 */}
      {(viewsChartData.length > 0 || data.summary.totalResumes > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 조회수 트렌드 AreaChart */}
          {viewsChartData.length > 0 && (
            <div className="sm:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3">
                최근 7일 조회수 추이
              </h3>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart
                  data={viewsChartData}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: 'none',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`${v}회`, '조회수']}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#colorViews)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 이력서 상태 PieChart */}
          {data.summary.totalResumes > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                이력서 공개 현황
              </h3>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: 'none',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      fontSize: 12,
                    }}
                    formatter={(v: number, name: string) => [`${v}개`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-3 mt-1">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: CHART_COLORS[i] }}
                    />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {entry.name} {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
