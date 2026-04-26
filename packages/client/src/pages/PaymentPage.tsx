import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { toast } from '@/components/Toast';
import { getUser } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';
import { PLANS, formatPrice } from '@/lib/plans';
import { PAYMENT_METHODS, requestPayment } from '@/lib/payment';
import { tx } from '@/lib/i18n';

export default function PaymentPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const user = getUser();
  const planId = params.get('plan') || 'standard';
  const period = (params.get('period') as 'monthly' | 'yearly') || 'monthly';
  const plan = PLANS.find((p) => p.id === planId) || PLANS[1];
  const amount = period === 'yearly' ? plan.yearlyPrice : plan.price;
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    document.title = '결제 — 이력서공방';
    if (!user) navigate(ROUTES.login);
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, []);

  const handlePayment = async () => {
    if (!user || !agreed) return;
    setProcessing(true);
    try {
      await requestPayment({
        planId: plan.id,
        planName: plan.name,
        amount,
        period,
        customerEmail: user.email,
        customerName: user.name,
      });
    } catch (e: any) {
      if (e.code === 'USER_CANCEL') {
        toast('결제가 취소되었습니다', 'info');
      } else {
        toast(e.message || '결제에 실패했습니다', 'error');
      }
    } finally {
      setProcessing(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8"
        role="main"
      >
        <Link
          to={ROUTES.pricing}
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 mb-4 inline-block"
        >
          &larr; 요금제로 돌아가기
        </Link>

        <div className="flex items-center gap-2 mb-3">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {tx('payment.title')}
          </h1>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            🧪 BETA
          </span>
        </div>
        <div className="mb-6 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-900/10">
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            <strong>베타 기간 안내</strong> — 결제 연동은 준비 중으로, 현재는 모든 기능을 무료로
            이용할 수 있습니다. 결제가 정식 활성화되면 이메일로 사전 공지됩니다.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Order Summary */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              주문 요약
            </h2>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{plan.badge}</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {plan.name} 플랜
                </span>
              </div>
              <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                {period === 'yearly' ? '연간' : '월간'}
              </span>
            </div>
            {period === 'yearly' && (
              <p className="text-xs text-green-600 dark:text-green-400 mb-2">
                연간 결제 17% 할인 적용
              </p>
            )}
            <div className="border-t border-slate-100 dark:border-slate-700 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">결제 금액</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatPrice(amount)}
                </span>
              </div>
              {period === 'yearly' && (
                <p className="text-xs text-slate-400 text-right mt-0.5">
                  월 {formatPrice(Math.round(amount / 12))}
                </p>
              )}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              결제 수단
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMethod(m.id)}
                  className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                    selectedMethod === m.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="text-lg block mb-1">{m.icon}</span>
                  <span className="text-xs text-slate-700 dark:text-slate-300">{m.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Agreement + Pay */}
          <div>
            <label className="flex items-start gap-2 mb-4">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                결제 진행 시{' '}
                <Link to={ROUTES.terms} className="text-blue-600 underline">
                  이용약관
                </Link>{' '}
                및 자동 갱신에 동의합니다. 구독은 언제든 설정에서 취소할 수 있습니다.
              </span>
            </label>

            <button
              onClick={handlePayment}
              disabled={processing || !agreed}
              className="w-full py-3.5 bg-sky-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30"
            >
              {processing ? '결제 처리 중...' : `${formatPrice(amount)} 결제하기`}
            </button>

            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                SSL 보안 결제
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                언제든 취소
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                7일 무료 체험
              </span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
