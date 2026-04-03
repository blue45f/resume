import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Analytics {
  viewCount: number;
  commentCount: number;
  bookmarkCount: number;
  shareCount: number;
  versionCount: number;
}

interface Props {
  resumeId: string;
}

export default function ResumeAnalytics({ resumeId }: Props) {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    fetch(`${API_URL}/api/resumes/analytics/${resumeId}`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(setData)
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
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">이력서 분석</h3>
      <div className="grid grid-cols-5 gap-2">
        {stats.map(s => (
          <div key={s.label} className="text-center">
            <span className="text-sm block mb-0.5">{s.icon}</span>
            <span className={`text-lg font-bold ${s.color} block`}>{s.value}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
