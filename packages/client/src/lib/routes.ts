/**
 * 중앙 집중 라우트 상수 — 타입 안전 + 리팩토링 용이.
 *
 * 사용법:
 *   import { ROUTES } from '@/lib/routes';
 *   <Link to={ROUTES.resume.edit('abc-123')}>편집</Link>
 *
 * 규칙:
 *   - 정적 경로: string 상수
 *   - 동적 경로: (...args) => string 함수
 *   - 쿼리 파라미터: 별도 헬퍼 (ex: withQuery)
 */

// ─── 공통 ────────────────────────────────────────
export const ROUTES = {
  home: '/',
  about: '/about',
  tutorial: '/tutorial',
  terms: '/terms',
  privacy: '/terms#privacy',
  sitemap: '/sitemap',
  pricing: '/pricing',
  help: '/help',
  feedback: '/feedback',
  stats: '/stats',

  // ─── 인증 ────────────────────────────────────
  login: '/login',
  register: '/login?tab=register',
  authCallback: '/auth/callback',
  forgotPassword: '/forgot-password',

  // ─── 이력서 ──────────────────────────────────
  resume: {
    list: '/',
    new: '/resumes/new',
    edit: (id: string) => `/resumes/${id}/edit`,
    preview: (id: string) => `/resumes/${id}/preview`,
    review: (id: string) => `/resumes/${id}/review`,
    profile: (username: string, slug?: string) =>
      slug ? `/@${username}/${slug}` : `/@${username}`,
    short: (code: string) => `/r/${code}`,
    autoGenerate: '/auto-generate',
    compare: '/compare',
    translate: '/translate',
    templates: '/templates',
    tags: '/tags',
    explore: '/explore',
    bookmarks: '/bookmarks',
  },

  // ─── 자기소개서 ──────────────────────────────
  coverLetter: {
    list: '/my-cover-letters',
    new: (resumeId?: string) => (resumeId ? `/cover-letter?resumeId=${resumeId}` : '/cover-letter'),
    detail: (id: string) => `/cover-letter/${id}`,
  },

  // ─── 채용 ────────────────────────────────────
  jobs: {
    list: '/jobs',
    detail: (id: string) => `/jobs/${id}`,
    new: '/jobs/new',
    edit: (id: string) => `/jobs/${id}/edit`,
    applications: '/applications',
    scouts: '/scouts',
  },

  // ─── 커뮤니티 ────────────────────────────────
  community: {
    list: '/community',
    category: (cat: string) => `/community?category=${cat}`,
    notice: '/community?category=notice',
    interview: '/community?category=interview',
    tips: '/community?category=tips',
    free: '/community?category=free',
    resume: '/community?category=resume',
    write: '/community/write',
    post: (id: string) => `/community/${id}`,
  },

  // ─── 면접 ────────────────────────────────────
  interview: {
    prep: '/interview-prep',
    mock: (params?: { jobPostId?: string; question?: string }) => {
      if (!params) return '/mock-interview';
      const sp = new URLSearchParams();
      if (params.jobPostId) sp.set('jobPostId', params.jobPostId);
      if (params.question) sp.set('question', params.question);
      const q = sp.toString();
      return q ? `/mock-interview?${q}` : '/mock-interview';
    },
    studyGroups: '/study-groups',
    studyGroup: (id: string) => `/study-groups/${id}`,
    newStudyGroup: '/study-groups/new',
  },

  // ─── 코치·코칭 ───────────────────────────────
  coaching: {
    coaches: '/coaches',
    coach: (id: string) => `/coaches/${id}`,
    sessions: '/coaching/sessions',
    dashboard: '/coach/dashboard',
    profileEdit: '/coach/profile',
  },

  // ─── 소셜 ────────────────────────────────────
  social: {
    follows: '/social/follows',
    followers: '/social/follows?tab=followers',
    following: '/social/follows?tab=following',
    messages: '/messages',
    conversation: (otherUserId: string) => `/messages?to=${otherUserId}`,
  },

  // ─── 프로필/알림/설정 ──────────────────────────
  profile: {
    me: '/settings',
    user: (username: string) => `/@${username}`,
    resumes: (username: string) => `/@${username}/resumes`,
    portfolio: (username: string) => `/@${username}/portfolio`,
  },
  notifications: '/notifications',
  settings: '/settings',

  // ─── 리쿠르터·기업 ────────────────────────────
  recruiter: {
    dashboard: '/recruiter',
    scouts: '/scouts',
    pipeline: '/recruiter?tab=pipeline',
  },
  company: {
    view: (id: string) => `/company/${id}`,
    edit: '/company/edit',
  },

  // ─── 결제 ────────────────────────────────────
  payment: {
    checkout: (plan: string) => `/payment?plan=${plan}`,
    result: '/payment/result',
  },

  // ─── 관리자 ──────────────────────────────────
  admin: {
    root: '/admin',
    users: '/admin?tab=users',
    reports: '/admin?tab=reports',
    banners: '/admin?tab=banners',
    notices: '/admin?tab=notices',
    forbidden: '/admin?tab=forbidden-words',
    permissions: '/admin?tab=permissions',
    systemConfig: '/admin?tab=system-config',
  },
} as const;

/**
 * 쿼리 파라미터 덧붙이기 헬퍼.
 * @example withQuery(ROUTES.community.list, { sort: 'recent' })
 */
export function withQuery(
  base: string,
  query: Record<string, string | number | boolean | undefined>,
): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  const q = sp.toString();
  if (!q) return base;
  return base.includes('?') ? `${base}&${q}` : `${base}?${q}`;
}

/**
 * 현재 경로가 어느 섹션에 속하는지 판별.
 * 네비게이션 active 상태에 사용.
 */
export function isActive(pathname: string, route: string): boolean {
  const clean = route.split('?')[0];
  if (clean === '/') return pathname === '/';
  return pathname === clean || pathname.startsWith(`${clean}/`);
}
