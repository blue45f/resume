import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';

export default function PaymentResultPage() {
  const [params] = useSearchParams();
  const success = !params.has('fail');

  useEffect(() => {
    document.title = success ? '결제 완료 — 이력서공방' : '결제 실패 — 이력서공방';
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="text-center animate-fade-in max-w-md">
          {success ? (
            <>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">결제 완료!</h1>
              <p className="text-slate-500 dark:text-slate-400 mb-6">프로 플랜이 활성화되었습니다. 모든 기능을 자유롭게 사용하세요.</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">결제 실패</h1>
              <p className="text-slate-500 dark:text-slate-400 mb-6">결제 처리 중 문제가 발생했습니다. 다시 시도해주세요.</p>
            </>
          )}
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/" className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">
              홈으로
            </Link>
            {!success && (
              <Link to="/pricing" className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors">
                다시 시도
              </Link>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
