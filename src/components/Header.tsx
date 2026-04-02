import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getUser, clearAuth } from '@/lib/auth';
import { getTheme, setTheme } from '@/lib/theme';
import { t, getLocale, setLocale, LOCALES, getLocaleName } from '@/lib/i18n';
import NotificationBell from '@/components/NotificationBell';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setThemeState] = useState(getTheme());
  const [locale, setLocaleState] = useState(getLocale());
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
          <nav className="hidden md:flex items-center gap-1.5" aria-label="주요 메뉴">
            {!isHome && (
              <Link to="/" className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 rounded px-2 py-1">
                {t('nav.resumes')}
              </Link>
            )}
            <Link to="/explore" className={`text-sm rounded px-2 py-1 ${location.pathname === '/explore' ? 'text-blue-600 font-medium' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}>
              {t('nav.explore')}
            </Link>
            <Link to="/applications" className={`text-sm rounded px-2 py-1 ${location.pathname === '/applications' ? 'text-blue-600 font-medium' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}>
              {t('nav.applications')}
            </Link>
            {/* More dropdown */}
            <div className="relative group">
              <button className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 px-2 py-1 rounded">
                더보기 ▾
              </button>
              <div className="absolute left-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 py-1">
                <p className="px-3 py-1 text-xs font-medium text-slate-400 dark:text-slate-500">도구</p>
                <Link to="/cover-letter" className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">{t('nav.coverLetter')}</Link>
                <Link to="/compare" className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">{t('nav.compare')}</Link>
                <Link to="/translate" className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">번역</Link>

                <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                <p className="px-3 py-1 text-xs font-medium text-slate-400 dark:text-slate-500">나의</p>
                <Link to="/my-cover-letters" className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">내 자소서</Link>
                <Link to="/bookmarks" className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">북마크</Link>
                <Link to="/scouts" className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">스카우트</Link>
                <Link to="/messages" className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">쪽지</Link>

                <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                <Link to="/templates" className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">{t('nav.templates')}</Link>
                <Link to="/tags" className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">{t('nav.tags')}</Link>
                <Link to="/pricing" className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">요금제</Link>
              </div>
            </div>
            {user?.role === 'admin' || user?.role === 'superadmin' && (
              <Link to="/admin" className={`text-sm rounded px-2 py-1 ${location.pathname === '/admin' ? 'text-red-600 font-medium' : 'text-red-500 hover:text-red-700 dark:text-red-400'}`}>
                {t('nav.admin')}
              </Link>
            )}
            {showSearch ? (
              <form onSubmit={(e) => { e.preventDefault(); navigate(`/explore?q=${encodeURIComponent(searchQuery)}`); setShowSearch(false); setSearchQuery(''); }} className="flex items-center">
                <input type="search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="검색..." className="w-32 px-2.5 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500" autoFocus />
                <button type="button" onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="ml-1 text-slate-400 hover:text-slate-600 text-sm">&times;</button>
              </form>
            ) : (
              <button onClick={() => setShowSearch(true)} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors" aria-label="검색">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
            )}
            <Link to="/resumes/new" className="px-2.5 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
              {t('nav.newResume')}
            </Link>
            {user && <NotificationBell />}
            <button
              onClick={cycleTheme}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
              aria-label={`테마: ${themeLabel}`}
              title={`테마: ${themeLabel}`}
            >
              <span aria-hidden="true">{themeIcon}</span>
            </button>
            <select
              value={locale}
              onChange={e => { setLocale(e.target.value as any); setLocaleState(e.target.value as any); }}
              className="text-xs px-1 py-0.5 border border-slate-200 dark:border-slate-600 rounded bg-transparent text-slate-500 dark:text-slate-400 cursor-pointer"
              aria-label="언어"
            >
              {LOCALES.map(l => (
                <option key={l} value={l}>{l.toUpperCase()}</option>
              ))}
            </select>
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
                  {t('common.logout')}
                </button>
              </>
            ) : (
              <Link to="/login" className="text-sm text-blue-600 hover:text-blue-800 px-2 py-1">{t('common.login')}</Link>
            )}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
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
          <nav className="md:hidden pb-4 space-y-1 border-t border-slate-100 dark:border-slate-700 pt-3 animate-fade-in" aria-label="모바일 메뉴">
            <Link to="/" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">{t('nav.resumes')}</Link>
            <Link to="/explore" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">{t('nav.explore')}</Link>
            <Link to="/templates" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">{t('nav.templates')}</Link>
            <Link to="/tags" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">{t('nav.tags')}</Link>

            <div className="border-t border-slate-100 dark:border-slate-700 my-1" />

            <Link to="/applications" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">{t('nav.applications')}</Link>
            <Link to="/cover-letter" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">{t('nav.coverLetter')}</Link>
            <Link to="/my-cover-letters" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">내 자소서</Link>
            <Link to="/bookmarks" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">북마크</Link>
            <Link to="/scouts" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">스카우트</Link>
            <Link to="/compare" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">{t('nav.compare')}</Link>
            <Link to="/translate" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">번역</Link>
            <Link to="/pricing" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">요금제</Link>

            <div className="border-t border-slate-100 dark:border-slate-700 my-1" />

            <Link to="/resumes/new" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30">+ 새 이력서</Link>
            <Link to="/auto-generate" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30">AI 자동 생성</Link>

            {user && (
              <>
                <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                <Link to="/settings" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">{t('common.settings')}</Link>
                <Link to="/messages" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">쪽지</Link>
                {user?.role === 'admin' || user?.role === 'superadmin' && (
                  <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-red-500 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30">관리자</Link>
                )}
              </>
            )}

            <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
            <div className="px-3 py-2">
              <select
                value={locale}
                onChange={e => { setLocale(e.target.value as any); }}
                className="w-full text-sm px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-transparent dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                {LOCALES.map(l => (
                  <option key={l} value={l}>{getLocaleName(l)}</option>
                ))}
              </select>
            </div>

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
