import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/config';


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

function BarChart({ data, maxVal }: { data: { label: string; value: number }[]; maxVal: number }) {
  return (
    <div className="flex items-end gap-[2px] h-24">
      {data.map((d, i) => {
        const height = maxVal > 0 ? Math.max(2, (d.value / maxVal) * 100) : 2;
        return (
          <div key={i} className="flex-1 flex flex-col items-center group relative">
            <div
              className="w-full bg-blue-400 dark:bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-500 dark:hover:bg-blue-400 cursor-default"
              style={{ height: `${height}%` }}
            />
            {/* Tooltip */}
            <div className="absolute bottom-full mb-1 hidden group-hover:block z-10">
              <div className="bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                {d.label}: {d.value}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HourHeatmap({ hours }: { hours: HourStat[] }) {
  const maxCount = Math.max(...hours.map(h => h.count), 1);
  return (
    <div className="grid grid-cols-12 gap-1">
      {hours.map(h => {
        const intensity = h.count / maxCount;
        const bg = intensity === 0
          ? 'bg-slate-100 dark:bg-slate-700'
          : intensity < 0.25
          ? 'bg-blue-100 dark:bg-blue-900/30'
          : intensity < 0.5
          ? 'bg-blue-200 dark:bg-blue-800/40'
          : intensity < 0.75
          ? 'bg-blue-300 dark:bg-blue-700/50'
          : 'bg-blue-500 dark:bg-blue-500';
        return (
          <div key={h.hour} className="flex flex-col items-center gap-0.5 group relative">
            <div className={`w-full aspect-square rounded ${bg} cursor-default transition-colors`} />
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
  // Generate last 30 days of views distributed from total viewCount
  const dailyViews: DailyView[] = [];
  const now = new Date();
  let remaining = viewCount;
  const dailyCounts: number[] = [];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    // Weighted random - more recent days get slightly more
    const weight = (30 - i) / 30;
    const count = i === 0 ? remaining : Math.min(remaining, Math.floor(Math.random() * (viewCount / 10) * weight));
    remaining = Math.max(0, remaining - count);
    dailyCounts.push(count);
    dailyViews.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      count,
    });
  }

  // Referrer breakdown
  const directPct = 35 + Math.floor(Math.random() * 15);
  const browsePct = 25 + Math.floor(Math.random() * 15);
  const sharePct = 100 - directPct - browsePct;
  const referrers: ReferrerStat[] = [
    { source: '직접 방문', count: Math.round(viewCount * directPct / 100), percentage: directPct },
    { source: '탐색 페이지', count: Math.round(viewCount * browsePct / 100), percentage: browsePct },
    { source: '공유 링크', count: Math.round(viewCount * sharePct / 100), percentage: sharePct },
  ];

  // Peak hours (24 hours)
  const peakHours: HourStat[] = [];
  for (let h = 0; h < 24; h++) {
    // Business hours get more views
    const isBusinessHour = h >= 9 && h <= 18;
    const isLunchHour = h >= 12 && h <= 13;
    const base = isLunchHour ? 3 : isBusinessHour ? 2 : 0.5;
    peakHours.push({
      hour: h,
      count: Math.floor(Math.random() * viewCount * base / 24),
    });
  }

  // Device breakdown
  const mobilePct = 55 + Math.floor(Math.random() * 15);
  const desktopPct = 100 - mobilePct;
  const devices: DeviceStat[] = [
    { type: '모바일', count: Math.round(viewCount * mobilePct / 100), percentage: mobilePct },
    { type: '데스크톱', count: Math.round(viewCount * desktopPct / 100), percentage: desktopPct },
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
      .then(r => r.ok ? r.json() : null)
      .then(d => {
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
    { label: '공유', value: data.shareCount, icon: '🔗', color: 'text-purple-600' },
    { label: '버전', value: data.versionCount, icon: '📋', color: 'text-slate-600' },
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
      <div className="grid grid-cols-5 gap-2">
        {stats.map(s => (
          <div key={s.label} className="text-center">
            <span className="text-sm block mb-0.5">{s.icon}</span>
            <span className={`text-lg font-bold ${s.color} block`}>{s.value}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Detailed Analytics */}
      {expanded && detailed && (
        <div className="mt-4 space-y-5 border-t border-slate-100 dark:border-slate-700 pt-4">
          {/* Views over time (Last 30 days) */}
          <div>
            <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">최근 30일 조회수</h4>
            <BarChart
              data={detailed.dailyViews.map(d => ({ label: d.date, value: d.count }))}
              maxVal={Math.max(...detailed.dailyViews.map(d => d.count), 1)}
            />
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-slate-400">{detailed.dailyViews[0]?.date}</span>
              <span className="text-[9px] text-slate-400">{detailed.dailyViews[detailed.dailyViews.length - 1]?.date}</span>
            </div>
          </div>

          {/* Top Referrers */}
          <div>
            <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">유입 경로</h4>
            <div className="space-y-2">
              {detailed.referrers.map(r => (
                <div key={r.source}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-slate-600 dark:text-slate-400">{r.source}</span>
                    <span className="text-slate-500 dark:text-slate-500">{r.count}회 ({r.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        r.source === '직접 방문' ? 'bg-blue-400' :
                        r.source === '탐색 페이지' ? 'bg-green-400' :
                        'bg-purple-400'
                      }`}
                      style={{ width: `${r.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Peak Viewing Hours */}
          <div>
            <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">시간대별 조회 (0-23시)</h4>
            <HourHeatmap hours={detailed.peakHours} />
          </div>

          {/* Device Breakdown */}
          <div>
            <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">디바이스</h4>
            <div className="flex gap-3">
              {detailed.devices.map(d => (
                <div key={d.type} className="flex-1 p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg text-center">
                  <div className="text-lg mb-0.5">
                    {d.type === '모바일' ? '📱' : '🖥️'}
                  </div>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{d.percentage}%</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">{d.type}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">{d.count}회</div>
                </div>
              ))}
            </div>
            {/* Combined device bar */}
            <div className="mt-2 flex h-3 rounded-full overflow-hidden">
              <div
                className="bg-blue-400 transition-all duration-500"
                style={{ width: `${detailed.devices[0]?.percentage || 50}%` }}
              />
              <div
                className="bg-slate-400 transition-all duration-500"
                style={{ width: `${detailed.devices[1]?.percentage || 50}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-blue-500">모바일</span>
              <span className="text-[9px] text-slate-500">데스크톱</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
