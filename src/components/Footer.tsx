import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { t } from '@/lib/i18n';
import { API_URL } from '@/lib/config';

function SiteStats() {
  const [stats, setStats] = useState<{ users: number; resumes: number; views: number } | null>(null);
  useEffect(() => {
    fetch(`${API_URL}/api/health/stats`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats({ users: d.users.total, resumes: d.resumes.total, views: d.activity.totalViews }); })
      .catch(() => {});
  }, []);
  if (!stats) return null;
  return (
    <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
      <span><strong className="text-slate-500 dark:text-slate-400">{stats.users.toLocaleString()}</strong> 회원</span>
      <span><strong className="text-slate-500 dark:text-slate-400">{stats.resumes.toLocaleString()}</strong> 이력서</span>
      <span><strong className="text-slate-500 dark:text-slate-400">{stats.views.toLocaleString()}</strong> 조회</span>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="no-print mt-auto border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-white">이력서공방</span>
            </Link>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
            <SiteStats />
          </div>

          {/* Links */}
          <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
            <Link to="/about" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">소개</Link>
            <Link to="/terms" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">이용약관</Link>
            <Link to="/feedback" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">피드백</Link>
            <Link to="/stats" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">통계</Link>
            <Link to="/help" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">도움말</Link>
            <a href="https://github.com/blue45f/resume" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              GitHub
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 text-center text-[11px] text-slate-400 dark:text-slate-500">
          {t('footer.copyright')}
        </div>
      </div>
    </footer>
  );
}
