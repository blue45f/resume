import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useRecentViews } from '@/features/recent-views/model/useRecentViews';
import { ROUTES } from '@/lib/routes';
import { tx } from '@/lib/i18n';

export default function NotFoundPage() {
  const { views: recentViews } = useRecentViews();
  useEffect(() => {
    document.title = '페이지를 찾을 수 없습니다 — 이력서공방';
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, []);

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
        {/* subtle dot grid — refined, not glassmorphic */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-25"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgb(148 163 184 / 0.35) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative text-center animate-fade-in max-w-md">
          <div className="relative inline-block mb-6">
            {/* outlined 404 — typographic intent, no AI-slop gradient */}
            <div
              className="text-[10rem] font-black leading-none select-none tracking-tighter text-sky-700 dark:text-sky-400"
              style={{
                WebkitTextStroke: '2px currentColor',
                color: 'transparent',
              }}
            >
              404
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
            {tx('notFound.title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            {tx('notFound.description')}
            <br className="hidden sm:block" />
            {tx('notFound.descriptionHint')}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to={ROUTES.home}
              className="px-6 py-2.5 bg-sky-700 hover:bg-sky-800 text-white text-sm font-medium rounded-xl transition-colors duration-200 shadow-sm"
            >
              {tx('notFound.goHome')}
            </Link>
            <Link
              to={ROUTES.resume.explore}
              className="px-6 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-600 shadow-sm"
            >
              이력서 탐색
            </Link>
          </div>
          {recentViews.length > 0 && (
            <div className="mt-8 max-w-md animate-fade-in">
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
                {tx('notFound.recentlyViewed')}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {recentViews.slice(0, 4).map((v) => (
                  <Link
                    key={v.id}
                    to={ROUTES.resume.preview(v.id)}
                    className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-sky-300 transition-colors"
                  >
                    {v.name || v.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
