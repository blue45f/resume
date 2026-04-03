import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getUser, setAuth, getToken, clearAuth } from '@/lib/auth';
import { getTheme, setTheme } from '@/lib/theme';
import { t, getLocale, setLocale, LOCALES, getLocaleName } from '@/lib/i18n';
import NotificationBell from '@/components/NotificationBell';
import { API_URL } from '@/lib/config';


export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setThemeState] = useState(getTheme());
  const [locale, setLocaleState] = useState(getLocale());
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [switching, setSwitching] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(getUser());
  const user = currentUser;
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isRecruiter = user?.userType === 'recruiter' || user?.userType === 'company';

  const toggleUserType = async () => {
    if (!user || switching) return;
    setSwitching(true);
    const newType = isRecruiter ? 'personal' : 'recruiter';
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ userType: newType }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      if (token) setAuth(token, updated);
      setCurrentUser(updated);
      setProfileMenuOpen(false);
    } catch {
      // silently fail
    } finally {
      setSwitching(false);
    }
  };

  const cycleTheme = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
    setThemeState(next);
  };
  const themeIcon = theme === 'dark' ? '\u{1F319}' : theme === 'light' ? '\u{2600}\u{FE0F}' : '\u{1F4BB}';
  const themeLabel = theme === 'dark' ? '\uB2E4\uD06C' : theme === 'light' ? '\uB77C\uC774\uD2B8' : '\uC2DC\uC2A4\uD15C';

  // Escape 키로 메뉴 닫기
  useEffect(() => {
    if (!menuOpen && !profileMenuOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setMenuOpen(false); setProfileMenuOpen(false); }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [menuOpen, profileMenuOpen]);

  // 외부 클릭 시 프로필 메뉴 닫기
  useEffect(() => {
    if (!profileMenuOpen) return;
    const handleClick = () => setProfileMenuOpen(false);
    // delay to avoid closing on the same click that opened it
    const timer = setTimeout(() => document.addEventListener('click', handleClick), 0);
    return () => { clearTimeout(timer); document.removeEventListener('click', handleClick); };
  }, [profileMenuOpen]);

  // 페이지 이동 시 메뉴 닫기
  useEffect(() => { setMenuOpen(false); setProfileMenuOpen(false); }, [location.pathname]);

  // 스크롤 시 header glassmorphism 전환
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll(); // check initial state
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`no-print sticky top-0 z-50 border-b header-glass ${scrolled ? 'header-scrolled' : ''}`}>
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
            {/* Common items */}
            <Link to="/explore" className={`text-sm rounded px-2 py-1 ${location.pathname === '/explore' ? 'text-blue-600 font-medium' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}>
              {t('nav.explore')}
            </Link>
            {/* Role-specific items */}
            {isRecruiter ? (
              <>
                <Link to="/recruiter" className={`text-sm rounded px-2 py-1 ${location.pathname === '/recruiter' ? 'text-blue-600 font-medium' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}>
                  채용 대시보드
                </Link>
                <Link to="/scouts" className={`text-sm rounded px-2 py-1 ${location.pathname === '/scouts' ? 'text-blue-600 font-medium' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}>
                  스카우트
                </Link>
                <Link to="/jobs" className={`text-sm rounded px-2 py-1 ${location.pathname === '/jobs' ? 'text-blue-600 font-medium' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}>
                  채용공고
                </Link>
              </>
            ) : (
              <>
                <Link to="/applications" className={`text-sm rounded px-2 py-1 ${location.pathname === '/applications' ? 'text-blue-600 font-medium' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}>
                  {t('nav.applications')}
                </Link>
                <Link to="/my-cover-letters" className={`text-sm rounded px-2 py-1 ${location.pathname === '/my-cover-letters' ? 'text-blue-600 font-medium' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}>
                  자소서
                </Link>
              </>
            )}
            {/* Common items */}
            <Link to="/bookmarks" className={`text-sm rounded px-2 py-1 ${location.pathname === '/bookmarks' ? 'text-blue-600 font-medium' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}>
              북마크
            </Link>
            <Link to="/messages" className={`text-sm rounded px-2 py-1 ${location.pathname === '/messages' ? 'text-blue-600 font-medium' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}>
              쪽지
            </Link>
            {/* More dropdown */}
            <div className="relative group">
              <button className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 px-2 py-1 rounded">
                더보기 ▾
              </button>
              <div className="absolute left-0 top-full mt-1 w-44 glass-dropdown rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 py-1">
                <p className="px-3 py-1 text-xs font-medium text-slate-400 dark:text-slate-500">도구</p>
                <Link to="/cover-letter" className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">{t('nav.coverLetter')}</Link>
                <Link to="/compare" className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">{t('nav.compare')}</Link>
                <Link to="/translate" className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">번역</Link>
                <Link to="/interview-prep" className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">면접 준비</Link>

                <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                <Link to="/templates" className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">{t('nav.templates')}</Link>
                <Link to="/tags" className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">{t('nav.tags')}</Link>
                <Link to="/pricing" className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">요금제</Link>
                {isRecruiter && (
                  <>
                    <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                    <Link to="/jobs/new" className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">공고 등록</Link>
                  </>
                )}
              </div>
            </div>
            {(user?.role === 'admin' || user?.role === 'superadmin') && (
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
            <Link to="/resumes/new" className="px-2.5 py-1.5 btn-gradient text-xs font-medium rounded-lg">
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
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 transition-colors duration-200 flex items-center gap-1"
                >
                  <span className={`inline-block w-2 h-2 rounded-full ${isRecruiter ? 'bg-purple-500' : 'bg-green-500'}`} />
                  {user.name || user.email}
                  <span className="text-xs">▾</span>
                </button>
                {profileMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-52 glass-dropdown rounded-xl shadow-lg z-50 py-1">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                      <p className="text-xs text-slate-400 dark:text-slate-500">현재 모드</p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {isRecruiter ? '채용담당자' : '개인 (구직자)'}
                      </p>
                    </div>
                    <button
                      onClick={toggleUserType}
                      disabled={switching}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <span className={`inline-block w-2 h-2 rounded-full ${isRecruiter ? 'bg-green-500' : 'bg-purple-500'}`} />
                      {switching ? '전환 중...' : isRecruiter ? '개인 모드로 전환' : '채용담당자 모드로 전환'}
                    </button>
                    <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                    <Link to="/settings" onClick={() => setProfileMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                      {t('common.settings')}
                    </Link>
                    <button
                      onClick={() => { clearAuth(); navigate('/'); window.location.reload(); }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      {t('common.logout')}
                    </button>
                  </div>
                )}
              </div>
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
          <nav className="md:hidden pb-4 space-y-0.5 border-t border-slate-100 dark:border-slate-700 pt-3 animate-fade-in max-h-[70vh] overflow-y-auto" aria-label="모바일 메뉴">
            {/* User type toggle */}
            {user && (
              <>
                <div className="flex items-center justify-between px-3 py-2 mx-1 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">현재 모드</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {isRecruiter ? '채용담당자' : '개인 (구직자)'}
                    </p>
                  </div>
                  <button
                    onClick={toggleUserType}
                    disabled={switching}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600 transition-colors"
                  >
                    {switching ? '전환 중...' : isRecruiter ? '개인 모드' : '채용 모드'}
                  </button>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-700 my-1.5" />
              </>
            )}

            {/* Main */}
            <Link to="/" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">{t('nav.resumes')}</Link>
            <Link to="/explore" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">{t('nav.explore')}</Link>
            <Link to="/bookmarks" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">북마크</Link>
            <Link to="/messages" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">쪽지</Link>

            {/* Role-specific items */}
            <div className="border-t border-slate-100 dark:border-slate-700 my-1.5" />
            <p className="px-3 py-1 text-xs font-medium text-slate-400 dark:text-slate-500">
              {isRecruiter ? '채용' : '구직'}
            </p>
            {isRecruiter ? (
              <>
                <Link to="/recruiter" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">채용 대시보드</Link>
                <Link to="/scouts" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">스카우트</Link>
                <Link to="/jobs" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">채용공고</Link>
                <Link to="/jobs/new" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">공고 등록</Link>
              </>
            ) : (
              <>
                <Link to="/applications" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">{t('nav.applications')}</Link>
                <Link to="/my-cover-letters" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">내 자소서</Link>
                <Link to="/jobs" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">채용</Link>
              </>
            )}

            <div className="border-t border-slate-100 dark:border-slate-700 my-1.5" />
            <p className="px-3 py-1 text-xs font-medium text-slate-400 dark:text-slate-500">도구</p>
            <Link to="/cover-letter" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">{t('nav.coverLetter')}</Link>
            <Link to="/compare" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">{t('nav.compare')}</Link>
            <Link to="/translate" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">번역</Link>
            <Link to="/interview-prep" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">면접 준비</Link>
            <Link to="/templates" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">{t('nav.templates')}</Link>
            <Link to="/tags" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">{t('nav.tags')}</Link>

            <div className="border-t border-slate-100 dark:border-slate-700 my-1.5" />
            <Link to="/resumes/new" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30">{t('nav.newResume')}</Link>
            <Link to="/auto-generate" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30">AI 자동 생성</Link>

            {user && (
              <>
                <div className="border-t border-slate-100 dark:border-slate-700 my-1.5" />
                <Link to="/settings" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">{t('common.settings')}</Link>
                {(user.role === 'admin' || user.role === 'superadmin') && (
                  <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-red-500 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30">{t('nav.admin')}</Link>
                )}
              </>
            )}

            {/* Language + Theme */}
            <div className="border-t border-slate-100 dark:border-slate-700 my-1.5" />
            <div className="flex items-center gap-2 px-3 py-2">
              <select value={locale} onChange={e => { setLocale(e.target.value as any); setLocaleState(e.target.value as any); }} className="flex-1 text-sm px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-transparent dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {LOCALES.map(l => (<option key={l} value={l}>{getLocaleName(l)}</option>))}
              </select>
              <button onClick={cycleTheme} className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300">
                {themeIcon} {themeLabel}
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
