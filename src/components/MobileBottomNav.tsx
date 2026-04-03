import { Link, useLocation } from 'react-router-dom';
import { getUser } from '@/lib/auth';

const NAV_ITEMS = [
  {
    to: '/',
    label: '홈',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    match: (path: string) => path === '/',
  },
  {
    to: '/explore',
    label: '탐색',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    match: (path: string) => path === '/explore',
  },
  {
    to: '/resumes/new',
    label: '작성',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    match: (path: string) => path === '/resumes/new',
    highlight: true,
  },
  {
    to: '/templates',
    label: '템플릿',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    match: (path: string) => path === '/templates',
  },
  {
    to: '/settings',
    label: '더보기',
    loginRequired: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
    match: (path: string) => path === '/settings' || path === '/login',
  },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const user = getUser();

  // Don't show on login page or resume edit/preview pages
  if (
    location.pathname === '/login' ||
    location.pathname.includes('/edit') ||
    location.pathname.includes('/preview')
  ) {
    return null;
  }

  const lastItem = user
    ? NAV_ITEMS[NAV_ITEMS.length - 1]
    : { ...NAV_ITEMS[NAV_ITEMS.length - 1], to: '/login', label: '로그인' };

  const items = [...NAV_ITEMS.slice(0, -1), lastItem];

  return (
    <nav className="mobile-bottom-nav no-print" aria-label="모바일 탐색">
      {items.map(item => {
        const active = item.match(location.pathname);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 min-w-[56px] transition-colors duration-150 ${
              item.highlight
                ? 'text-white'
                : active
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            {item.highlight ? (
              <span className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30 -mt-3">
                {item.icon}
              </span>
            ) : (
              item.icon
            )}
            <span className={`text-[10px] leading-tight ${item.highlight ? 'text-blue-600 dark:text-blue-400 font-medium' : ''}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
