import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/config';


interface DashboardData {
  summary: {
    totalResumes: number;
    publicResumes: number;
    totalViews: number;
    totalTransforms: number;
    recentEdits: number;
  };
}

export default function DashboardStats() {
  const [data, setData] = useState<DashboardData | null>(null);

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

  const stats = [
    { label: '이력서', value: data.summary.totalResumes, icon: '📄', color: 'text-blue-600' },
    { label: '공개', value: data.summary.publicResumes, icon: '🌐', color: 'text-green-600' },
    { label: '총 조회', value: data.summary.totalViews, icon: '👁', color: 'text-purple-600' },
    { label: 'AI 변환', value: data.summary.totalTransforms, icon: '🤖', color: 'text-amber-600' },
    { label: '최근 편집', value: data.summary.recentEdits, icon: '✏️', color: 'text-rose-600' },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
      {stats.map(s => (
        <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
          <span className="text-lg">{s.icon}</span>
          <div className={`text-xl font-bold ${s.color} mt-1`}>{s.value}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
