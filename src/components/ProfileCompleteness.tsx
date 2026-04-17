import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUser, getToken } from '@/lib/auth';
import { fetchResumes } from '@/lib/api';

interface CheckItem {
  key: string;
  label: string;
  done: boolean;
  link: string;
  icon: string;
}

export default function ProfileCompleteness() {
  const [items, setItems] = useState<CheckItem[]>([]);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('profile-completeness-dismissed') === 'true');
  const user = getUser();

  useEffect(() => {
    if (!user || !getToken() || dismissed) return;

    fetchResumes().then((resumes: unknown) => {
      const resumeList: any[] = Array.isArray(resumes)
        ? resumes
        : ((resumes as { data?: unknown[] })?.data as any[]) || [];
      const hasResume = resumeList.length > 0;
      const hasPublicResume = resumeList.some((r: any) => r.visibility === 'public');

      const checks: CheckItem[] = [
        { key: 'name', label: '이름 설정', done: !!user.name && user.name !== '사용자', link: '/settings', icon: '👤' },
        { key: 'avatar', label: '프로필 사진', done: !!user.avatar, link: '/settings', icon: '📷' },
        { key: 'resume', label: '이력서 작성', done: hasResume, link: '/resumes/new', icon: '📄' },
        { key: 'public', label: '이력서 공개', done: hasPublicResume, link: hasResume ? `/resumes/${resumeList[0]?.id}/preview` : '/resumes/new', icon: '🌐' },
        { key: 'username', label: '사용자명 설정', done: !!user.username, link: '/settings', icon: '🏷️' },
      ];

      setItems(checks);
    }).catch(() => {});
  }, [user?.id, dismissed]);

  if (dismissed || !user || items.length === 0) return null;

  const doneCount = items.filter(i => i.done).length;
  const total = items.length;
  const pct = Math.round((doneCount / total) * 100);

  if (pct === 100) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 mb-6 animate-fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">프로필 완성도</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{doneCount}/{total} 완료</p>
          </div>
        </div>
        <button
          onClick={() => { localStorage.setItem('profile-completeness-dismissed', 'true'); setDismissed(true); }}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
          aria-label="닫기"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Checklist */}
      <div className="space-y-1.5">
        {items.map(item => (
          <Link
            key={item.key}
            to={item.done ? '#' : item.link}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              item.done
                ? 'bg-emerald-50 dark:bg-emerald-900/10'
                : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
            }`}
            onClick={item.done ? (e) => e.preventDefault() : undefined}
          >
            <span className="text-base shrink-0">{item.done ? '✅' : item.icon}</span>
            <span className={`text-sm flex-1 ${
              item.done
                ? 'text-slate-400 dark:text-slate-500 line-through'
                : 'text-slate-700 dark:text-slate-300 font-medium'
            }`}>
              {item.label}
            </span>
            {!item.done && (
              <svg className="w-4 h-4 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
