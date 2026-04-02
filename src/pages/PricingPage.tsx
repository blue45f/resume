import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PLANS, formatPrice, type PlanConfig } from '@/lib/plans';
import { getUser } from '@/lib/auth';

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);
  const user = getUser();

  useEffect(() => {
    document.title = '요금제 — 이력서공방';
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);

  const FeatureRow = ({ label, free, pro, ent }: { label: string; free: string | boolean; pro: string | boolean; ent: string | boolean }) => (
    <tr className="border-b border-slate-100 dark:border-slate-700">
      <td className="py-3 text-sm text-slate-600 dark:text-slate-400">{label}</td>
      {[free, pro, ent].map((val, i) => (
        <td key={i} className="py-3 text-center text-sm">
          {typeof val === 'boolean' ? (
            val ? <span className="text-green-500">✓</span> : <span className="text-slate-300 dark:text-slate-600">—</span>
          ) : (
            <span className="text-slate-700 dark:text-slate-300">{val}</span>
          )}
        </td>
      ))}
    </tr>
  );

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1" role="main">
        {/* Hero */}
        <div className="text-center py-12 sm:py-16 px-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 mb-3">요금제</h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto mb-6">무료로 시작하고, 필요할 때 업그레이드하세요</p>

          {/* Yearly toggle */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <span className={`text-sm ${!yearly ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-500'}`}>월간</span>
            <button
              onClick={() => setYearly(!yearly)}
              className={`relative w-12 h-6 rounded-full transition-colors ${yearly ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${yearly ? 'left-7' : 'left-1'}`} />
            </button>
            <span className={`text-sm ${yearly ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-500'}`}>
              연간 <span className="text-green-600 text-xs font-medium">17% 할인</span>
            </span>
          </div>
        </div>

        {/* Plan cards */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 -mt-4">
          {PLANS.map(plan => (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-slate-800 rounded-2xl border-2 p-6 sm:p-8 transition-all duration-200 ${
                plan.popular
                  ? 'border-blue-500 shadow-lg shadow-blue-500/10 scale-[1.02]'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                  인기
                </span>
              )}
              <div className="text-center mb-6">
                <span className="text-2xl mb-2 block">{plan.badge}</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{plan.name}</h3>
                <div className="mt-3">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                    {formatPrice(yearly ? Math.round(plan.yearlyPrice / 12) : plan.price)}
                  </span>
                  {plan.price > 0 && <span className="text-slate-500 dark:text-slate-400 text-sm">/월</span>}
                </div>
                {yearly && plan.yearlyPrice > 0 && (
                  <p className="text-xs text-slate-400 mt-1">연 {formatPrice(plan.yearlyPrice)} (월 {formatPrice(Math.round(plan.yearlyPrice / 12))})</p>
                )}
              </div>

              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-green-500">✓</span>
                  이력서 {plan.features.maxResumes === -1 ? '무제한' : `${plan.features.maxResumes}개`}
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-green-500">✓</span>
                  AI 변환 {plan.features.aiTransformsPerMonth === -1 ? '무제한' : `월 ${plan.features.aiTransformsPerMonth}회`}
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-green-500">✓</span>
                  테마 {plan.features.themes}종
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className={plan.features.aiCoaching ? 'text-green-500' : 'text-slate-300'}>
                    {plan.features.aiCoaching ? '✓' : '✗'}
                  </span>
                  AI 코칭 & 자소서
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className={plan.features.translation ? 'text-green-500' : 'text-slate-300'}>
                    {plan.features.translation ? '✓' : '✗'}
                  </span>
                  다국어 번역
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className={plan.features.prioritySupport ? 'text-green-500' : 'text-slate-300'}>
                    {plan.features.prioritySupport ? '✓' : '✗'}
                  </span>
                  우선 지원
                </li>
              </ul>

              <Link
                to={plan.id === 'free' ? '/resumes/new' : '/settings'}
                className={`block w-full py-3 text-center text-sm font-medium rounded-xl transition-all duration-200 ${
                  plan.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {plan.id === 'free' ? '무료로 시작' : '업그레이드'}
              </Link>
            </div>
          ))}
        </div>

        {/* Feature comparison table */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 text-center mb-8">상세 비교</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 text-sm font-medium text-slate-500">기능</th>
                  <th className="text-center py-3 text-sm font-medium text-slate-500">무료</th>
                  <th className="text-center py-3 text-sm font-medium text-blue-600">프로</th>
                  <th className="text-center py-3 text-sm font-medium text-slate-500">엔터프라이즈</th>
                </tr>
              </thead>
              <tbody>
                <FeatureRow label="이력서 수" free="3개" pro="무제한" ent="무제한" />
                <FeatureRow label="AI 변환" free="월 5회" pro="무제한" ent="무제한" />
                <FeatureRow label="테마" free="3종" pro="10종" ent="10종" />
                <FeatureRow label="내보내기" free="TXT" pro="TXT, MD" ent="TXT, MD" />
                <FeatureRow label="ATS 검사" free={true} pro={true} ent={true} />
                <FeatureRow label="AI 코칭" free={false} pro={true} ent={true} />
                <FeatureRow label="자소서 생성" free={false} pro={true} ent={true} />
                <FeatureRow label="다국어 번역" free={false} pro={true} ent={true} />
                <FeatureRow label="지원 관리" free={true} pro={true} ent={true} />
                <FeatureRow label="우선 지원" free={false} pro={true} ent={true} />
                <FeatureRow label="팀 멤버" free="1명" pro="1명" ent="10명" />
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
