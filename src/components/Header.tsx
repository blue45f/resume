import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getUser, clearAuth } from '@/lib/auth';
import { getTheme, setTheme } from '@/lib/theme';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setThemeState] = useState(getTheme());
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const user = getUser();
  const location = useLocation();
  const isHome = location.pathname === '/';

  const cycleTheme = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
    setThemeState(next);
  };
  const themeIcon = theme === 'dark' ? '\u{1F319}' : theme === 'light' ? '\u{2600}\u{FE0F}' : '\u{1F4BB}';
  const themeLabel = theme === 'dark' ? '\uB2E4\uD06C' : theme === 'light' ? '\uB77C\uC774\uD2B8' : '\uC2DC\uC2A4\uD15C';

  // Escape 키로 메뉴 닫기
  useEffect(() => {
    if (!menuOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [menuOpen]);

  // 페이지 이동 시 메뉴 닫기
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  return (
    <header className="no-print bg-white/80 backdrop-blur-lg border-b border-slate-200/80 sticky top-0 z-50 dark:bg-slate-900/80 dark:border-slate-700/80">
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
            className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            aria-label="이력서공방 홈"
          >
            이력서공방
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-3" aria-label="주요 메뉴">
            {!isHome && (
              <Link to="/" className="text-sm text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1">
                이력서
              </Link>
            )}
            <Link to="/explore" className={`text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 ${location.pathname === '/explore' ? 'text-blue-600 font-medium' : 'text-slate-600 hover:text-slate-900'}`} aria-current={location.pathname === '/explore' ? 'page' : undefined}>
              탐색
            </Link>
            <Link to="/templates" className={`text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 ${location.pathname === '/templates' ? 'text-blue-600 font-medium' : 'text-slate-600 hover:text-slate-900'}`} aria-current={location.pathname === '/templates' ? 'page' : undefined}>
              템플릿
            </Link>
            <Link to="/tags" className={`text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 ${location.pathname === '/tags' ? 'text-blue-600 font-medium' : 'text-slate-600 hover:text-slate-900'}`} aria-current={location.pathname === '/tags' ? 'page' : undefined}>
              태그
            </Link>
            <Link to="/applications" className={`text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 ${location.pathname === '/applications' ? 'text-blue-600 font-medium' : 'text-slate-600 hover:text-slate-900'}`} aria-current={location.pathname === '/applications' ? 'page' : undefined}>
              지원관리
            </Link>
            <Link to="/cover-letter" className={`text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 ${location.pathname === '/cover-letter' ? 'text-blue-600 font-medium' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`} aria-current={location.pathname === '/cover-letter' ? 'page' : undefined}>
              자소서
            </Link>
            <Link to="/compare" className={`text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 ${location.pathname === '/compare' ? 'text-blue-600 font-medium' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`} aria-current={location.pathname === '/compare' ? 'page' : undefined}>
              비교
            </Link>
            {showSearch ? (
              <form onSubmit={(e) => { e.preventDefault(); navigate(`/explore?q=${encodeURIComponent(searchQuery)}`); setShowSearch(false); setSearchQuery(''); }} className="flex items-center">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="이력서 검색..."
                  className="w-40 px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button type="button" onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="ml-1 text-slate-400 hover:text-slate-600 text-sm">
                  &times;
                </button>
              </form>
            ) : (
              <button onClick={() => setShowSearch(true)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors" aria-label="검색">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
            )}
            <Link
              to="/auto-generate"
              className="inline-flex items-center px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors duration-200"
            >
              AI 생성
            </Link>
            <Link
              to="/resumes/new"
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
            >
              + 새 이력서
            </Link>
            <button
              onClick={cycleTheme}
              className="flex items-center gap-1 px-2 py-1.5 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
              aria-label={`테마 변경 (현재: ${themeLabel})`}
              title={`테마: ${themeLabel}`}
            >
              <span aria-hidden="true">{themeIcon}</span>
              <span className="text-xs text-slate-400">{themeLabel}</span>
            </button>
            {user ? (
              <>
                <Link to="/settings" className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 transition-colors duration-200">
                  {user.name || user.email}
                </Link>
                <button
                  onClick={() => { clearAuth(); navigate('/'); window.location.reload(); }}
                  className="text-sm text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 transition-colors duration-200"
                  aria-label="로그아웃"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <Link to="/login" className="text-sm text-blue-600 hover:text-blue-800 px-2 py-1">로그인</Link>
            )}
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
          <nav className="sm:hidden pb-4 space-y-1 border-t border-slate-100 dark:border-slate-700 pt-3 animate-fade-in" aria-label="모바일 메뉴">
            <Link to="/" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">이력서</Link>
            <Link to="/explore" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">탐색</Link>
            <Link to="/templates" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">템플릿</Link>
            <Link to="/tags" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">태그</Link>

            <div className="border-t border-slate-100 dark:border-slate-700 my-1" />

            <Link to="/applications" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">지원관리</Link>
            <Link to="/cover-letter" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">자소서</Link>
            <Link to="/compare" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">이력서 비교</Link>

            <div className="border-t border-slate-100 dark:border-slate-700 my-1" />

            <Link to="/resumes/new" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30">+ 새 이력서</Link>
            <Link to="/auto-generate" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30">AI 자동 생성</Link>

            {user && (
              <>
                <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                <Link to="/settings" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">설정</Link>
              </>
            )}

            <div className="border-t border-slate-100 dark:border-slate-700 my-1" />

            <button
              onClick={cycleTheme}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              aria-label={`테마 변경 (현재: ${themeLabel})`}
            >
              <span aria-hidden="true">{themeIcon}</span>
              <span>테마: {themeLabel}</span>
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
