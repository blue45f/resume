import { useEffect } from 'react'
import { Link } from 'react-router-dom'

import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { PolicyArticle } from '@/domains/policies/policies'
import { ROUTES } from '@/lib/routes'

export default function TermsPage() {
  useEffect(() => {
    document.title = '이용약관 — 이력서공방'
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'
    }
  }, [])

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8"
        role="main"
      >
        <PolicyArticle slug="terms-of-service" title="이용약관" />
        <nav
          aria-label="관련 문서"
          className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800 text-sm"
        >
          <Link
            to={ROUTES.privacy}
            className="text-sky-700 underline-offset-2 hover:underline dark:text-sky-400"
          >
            개인정보처리방침 →
          </Link>
        </nav>
      </main>
      <Footer />
    </>
  )
}
