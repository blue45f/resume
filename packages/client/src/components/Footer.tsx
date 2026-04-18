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
          {/* Brand */}
          <Link to={ROUTES.home} className="inline-flex items-center gap-2 group">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-md flex items-center justify-center">
              <svg
                className="w-3 h-3 text-white"
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
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {tx('footer.brandName')}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              © {new Date().getFullYear()}
            </span>
          </Link>

          {/* Essential links only — 나머지는 GNB/More에 집중 */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
            <Link
              to={ROUTES.terms}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {tx('footer.terms')}
            </Link>
            <Link
              to={ROUTES.privacy}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {tx('footer.privacy')}
            </Link>
            <Link
              to={ROUTES.feedback}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {tx('footer.feedback')}
            </Link>
            <a
              href="https://github.com/blue45f/resume"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
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
        <div className="mt-3 pt-3 sm:hidden text-center text-[10px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800">
          {tx('footer.copyright')}
        </div>
      </div>
    </footer>
  );
}
