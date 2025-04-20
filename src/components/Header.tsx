import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg"
      >
        본문으로 건너뛰기
      </a>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link
            to="/"
            className="text-lg sm:text-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            aria-label="Resume Manager 홈"
          >
            Resume Manager
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-3" aria-label="주요 메뉴">
            {!isHome && (
              <Link to="/" className="text-sm text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1">
                이력서
              </Link>
            )}
            <Link to="/templates" className="text-sm text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1">
              템플릿
            </Link>
            <Link to="/tags" className="text-sm text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1">
              태그
            </Link>
            <Link
              to="/resumes/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              + 새 이력서
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-2 text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="메뉴 열기"
            aria-expanded={menuOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <nav className="sm:hidden pb-4 space-y-1 border-t border-slate-100 pt-3" aria-label="모바일 메뉴">
            <Link to="/" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-slate-50">이력서</Link>
            <Link to="/templates" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-slate-50">템플릿</Link>
            <Link to="/tags" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-slate-50">태그</Link>
            <Link to="/resumes/new" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-medium text-blue-600 rounded-lg hover:bg-blue-50">+ 새 이력서</Link>
          </nav>
        )}
      </div>
    </header>
  );
}
