import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useRecentViews } from '@/features/recent-views/model/useRecentViews';
import { ROUTES } from '@/lib/routes';

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
      <main className="flex-1 flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <div className="text-center animate-fade-in max-w-md">
          <div className="relative inline-block mb-6">
            <div className="text-[10rem] font-black leading-none bg-gradient-to-br from-blue-200 via-indigo-200 to-purple-200 dark:from-blue-800 dark:via-indigo-800 dark:to-purple-800 bg-clip-text text-transparent select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-20 h-20 text-blue-400/60 dark:text-blue-500/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
            페이지를 찾을 수 없습니다
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            요청하신 페이지가 존재하지 않거나 이동되었습니다.
            <br className="hidden sm:block" />
            주소를 확인하거나 아래 링크를 이용해 주세요.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to={ROUTES.home}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md shadow-blue-500/20"
            >
              홈으로
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
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">최근 본 이력서</p>
              <div className="flex flex-wrap justify-center gap-2">
                {recentViews.slice(0, 4).map((v) => (
                  <Link
                    key={v.id}
                    to={ROUTES.resume.preview(v.id)}
                    className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-300 transition-colors"
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
