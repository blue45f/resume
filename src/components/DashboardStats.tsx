import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '@/lib/config';


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
    <span className={`inline-flex items-center text-[10px] font-medium ${isUp ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
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

function MiniSparkline({ data }: { data: number[] }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const barCount = data.length;
  return (
    <div className="flex items-end gap-px mt-1.5" style={{ height: '20px' }} aria-label="최근 7일 조회수 추이">
      {data.slice(-7).map((val, i) => {
        const heightPct = Math.max((val / max) * 100, 4);
        return (
          <div
            key={i}
            className="flex-1 rounded-sm bg-purple-400/60 dark:bg-purple-500/40 transition-all duration-300"
            style={{ height: `${heightPct}%`, minWidth: '3px', maxWidth: '8px' }}
            title={`${barCount - 7 + i + 1}일: ${val}회`}
          />
        );
      })}
    </div>
  );
}

export default function DashboardStats() {
  const [data, setData] = useState<DashboardData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    fetch(`${API_URL}/api/resumes/dashboard/analytics`, { headers })
      .then(r => r.ok ? r.json() : null)
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
    { label: '이력서', value: data.summary.totalResumes, prevValue: prev.totalResumes, icon: '📄', color: 'text-blue-600', link: '/' },
    { label: '공개', value: data.summary.publicResumes, prevValue: prev.publicResumes, icon: '🌐', color: 'text-green-600', link: '/explore' },
    { label: '총 조회', value: data.summary.totalViews, prevValue: prev.totalViews, icon: '👁', color: 'text-purple-600', link: '/', sparkline: true },
    { label: 'AI 변환', value: data.summary.totalTransforms, prevValue: prev.totalTransforms, icon: '🤖', color: 'text-amber-600', link: '/templates' },
    { label: '최근 편집', value: data.summary.recentEdits, prevValue: prev.recentEdits, icon: '✏️', color: 'text-rose-600', link: '/' },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
      {stats.map(s => (
        <button
          key={s.label}
          onClick={() => navigate(s.link)}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 cursor-pointer group"
        >
          <span className="text-lg">{s.icon}</span>
          <div className={`text-xl font-bold ${s.color} mt-1 group-hover:scale-105 transition-transform`}>{s.value}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{s.label}</div>
          <TrendIndicator current={s.value} previous={s.prevValue} />
          {s.sparkline && data.dailyViews && <MiniSparkline data={data.dailyViews} />}
        </button>
      ))}
    </div>
  );
}
