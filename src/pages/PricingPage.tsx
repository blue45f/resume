import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PLANS, RECRUITER_PLANS, formatPrice, type PlanConfig, getPlansForUserType } from '@/lib/plans';
import { getUser } from '@/lib/auth';

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);
  const _user = getUser();
  const [planType, setPlanType] = useState<'personal' | 'recruiter'>(
    _user?.userType === 'recruiter' || _user?.userType === 'company' ? 'recruiter' : 'personal'
  );
  const displayPlans = planType === 'recruiter' ? RECRUITER_PLANS : PLANS;

  useEffect(() => {
    document.title = '요금제 — 이력서공방';
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);

  const FeatureRow = ({ label, free, pro, ent }: { label: string; free: string | boolean; pro: string | boolean; ent: string | boolean }) => (
    <tr className="border-b border-slate-100 dark:border-slate-700">
      <td className="py-3 text-sm text-slate-600 dark:text-slate-400">{label}</td>
      {[free, pro, ent].map((val: string | boolean, i: number) => (
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

          {/* Plan type tabs */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <button
              onClick={() => setPlanType('personal')}
              className={`px-4 py-2 text-sm rounded-xl transition-colors ${planType === 'personal' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
            >
              👤 구직자
            </button>
            <button
              onClick={() => setPlanType('recruiter')}
              className={`px-4 py-2 text-sm rounded-xl transition-colors ${planType === 'recruiter' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
            >
              🏢 채용 담당자
            </button>
          </div>

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
          {displayPlans.map(plan => (
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

              {planType === 'recruiter' ? (
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="text-green-500">✓</span>
                    스카우트 {plan.features.scoutMessages === -1 ? '무제한' : `월 ${plan.features.scoutMessages}회`}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="text-green-500">✓</span>
                    채용 공고 {plan.features.jobPosts === -1 ? '무제한' : `${plan.features.jobPosts}개`}
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="text-green-500">✓</span>
                    인재 검색
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className={plan.features.prioritySupport ? 'text-green-500' : 'text-slate-300'}>
                      {plan.features.prioritySupport ? '✓' : '✗'}
                    </span>
                    우선 지원
                  </li>
                </ul>
              ) : (
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
              )}

              <Link
                to={plan.id === 'free' ? '/resumes/new' : `/payment?plan=${plan.id}&period=${yearly ? 'yearly' : 'monthly'}`}
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
        {planType === 'personal' && <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 text-center mb-8">상세 비교</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 text-sm font-medium text-slate-500">기능</th>
                  <th className="text-center py-3 text-sm font-medium text-slate-500">무료</th>
                  <th className="text-center py-3 text-sm font-medium text-blue-600">스탠다드</th>
                  <th className="text-center py-3 text-sm font-medium text-slate-500">프리미엄</th>
                </tr>
              </thead>
              <tbody>
                <FeatureRow label="이력서 수" free="3개" pro="10개" ent="무제한" />
                <FeatureRow label="AI 변환" free="월 5회" pro="월 30회" ent="무제한" />
                <FeatureRow label="테마" free="3종" pro="10종" ent="15종" />
                <FeatureRow label="내보내기" free="TXT" pro="TXT, MD" ent="TXT, MD, PDF" />
                <FeatureRow label="ATS 검사" free={true} pro={true} ent={true} />
                <FeatureRow label="AI 코칭" free={false} pro={true} ent={true} />
                <FeatureRow label="자소서 생성" free={false} pro={true} ent={true} />
                <FeatureRow label="다국어 번역" free={false} pro={false} ent={true} />
                <FeatureRow label="지원 관리" free={true} pro={true} ent={true} />
                <FeatureRow label="스카우트" free="—" pro="월 5회" ent="무제한" />
                <FeatureRow label="채용 공고" free="—" pro="3개" ent="무제한" />
                <FeatureRow label="우선 지원" free={false} pro={false} ent={true} />
              </tbody>
            </table>
          </div>
        </div>}
      </main>
      <Footer />
    </>
  );
}
