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
    <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500">
      <span><strong className="text-slate-500 dark:text-slate-400">{stats.users}</strong> 회원</span>
      <span><strong className="text-slate-500 dark:text-slate-400">{stats.resumes}</strong> 이력서</span>
      <span><strong className="text-slate-500 dark:text-slate-400">{stats.views.toLocaleString()}</strong> 조회</span>
    </div>
  );
}

const FOOTER_SECTIONS = [
  { title: '이력서', links: [
    { to: '/resumes/new', label: '새 이력서' }, { to: '/auto-generate', label: 'AI 생성' },
    { to: '/templates', label: '템플릿' }, { to: '/explore', label: '탐색' },
  ]},
  { title: 'AI 도구', links: [
    { to: '/cover-letter', label: '자소서' }, { to: '/compare', label: '비교' },
    { to: '/interview-prep', label: '면접 준비' }, { to: '/jobs', label: '채용 공고' },
  ]},
  { title: '커뮤니티', links: [
    { to: '/community', label: '게시판' }, { to: '/community?category=tips', label: '취업팁' },
    { to: '/community?category=resume', label: '이력서피드백' }, { to: '/notices', label: '공지사항' },
  ]},
  { title: '정보', links: [
    { to: '/about', label: '소개' }, { to: '/tutorial', label: '가이드' },
    { to: '/pricing', label: '요금제' }, { to: '/feedback', label: '피드백' },
    { to: '/terms', label: '약관' },
  ]},
  { title: '채용담당자', links: [
    { to: '/recruiter', label: '대시보드' }, { to: '/scouts', label: '스카우트' },
    { to: '/jobs/new', label: '공고 등록' }, { to: '/messages', label: '메시지' },
  ]},
];

function FooterSection({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      {/* 모바일: 아코디언 / 데스크톱: 항상 열림 */}
      <button
        onClick={() => setOpen(!open)}
        className="sm:hidden w-full flex items-center justify-between py-2 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider"
      >
        {title}
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      <h4 className="hidden sm:block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2.5">{title}</h4>
      <ul className={`space-y-1.5 ${open ? 'block' : 'hidden'} sm:block`}>
        {links.map(link => (
          <li key={link.to}>
            <Link to={link.to} className="text-[13px] text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="no-print mt-auto bg-gradient-to-b from-white to-slate-50/80 dark:from-slate-900 dark:to-slate-950">
      {/* Gradient divider */}
      <div className="footer-divider" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-6">
        {/* Top: 3-column grid — Brand / Links / Social+Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-8 mb-8">

          {/* Brand column */}
          <div className="sm:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-indigo-300/40 dark:group-hover:shadow-indigo-900/60 transition-shadow duration-300">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <span className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">이력서공방</span>
            </Link>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed mb-4 max-w-[180px]">
              AI로 완성하는 나만의 이력서 플랫폼
            </p>
            <SiteStats />
          </div>

          {/* Link Groups — 5 columns */}
          <div className="sm:col-span-7 grid grid-cols-2 sm:grid-cols-5 gap-1 sm:gap-3 divide-y sm:divide-y-0 divide-slate-100 dark:divide-slate-800">
            {FOOTER_SECTIONS.map(section => (
              <FooterSection key={section.title} title={section.title} links={section.links} />
            ))}
          </div>

          {/* Social + Actions column */}
          <div className="sm:col-span-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-3">소셜</h4>
            <div className="flex items-center gap-3 mb-5">
              <a
                href="https://github.com/blue45f/resume"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="footer-social-icon w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
              </a>
              <a
                href="/feedback"
                aria-label="피드백"
                className="footer-social-icon w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </a>
            </div>
            <Link
              to="/resumes/new"
              className="inline-flex items-center gap-1.5 px-3 py-2 btn-gradient text-xs font-medium rounded-lg btn-ripple animate-pulse-glow"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              이력서 만들기
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-divider mb-4" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 dark:text-slate-500">
          <span>{t('footer.copyright')}</span>
          <div className="flex items-center gap-3">
            <Link to="/sitemap" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">사이트맵</Link>
            <Link to="/terms" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">이용약관</Link>
            <Link to="/about" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">소개</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
