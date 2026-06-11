import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PolicyArticle } from '@/features/policies';
import { ROUTES } from '@/lib/routes';

export default function PrivacyPage() {
  useEffect(() => {
    document.title = '개인정보처리방침 — 이력서공방';
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, []);

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8"
        role="main"
      >
        <PolicyArticle slug="privacy-policy" title="개인정보처리방침" />
        <nav
          aria-label="관련 문서"
          className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800 text-sm"
        >
          <Link
            to={ROUTES.terms}
            className="text-sky-700 underline-offset-2 hover:underline dark:text-sky-400"
          >
            이용약관 →
          </Link>
        </nav>
      </main>
      <Footer />
    </>
  );
}
