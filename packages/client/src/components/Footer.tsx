import { Link } from 'react-router-dom';
import { tx } from '@/lib/i18n';
import { ROUTES } from '@/lib/routes';

/**
 * 심플 Footer — 메뉴는 GNB로 집중, Footer는 법률·회사 정보만.
 */
export default function Footer() {
  return (
    <footer
      className="no-print mt-auto"
      style={{
        borderTop: '1px solid var(--color-border-subtle)',
        background: 'var(--color-surface)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Brand — Header 와 같은 wordmark + serial mark 패턴 */}
          <Link to={ROUTES.home} className="inline-flex items-baseline gap-2 group select-none">
            <span
              aria-hidden="true"
              className="inline-block w-2.5 h-[2px] bg-sky-700 dark:bg-sky-400 transition-[width] duration-300 ease-out group-hover:w-4"
            />
            <span className="text-xs font-bold tracking-[-0.02em] text-slate-700 dark:text-slate-200 leading-none">
              {tx('footer.brandName')}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
              © {new Date().getFullYear()}
            </span>
          </Link>

          {/* Essential links only — link-underline-reveal 으로 hover 시 좌→우 underline */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
            <Link to={ROUTES.terms} className="link-underline-reveal transition-colors">
              {tx('footer.terms')}
            </Link>
            <Link to={ROUTES.privacy} className="link-underline-reveal transition-colors">
              {tx('footer.privacy')}
            </Link>
            <Link to={ROUTES.feedback} className="link-underline-reveal transition-colors">
              {tx('footer.feedback')}
            </Link>
            <a
              href="https://github.com/blue45f/resume"
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline-reveal transition-colors"
            >
              {tx('footer.github')}
            </a>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">·</span>
            <span className="text-slate-400 dark:text-slate-500">
              {tx('footer.pipaCompliance')}
            </span>
          </div>
        </div>

        {/* Copyright line (mobile visible) */}
        <div className="mt-3 pt-3 sm:hidden text-center text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
          {tx('footer.copyright')}
        </div>
      </div>
    </footer>
  );
}
