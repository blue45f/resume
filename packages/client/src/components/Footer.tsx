import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { t } from '@/lib/i18n';
import { API_URL } from '@/lib/config';

function SiteStats() {
  const [stats, setStats] = useState<{ users: number; resumes: number; views: number } | null>(
    null,
  );
  useEffect(() => {
    fetch(`${API_URL}/api/health/stats`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d)
          setStats({
            users: d.users.total,
            resumes: d.resumes.total,
            views: d.activity.totalViews,
          });
      })
      .catch(() => {});
  }, []);
  if (!stats) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 dark:text-slate-500">
      <span>
        <strong className="text-slate-500 dark:text-slate-400">
          {stats.users.toLocaleString()}
        </strong>{' '}
        회원
      </span>
      <span>
        <strong className="text-slate-500 dark:text-slate-400">
          {stats.resumes.toLocaleString()}
        </strong>{' '}
        이력서
      </span>
      <span>
        <strong className="text-slate-500 dark:text-slate-400">
          {stats.views.toLocaleString()}
        </strong>{' '}
        조회
      </span>
    </div>
  );
}

type FooterLink = { to?: string; href?: string; label: string; external?: boolean };

const SERVICE_LINKS: FooterLink[] = [
  { to: '/explore', label: '이력서 탐색' },
  { to: '/jobs', label: '채용 공고' },
  { to: '/community', label: '커뮤니티' },
  { to: '/study-groups', label: '스터디 카페' },
  { to: '/coaches', label: '코치 찾기' },
  { to: '/interview-prep', label: '면접 준비' },
];

const TOOL_LINKS: FooterLink[] = [
  { to: '/resumes/new', label: '새 이력서 작성' },
  { to: '/templates', label: '템플릿' },
  { to: '/mock-interview', label: '모의 면접' },
  { to: '/translate', label: '이력서 번역' },
  { to: '/compare', label: '이력서 비교' },
];

const COMPANY_LINKS: FooterLink[] = [
  { to: '/about', label: '서비스 소개' },
  { to: '/tutorial', label: '튜토리얼' },
  { to: '/pricing', label: '요금제' },
  { to: '/stats', label: '통계' },
  { to: '/help', label: '도움말' },
];

const POLICY_LINKS: FooterLink[] = [
  { to: '/terms', label: '이용약관' },
  { to: '/terms#privacy', label: '개인정보처리방침' },
  { to: '/community?category=notice', label: '공지사항' },
  { to: '/feedback', label: '피드백/문의' },
  { to: '/sitemap', label: '사이트맵' },
  {
    href: 'https://github.com/blue45f/resume',
    label: 'GitHub',
    external: true,
  },
];

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
        {title}
      </h3>
      <ul className="space-y-2">
        {links.map((link) =>
          link.external ? (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {link.label}
              </a>
            </li>
          ) : (
            <li key={link.to}>
              <Link
                to={link.to!}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer
      className="no-print mt-auto"
      style={{
        borderTop: '1px solid var(--color-border-subtle)',
        background: 'var(--color-surface)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        {/* Columns */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          {/* Brand column spans wider on desktop */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2 group mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center shadow-sm">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-white">이력서공방</span>
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
              AI 기반 한국형 이력서·커리어 플랫폼
            </p>
            <SiteStats />
          </div>

          <FooterColumn title="서비스" links={SERVICE_LINKS} />
          <FooterColumn title="도구" links={TOOL_LINKS} />
          <FooterColumn title="회사" links={COMPANY_LINKS} />
          <FooterColumn title="정책·지원" links={POLICY_LINKS} />
        </div>

        {/* Copyright */}
        <div
          className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 border-t text-[11px] text-slate-400 dark:text-slate-500"
          style={{ borderColor: 'var(--color-border-subtle)' }}
        >
          <span>{t('footer.copyright')}</span>
          <span className="flex items-center gap-3">
            <span>🇰🇷 한국어 우선 지원</span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">·</span>
            <span>PIPA 준수</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
