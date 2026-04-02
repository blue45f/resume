import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function QuickActions() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-20 right-6 z-40 no-print">
      {open && (
        <div className="mb-3 space-y-2 animate-fade-in-up">
          {[
            { label: '새 이력서', to: '/resumes/new', icon: '📝', color: 'bg-blue-600 hover:bg-blue-700' },
            { label: 'AI 생성', to: '/auto-generate', icon: '🤖', color: 'bg-purple-600 hover:bg-purple-700' },
            { label: '자소서', to: '/cover-letter', icon: '✉️', color: 'bg-indigo-600 hover:bg-indigo-700' },
          ].map(action => (
            <Link
              key={action.to}
              to={action.to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-xl shadow-lg transition-all duration-200 ${action.color}`}
            >
              <span>{action.icon}</span>
              {action.label}
            </Link>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          open
            ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 rotate-45'
            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl'
        }`}
        aria-label="빠른 메뉴"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}
