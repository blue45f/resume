import { Link } from 'react-router-dom';
import Header from '@/components/Header';

export default function NotFoundPage() {
  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center animate-fade-in">
          <div className="text-8xl font-extrabold text-slate-200 dark:text-slate-700 mb-4">404</div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">페이지를 찾을 수 없습니다</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6">요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/" className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
              홈으로
            </Link>
            <Link to="/explore" className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              이력서 탐색
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
