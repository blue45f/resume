import { Link } from 'react-router-dom'

import { tx } from '@/lib/i18n'
import { ROUTES } from '@/lib/routes'

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
            <Link to={ROUTES.about} className="link-underline-reveal transition-colors">
              소개
            </Link>
            <Link to={ROUTES.tutorial} className="link-underline-reveal transition-colors">
              가이드
            </Link>
            <Link to={ROUTES.sitemap} className="link-underline-reveal transition-colors">
              사이트맵
            </Link>
            <Link to={ROUTES.terms} className="link-underline-reveal transition-colors">
              {tx('footer.terms')}
            </Link>
            <Link to={ROUTES.privacy} className="link-underline-reveal transition-colors">
              {tx('footer.privacy')}
            </Link>
            <Link to={ROUTES.support} className="link-underline-reveal transition-colors">
              문의
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
            <Link
              to={ROUTES.design}
              className="link-underline-reveal text-slate-400 dark:text-slate-500 transition-colors"
            >
              디자인 시스템
            </Link>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">·</span>
            <span className="text-slate-400 dark:text-slate-500">
              {tx('footer.pipaCompliance')}
            </span>
          </div>
        </div>

        {/* Business Registration Details Grid */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="font-semibold text-slate-500 dark:text-slate-400">상호: 에이치준랩스</p>
              <p>대표자: 김희준 | 개인정보보호책임자: 김희준</p>
            </div>
            <div>
              <p>사업자등록번호: 355-07-03473</p>
              <p>주소: 서울특별시 송파구 가락로34길 13, 101호(방이동)</p>
            </div>
            <div>
              <p>이메일: blue45f@gmail.com</p>
              <p>전화번호: 010-3873-4197</p>
            </div>
            <div>
              <p>호스팅 서비스: GCP Cloud Run (API) + Vercel (Frontend)</p>
              <p>플랫폼 형태: AI 기반 이력서 공방 및 첨삭 서비스</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100/50 dark:border-slate-800/50 pt-3">
            <span>© {new Date().getFullYear()} 이력서공방. All rights reserved.</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              PIPA 준수 · SSL 보안 적용
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
