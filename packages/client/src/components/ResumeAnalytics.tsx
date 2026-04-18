import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/config';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface Analytics {
  viewCount: number;
  commentCount: number;
  bookmarkCount: number;
  shareCount: number;
  versionCount: number;
}

interface DailyView {
  date: string;
  count: number;
}

interface ReferrerStat {
  source: string;
  count: number;
  percentage: number;
}

interface HourStat {
  hour: number;
  count: number;
}

interface DeviceStat {
  type: string;
  count: number;
  percentage: number;
}

interface DetailedAnalytics {
  dailyViews: DailyView[];
  referrers: ReferrerStat[];
  peakHours: HourStat[];
  devices: DeviceStat[];
}

interface Props {
  resumeId: string;
}

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

function HourHeatmap({ hours }: { hours: HourStat[] }) {
  const maxCount = Math.max(...hours.map((h) => h.count), 1);
  return (
    <div className="grid grid-cols-12 gap-1">
      {hours.map((h) => {
        const intensity = h.count / maxCount;
        const bg =
          intensity === 0
            ? 'bg-slate-100 dark:bg-slate-700'
            : intensity < 0.25
              ? 'bg-indigo-100 dark:bg-indigo-900/30'
              : intensity < 0.5
                ? 'bg-indigo-200 dark:bg-indigo-800/40'
                : intensity < 0.75
                  ? 'bg-indigo-300 dark:bg-indigo-700/50'
                  : 'bg-indigo-500 dark:bg-indigo-500';
        return (
          <div key={h.hour} className="flex flex-col items-center gap-0.5 group relative">
            <div
              className={`w-full aspect-square rounded ${bg} cursor-default transition-colors`}
            />
            <span className="text-[9px] text-slate-400">{h.hour}</span>
            <div className="absolute bottom-full mb-1 hidden group-hover:block z-10">
              <div className="bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                {h.hour}시: {h.count}회
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function generateMockDetailedAnalytics(viewCount: number): DetailedAnalytics {
  const dailyViews: DailyView[] = [];
  const now = new Date();
  let remaining = viewCount;

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const weight = (30 - i) / 30;
    const count =
      i === 0
        ? remaining
        : Math.min(remaining, Math.floor(Math.random() * (viewCount / 10) * weight));
    remaining = Math.max(0, remaining - count);
    dailyViews.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      count,
    });
  }

  const directPct = 35 + Math.floor(Math.random() * 15);
  const browsePct = 25 + Math.floor(Math.random() * 15);
  const sharePct = 100 - directPct - browsePct;
  const referrers: ReferrerStat[] = [
    {
      source: '직접 방문',
      count: Math.round((viewCount * directPct) / 100),
      percentage: directPct,
    },
    {
      source: '탐색 페이지',
      count: Math.round((viewCount * browsePct) / 100),
      percentage: browsePct,
    },
    { source: '공유 링크', count: Math.round((viewCount * sharePct) / 100), percentage: sharePct },
  ];

  const peakHours: HourStat[] = [];
  for (let h = 0; h < 24; h++) {
    const isBusinessHour = h >= 9 && h <= 18;
    const isLunchHour = h >= 12 && h <= 13;
    const base = isLunchHour ? 3 : isBusinessHour ? 2 : 0.5;
    peakHours.push({
      hour: h,
      count: Math.floor((Math.random() * viewCount * base) / 24),
    });
  }

  const mobilePct = 55 + Math.floor(Math.random() * 15);
  const desktopPct = 100 - mobilePct;
  const devices: DeviceStat[] = [
    { type: '모바일', count: Math.round((viewCount * mobilePct) / 100), percentage: mobilePct },
    { type: '데스크톱', count: Math.round((viewCount * desktopPct) / 100), percentage: desktopPct },
  ];

  return { dailyViews, referrers, peakHours, devices };
}

export default function ResumeAnalytics({ resumeId }: Props) {
  const [data, setData] = useState<Analytics | null>(null);
  const [detailed, setDetailed] = useState<DetailedAnalytics | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    fetch(`${API_URL}/api/resumes/analytics/${resumeId}`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setData(d);
        if (d) {
          setDetailed(generateMockDetailedAnalytics(d.viewCount || 0));
        }
      })
      .catch(() => {});
  }, [resumeId]);

  if (!data) return null;

  const stats = [
    { label: '조회', value: data.viewCount, icon: '👁', color: 'text-blue-600' },
    { label: '댓글', value: data.commentCount, icon: '💬', color: 'text-green-600' },
    { label: '북마크', value: data.bookmarkCount, icon: '🔖', color: 'text-amber-600' },
    { label: '공유', value: data.shareCount, icon: '🔗', color: 'text-sky-600' },
    { label: '버전', value: data.versionCount, icon: '📋', color: 'text-slate-600' },
  ];

  // 최근 14일 조회수 데이터 (LineChart)
  const recentViews = detailed
    ? detailed.dailyViews.slice(-14).map((d) => ({ name: d.date, 조회수: d.count }))
    : [];

  // 섹션별 완성도 BarChart (분석 카드 통계 기반)
  const completionData = [
    { name: '조회', value: data.viewCount },
    { name: '댓글', value: data.commentCount },
    { name: '북마크', value: data.bookmarkCount },
    { name: '공유', value: data.shareCount },
    { name: '버전', value: data.versionCount },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 no-print">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">이력서 분석</h3>
        {data.viewCount > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            {expanded ? '간략히' : '상세 보기'}
          </button>
        )}
      </div>

      {/* 숫자 스탯 */}
      <div className="grid grid-cols-5 gap-2 mb-3">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <span className="text-sm block mb-0.5">{s.icon}</span>
            <span className={`text-lg font-bold ${s.color} block`}>{s.value}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">{s.label}</span>
          </div>
        ))}
      </div>

      {/* 활동 BarChart */}
      {completionData.some((d) => d.value > 0) && (
        <div className="mb-2">
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={completionData} margin={{ top: 0, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  fontSize: 11,
                }}
              />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {completionData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detailed Analytics */}
      {expanded && detailed && (
        <div className="mt-4 space-y-5 border-t border-slate-100 dark:border-slate-700 pt-4">
          {/* 최근 14일 조회수 LineChart */}
          {recentViews.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                최근 14일 조회수 추이
              </h4>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={recentViews} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorViewLine" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: 'none',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      fontSize: 11,
                    }}
                    formatter={(v: number) => [`${v}회`, '조회수']}
                  />
                  <Line
                    type="monotone"
                    dataKey="조회수"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 유입 경로 */}
          <div>
            <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
              유입 경로
            </h4>
            <div className="space-y-2">
              {detailed.referrers.map((r) => (
                <div key={r.source}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-slate-600 dark:text-slate-400">{r.source}</span>
                    <span className="text-slate-500 dark:text-slate-500">
                      {r.count}회 ({r.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        r.source === '직접 방문'
                          ? 'bg-indigo-400'
                          : r.source === '탐색 페이지'
                            ? 'bg-blue-400'
                            : 'bg-emerald-400'
                      }`}
                      style={{ width: `${r.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 시간대별 조회 히트맵 */}
          <div>
            <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
              시간대별 조회 (0-23시)
            </h4>
            <HourHeatmap hours={detailed.peakHours} />
          </div>

          {/* 디바이스 분포 PieChart */}
          <div>
            <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
              디바이스
            </h4>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={100} height={100}>
                <PieChart>
                  <Pie
                    data={detailed.devices}
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={45}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {detailed.devices.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: 'none',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      fontSize: 11,
                    }}
                    formatter={(v: number, name: string) => [`${v}회`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2">
                {detailed.devices.map((d, i) => (
                  <div key={d.type} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: COLORS[i] }}
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {d.type === '모바일' ? '📱' : '🖥️'} {d.type} <strong>{d.percentage}%</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
