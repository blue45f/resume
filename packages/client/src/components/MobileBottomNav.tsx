import { useState, useEffect, type ReactElement } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getUser } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';

type NavItem = {
  to: string;
  label: string;
  icon: (active: boolean) => ReactElement;
  match: (path: string) => boolean;
  highlight?: boolean;
  activeColor?: string;
};

const JOBSEEKER_ITEMS: NavItem[] = [
  {
    to: ROUTES.home,
    label: '홈',
    icon: (active) => (
      <svg
        className="w-6 h-6"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 2.5 : 2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
    match: (p) => p === '/',
    activeColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    to: ROUTES.resume.explore,
    label: '탐색',
    icon: (active) => (
      <svg
        className="w-6 h-6"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 2.5 : 2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
    match: (p) => p === '/explore',
    activeColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    to: ROUTES.resume.new,
    label: '작성',
    icon: () => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    match: (p) => p === '/resumes/new',
    highlight: true,
  },
  {
    to: ROUTES.community.list,
    label: '커뮤니티',
    icon: (active) => (
      <svg
        className="w-6 h-6"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 2.5 : 2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
    match: (p) => p.startsWith('/community'),
    activeColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    to: ROUTES.settings,
    label: '더보기',
    icon: (active) => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 2.5 : 2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    ),
    match: (p) =>
      ['/settings', '/notifications', '/messages', '/bookmarks', '/applications', '/jobs'].some(
        (r) => p.startsWith(r),
      ),
    activeColor: 'text-blue-600 dark:text-blue-400',
  },
];

const RECRUITER_ITEMS: NavItem[] = [
  {
    to: ROUTES.resume.explore,
    label: '인재탐색',
    icon: (active) => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 2.5 : 2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
    match: (p) => p === '/explore',
    activeColor: 'text-sky-600 dark:text-sky-400',
  },
  {
    to: ROUTES.jobs.list,
    label: '채용공고',
    icon: (active) => (
      <svg
        className="w-6 h-6"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 2.5 : 2}
          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
    match: (p) => p.startsWith('/jobs'),
    activeColor: 'text-sky-600 dark:text-sky-400',
  },
  {
    to: ROUTES.jobs.new,
    label: '공고등록',
    icon: () => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    match: (p) => p === '/jobs/new',
    highlight: true,
  },
  {
    to: ROUTES.jobs.scouts,
    label: '스카우트',
    icon: (active) => (
      <svg
        className="w-6 h-6"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 2.5 : 2}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
    match: (p) => p === '/scouts',
    activeColor: 'text-sky-600 dark:text-sky-400',
  },
  {
    to: ROUTES.recruiter.dashboard,
    label: '대시보드',
    icon: (active) => (
      <svg
        className="w-6 h-6"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 2.5 : 2}
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
        />
      </svg>
    ),
    match: (p) => p === '/recruiter',
    activeColor: 'text-sky-600 dark:text-sky-400',
  },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const user = getUser();
  const isRecruiter = user?.userType === 'recruiter' || user?.userType === 'company';
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    if (typeof visualViewport === 'undefined') return;
    const vv = visualViewport;
    const handleResize = () => {
      const threshold = window.innerHeight * 0.75;
      setKeyboardOpen(vv!.height < threshold);
    };
    vv!.addEventListener('resize', handleResize);
    return () => vv!.removeEventListener('resize', handleResize);
  }, []);

  if (
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname.includes('/edit') ||
    location.pathname.includes('/preview') ||
    keyboardOpen
  ) {
    return null;
  }

  const items = isRecruiter ? RECRUITER_ITEMS : JOBSEEKER_ITEMS;
  const activeColor = isRecruiter
    ? 'text-sky-600 dark:text-sky-400'
    : 'text-blue-600 dark:text-blue-400';
  const highlightGradient = isRecruiter
    ? 'bg-gradient-to-br from-blue-600 to-sky-600 shadow-blue-600/30'
    : 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-600/30';

  return (
    <nav className="mobile-bottom-nav no-print" aria-label="모바일 탐색">
      {items.map((item) => {
        const active = item.match(location.pathname);
        const itemActiveColor = item.activeColor || activeColor;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 min-w-[56px] transition-colors duration-150 ${
              item.highlight
                ? 'text-white'
                : active
                  ? itemActiveColor
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            {item.highlight ? (
              <span
                className={`w-10 h-10 ${highlightGradient} rounded-full flex items-center justify-center shadow-lg -mt-3`}
              >
                {item.icon(false)}
              </span>
            ) : (
              item.icon(active)
            )}
            <span
              className={`text-[10px] leading-tight ${
                item.highlight
                  ? `${isRecruiter ? 'text-sky-600 dark:text-sky-400' : 'text-blue-600 dark:text-blue-400'} font-medium`
                  : active
                    ? 'font-semibold'
                    : ''
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
