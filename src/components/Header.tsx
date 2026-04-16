import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getUser, setAuth, getToken, clearAuth } from '@/lib/auth';
import { getTheme, setTheme } from '@/lib/theme';
import { t, getLocale, setLocale, LOCALES, getLocaleName } from '@/lib/i18n';
import NotificationBell from '@/components/NotificationBell';
import { fetchFollowers, fetchFollowing } from '@/lib/api';
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
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileTriggerRef = useRef<HTMLButtonElement>(null);
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

  // Escape 키로 메뉴 닫기 + 프로필 메뉴 키보드 내비게이션
  useEffect(() => {
    if (!menuOpen && !profileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setProfileMenuOpen(false);
        profileTriggerRef.current?.focus();
        return;
      }
      // Arrow key navigation for profile dropdown
      if (profileMenuOpen && profileMenuRef.current) {
        const items = Array.from(profileMenuRef.current.querySelectorAll<HTMLElement>('a, button:not([disabled])'));
        const currentIndex = items.indexOf(document.activeElement as HTMLElement);
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const next = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
          items[next]?.focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
          items[prev]?.focus();
        } else if (e.key === 'Home') {
          e.preventDefault();
          items[0]?.focus();
        } else if (e.key === 'End') {
          e.preventDefault();
          items[items.length - 1]?.focus();
        } else if (e.key === 'Tab') {
          if (items.length === 0) return;
          if (e.shiftKey && currentIndex <= 0) {
            e.preventDefault();
            profileTriggerRef.current?.focus();
          } else if (!e.shiftKey && currentIndex >= items.length - 1) {
            e.preventDefault();
            profileTriggerRef.current?.focus();
          }
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
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

  // 팔로워/팔로잉 수 로드
  useEffect(() => {
    if (!user) return;
    fetchFollowers().then(f => setFollowerCount(Array.isArray(f) ? f.length : 0)).catch(() => {});
    fetchFollowing().then(f => setFollowingCount(Array.isArray(f) ? f.length : 0)).catch(() => {});
  }, [user?.id]);

  // 스크롤 시 header glassmorphism 전환
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll(); // check initial state
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`no-print sticky top-0 z-50 border-b header-glass ${scrolled ? 'header-scrolled header-scrolled-enhanced' : ''}`}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg"
      >
        {t('a11y.skipToContent')}
      </a>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link
            to="/"
            className="logo-hover text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded inline-flex items-center gap-2"
            aria-label="이력서공방 홈"
          >
            <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            이력서공방
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1.5" aria-label={t('a11y.mainMenu')}>
            {!isHome && (
              <Link to="/" className="nav-link-animated text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 rounded px-2 py-1">
                {t('nav.resumes')}
              </Link>
            )}
            {/* Common items */}
            <Link to="/explore" className={`nav-link-animated text-sm rounded px-2 py-1 ${location.pathname === '/explore' ? 'text-blue-600 font-medium active' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}>
              {t('nav.explore')}
            </Link>
            <Link to="/community" className={`nav-link-animated text-sm rounded px-2 py-1 ${location.pathname.startsWith('/community') ? 'text-blue-600 font-medium active' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}>
              커뮤니티
            </Link>
            {/* Role-specific items */}
            {isRecruiter ? (
              <Link to="/recruiter" className={`nav-link-animated text-sm rounded px-2 py-1 ${location.pathname === '/recruiter' ? 'text-blue-600 font-medium active' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}>
                채용 대시보드
              </Link>
            ) : (
              <>
                <Link to="/applications" className={`nav-link-animated text-sm rounded px-2 py-1 ${location.pathname === '/applications' ? 'text-blue-600 font-medium active' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}>
                  {t('nav.applications')}
                </Link>
                <Link to="/my-cover-letters" className={`nav-link-animated text-sm rounded px-2 py-1 ${location.pathname === '/my-cover-letters' ? 'text-blue-600 font-medium active' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}>
                  자소서
                </Link>
              </>
            )}
            {/* Common items */}
            <Link to="/bookmarks" className={`nav-link-animated text-sm rounded px-2 py-1 ${location.pathname === '/bookmarks' ? 'text-blue-600 font-medium active' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}>
              북마크
            </Link>
            <Link to="/messages" className={`nav-link-animated text-sm rounded px-2 py-1 ${location.pathname === '/messages' ? 'text-blue-600 font-medium active' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}>
              쪽지
            </Link>
            {/* More dropdown */}
            <div className="relative group">
              <button
                className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 px-2 py-1 rounded"
                aria-haspopup="true"
                aria-label={t('common.more')}
              >
                {t('common.more')} <span aria-hidden="true">▾</span>
              </button>
              <div role="menu" aria-label={t('common.more')} className="absolute left-0 top-full mt-1 w-44 glass-dropdown rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 z-50 py-1">
                {isRecruiter ? (
                  <>
                    <p className="px-3 py-1 text-xs font-medium text-slate-400 dark:text-slate-500" role="presentation">채용</p>
                    <Link to="/scouts" className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">스카우트</Link>
                    <Link to="/jobs" className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">채용공고</Link>
                    <Link to="/jobs/new" className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">공고 등록</Link>
                    <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                  </>
                ) : null}
                <p className="px-3 py-1 text-xs font-medium text-slate-400 dark:text-slate-500" role="presentation">도구</p>
                <Link to="/cover-letter" className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">{t('nav.coverLetter')}</Link>
                <Link to="/compare" className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">{t('nav.compare')}</Link>
                <Link to="/translate" className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">번역</Link>
                <Link to="/interview-prep" className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">면접 준비</Link>

                <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                <Link to="/templates" className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">{t('nav.templates')}</Link>
                <Link to="/tags" className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">{t('nav.tags')}</Link>
                <Link to="/pricing" className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">요금제</Link>
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
                  ref={profileTriggerRef}
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 transition-colors duration-200 flex items-center gap-1"
                  aria-haspopup="true"
                  aria-expanded={profileMenuOpen}
                  aria-label={t('a11y.profileMenu')}
                >
                  <span className={`inline-block w-2 h-2 rounded-full ${isRecruiter ? 'bg-purple-500' : 'bg-green-500'}`} aria-hidden="true" />
                  {user.name || user.email}
                  <span className="text-xs" aria-hidden="true">▾</span>
                </button>
                {profileMenuOpen && (
                  <div ref={profileMenuRef} role="menu" aria-label={t('a11y.profileMenu')} className="absolute right-0 top-full mt-1 w-52 glass-dropdown rounded-xl shadow-lg z-50 py-1">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                      <p className="text-xs text-slate-400 dark:text-slate-500">현재 모드</p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {isRecruiter ? '채용담당자' : '개인 (구직자)'}
                      </p>
                    </div>
                    <button
                      onClick={toggleUserType}
                      disabled={switching}
                      role="menuitem"
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-600 focus:outline-none flex items-center gap-2"
                    >
                      <span className={`inline-block w-2 h-2 rounded-full ${isRecruiter ? 'bg-green-500' : 'bg-purple-500'}`} aria-hidden="true" />
                      {switching ? '전환 중...' : isRecruiter ? '개인 모드로 전환' : '채용담당자 모드로 전환'}
                    </button>
                    <div className="border-t border-slate-100 dark:border-slate-700 my-1" role="separator" />
                    <Link to="/social/follows" onClick={() => setProfileMenuOpen(false)} role="menuitem" className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-600 focus:outline-none">
                      <div className="flex items-center justify-between">
                        <span>팔로워 / 팔로잉</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">{followerCount} / {followingCount}</span>
                      </div>
                    </Link>
                    <Link to="/settings" onClick={() => setProfileMenuOpen(false)} role="menuitem" className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-600 focus:outline-none">
                      {t('common.settings')}
                    </Link>
                    <button
                      onClick={() => { clearAuth(); navigate('/'); window.location.reload(); }}
                      role="menuitem"
                      className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-600 focus:outline-none"
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
            aria-label={menuOpen ? t('a11y.closeMenu') : t('a11y.openMenu')}
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
          <nav className="md:hidden pb-4 space-y-0.5 border-t border-slate-100 dark:border-slate-700 pt-3 animate-fade-in max-h-[70vh] overflow-y-auto" aria-label={t('a11y.mobileMenu')}>
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
            <Link to="/community" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">커뮤니티</Link>
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
            <p className="px-3 py-1 text-xs font-medium text-slate-400 dark:text-slate-500">커뮤니티</p>
            <Link to="/community" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">게시판</Link>
            <Link to="/notices" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">공지사항</Link>

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
