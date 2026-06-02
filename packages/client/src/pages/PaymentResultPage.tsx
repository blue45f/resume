import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import { ROUTES } from '@/lib/routes';
import { API_URL } from '@/lib/config';
import { formatDate } from '@/lib/time';

type VerifyState =
  | { phase: 'verifying' }
  | { phase: 'success'; planName?: string; currentPeriodEnd?: string }
  | { phase: 'failed'; reason?: string };

/**
 * P1-5 — 서버 verify 신뢰원에서 결제 성공/실패 판정.
 * URL 파라미터(`?fail=...`) 는 PG 콜백 hint 일 뿐 신뢰 X.
 * 마운트 시 GET /billing/me/verify-recent 호출 → 서버가 최근 10분 내 succeeded payment 확인.
 */
export default function PaymentResultPage() {
  const [params] = useSearchParams();
  const [state, setState] = useState<VerifyState>(() =>
    params.has('fail') ? { phase: 'failed', reason: 'pg_cancelled' } : { phase: 'verifying' },
  );

  useEffect(() => {
    document.title =
      state.phase === 'success'
        ? '결제 완료 — 이력서공방'
        : state.phase === 'failed'
          ? '결제 실패 — 이력서공방'
          : '결제 확인 중 — 이력서공방';
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, [state.phase]);

  useEffect(() => {
    if (state.phase !== 'verifying') return;
    const ctrl = new AbortController();
    const token = localStorage.getItem('token');
    if (!token) {
      setState({ phase: 'failed', reason: 'unauthenticated' });
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/billing/me/verify-recent`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: ctrl.signal,
        });
        if (!res.ok) {
          setState({ phase: 'failed', reason: `http_${res.status}` });
          return;
        }
        const data = await res.json();
        if (data.verified) {
          setState({
            phase: 'success',
            planName: data.planName,
            currentPeriodEnd: data.currentPeriodEnd,
          });
        } else {
          setState({ phase: 'failed', reason: data.reason || 'unknown' });
        }
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        setState({ phase: 'failed', reason: 'network' });
      }
    })();
    return () => ctrl.abort();
  }, [state.phase]);

  const planLabel = state.phase === 'success' ? state.planName || '프로' : '';
  const expiresLabel =
    state.phase === 'success' && state.currentPeriodEnd ? formatDate(state.currentPeriodEnd) : '';

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="text-center animate-fade-in max-w-md">
          {state.phase === 'verifying' && (
            <>
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  role="status"
                  aria-label="결제 확인 중"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v4m0 8v4m-8-8h4m8 0h4"
                  />
                </svg>
              </div>
              <h1 className="heading-accent text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                결제 확인 중…
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                결제 결과를 서버에서 확인하고 있습니다. 잠시만 기다려주세요.
              </p>
            </>
          )}
          {state.phase === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="heading-accent text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                결제 완료!
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                {planLabel} 플랜이 활성화되었습니다
                {expiresLabel && ` (만료: ${expiresLabel})`}. 모든 기능을 자유롭게 사용하세요.
              </p>
            </>
          )}
          {state.phase === 'failed' && (
            <>
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h1 className="heading-accent text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                결제 실패
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mb-2">
                결제가 확인되지 않았습니다. 다시 시도해주세요.
              </p>
              {state.reason && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-6 font-mono">
                  사유: {state.reason}
                </p>
              )}
            </>
          )}
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to={ROUTES.home}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              홈으로
            </Link>
            {state.phase === 'failed' && (
              <Link
                to={ROUTES.pricing}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors"
              >
                다시 시도
              </Link>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
