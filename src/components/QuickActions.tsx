import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getUser } from '@/lib/auth';

const ACTIONS = [
  { label: '새 이력서', to: '/resumes/new', icon: '📝', color: 'bg-blue-600 hover:bg-blue-700' },
  { label: 'AI 자동 생성', to: '/auto-generate', icon: '🤖', color: 'bg-purple-600 hover:bg-purple-700' },
  { label: '자소서 생성', to: '/cover-letter', icon: '✉️', color: 'bg-indigo-600 hover:bg-indigo-700' },
  { label: '면접 준비', to: '/interview-prep', icon: '🎯', color: 'bg-emerald-600 hover:bg-emerald-700' },
  { label: '이력서 비교', to: '/compare', icon: '⚖️', color: 'bg-amber-600 hover:bg-amber-700' },
];

const RECRUITER_ACTIONS = [
  { label: '채용공고 등록', to: '/jobs/new', icon: '📋', color: 'bg-teal-600 hover:bg-teal-700' },
  { label: '스카우트', to: '/scouts', icon: '🔍', color: 'bg-cyan-600 hover:bg-cyan-700' },
];

export default function QuickActions() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const user = getUser();
  const isRecruiter = user?.userType === 'recruiter' || user?.userType === 'company';

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const actions = isRecruiter ? [...ACTIONS, ...RECRUITER_ACTIONS] : ACTIONS;

  return (
    <div className="fixed bottom-20 sm:bottom-20 right-4 sm:right-6 z-40 no-print" ref={ref}>
      {open && (
        <>
          <div className="fixed inset-0 bg-black/10 dark:bg-black/30 z-[-1]" onClick={() => setOpen(false)} />
          <div className="mb-3 space-y-2">
            {actions.map((action, i) => (
              <Link
                key={action.to}
                to={action.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-white text-sm font-medium rounded-xl shadow-lg transition-all duration-200 animate-fade-in-up ${action.color}`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <span className="text-base">{action.icon}</span>
                {action.label}
              </Link>
            ))}
          </div>
        </>
      )}
      <button
        onClick={() => setOpen(!open)}
        className={`btn-press w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          open
            ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 rotate-45 scale-90'
            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl hover:scale-105'
        }`}
        aria-label={open ? '빠른 메뉴 닫기' : '빠른 메뉴 열기'}
        aria-expanded={open}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}
