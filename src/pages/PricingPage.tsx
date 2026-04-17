import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PLANS, RECRUITER_PLANS, formatPrice, isMonetizationEnabled } from '@/lib/plans';
import { getUser } from '@/lib/auth';
import { API_URL } from '@/lib/config';

const DEFAULT_FAQ = [
  { q: '무료 플랜으로 어디까지 사용할 수 있나요?', a: '무료 플랜에서도 이력서 3개 작성, 월 5회 AI 변환, ATS 검사, 3종 테마를 모두 사용하실 수 있습니다. 비용 걱정 없이 핵심 기능을 모두 체험해보세요.' },
  { q: '결제 후 환불이 가능한가요?', a: '결제일로부터 7일 이내에 환불을 요청하시면 전액 환불해드립니다. 설정 > 구독 관리에서 직접 취소하거나, 고객 지원에 문의해주세요.' },
  { q: '플랜을 중간에 변경할 수 있나요?', a: '언제든 업그레이드 또는 다운그레이드가 가능합니다. 업그레이드 시 남은 기간은 일할 계산되어 차액만 결제됩니다.' },
  { q: '연간 결제와 월간 결제의 차이점은 무엇인가요?', a: '연간 결제 시 월간 대비 약 17% 할인된 가격으로 이용하실 수 있습니다. 장기 사용 계획이 있으시다면 연간 결제를 추천드립니다.' },
];

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);
  const _user = getUser();
  const currentPlan = _user?.plan || 'free';
  const [planType, setPlanType] = useState<'personal' | 'recruiter'>(
    _user?.userType === 'recruiter' || _user?.userType === 'company' ? 'recruiter' : 'personal'
  );
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const displayPlans = planType === 'recruiter' ? RECRUITER_PLANS : PLANS;

  useEffect(() => {
    document.title = '요금제 — 이력서공방';
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);

  const [faqItems, setFaqItems] = useState(DEFAULT_FAQ);
  useEffect(() => {
    fetch(`${API_URL}/api/system-config/content/pricing_faq`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.length) setFaqItems(d); })
      .catch(() => {});
  }, []);

  const FeatureRow = ({ label, free, pro, ent }: { label: string; free: string | boolean; pro: string | boolean; ent: string | boolean }) => (
    <tr className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
      <td className="py-3.5 text-sm text-slate-600 dark:text-slate-400 font-medium">{label}</td>
      {[free, pro, ent].map((val: string | boolean, i: number) => (
        <td key={i} className="py-3.5 text-center text-sm">
          {typeof val === 'boolean' ? (
            val ? (
              <span className="inline-flex items-center justify-center w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full">
                <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </span>
            ) : (
              <span className="text-slate-300 dark:text-slate-600">&mdash;</span>
            )
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
        {/* 유료화 OFF 배너 */}
        {!isMonetizationEnabled() && (
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-center py-3 px-4">
            <p className="text-sm font-medium">
              🎉 현재 베타 운영 기간으로 <strong>모든 기능을 무료</strong>로 제공하고 있습니다. 로그인 후 바로 사용해보세요!
            </p>
          </div>
        )}
        {/* Hero */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent" />
          <div className="relative text-center py-12 sm:py-16 px-4">
            {!isMonetizationEnabled() ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-medium mb-4">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                베타 기간 — 모든 기능 무료 제공 중
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-xs font-medium mb-4">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                합리적인 가격, 강력한 기능
              </div>
            )}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 mb-3">
              {isMonetizationEnabled()
                ? <>나에게 맞는 <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">요금제</span>를 선택하세요</>
                : <>지금은 <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">모든 기능이 무료</span>입니다</>
              }
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto mb-8">
              {isMonetizationEnabled()
                ? '무료로 시작하고, 필요할 때 업그레이드하세요. 언제든 취소 가능합니다.'
                : '베타 기간 동안 모든 기능을 제한 없이 이용하실 수 있습니다. 향후 유료 플랜으로 전환 시 사전 공지드립니다.'
              }
            </p>

            {/* Plan type tabs */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <button
                onClick={() => setPlanType('personal')}
                className={`px-4 py-2 text-sm rounded-xl transition-all duration-200 ${planType === 'personal' ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                구직자
              </button>
              <button
                onClick={() => setPlanType('recruiter')}
                className={`px-4 py-2 text-sm rounded-xl transition-all duration-200 ${planType === 'recruiter' ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                채용 담당자
              </button>
            </div>

            {/* Yearly toggle */}
            <div className="inline-flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2 shadow-sm">
              <span className={`text-sm transition-colors ${!yearly ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-400'}`}>월간</span>
              <button
                onClick={() => setYearly(!yearly)}
                className={`relative w-12 h-6 rounded-full transition-colors ${yearly ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                aria-label="연간 결제 전환"
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${yearly ? 'left-7' : 'left-1'}`} />
              </button>
              <span className={`text-sm transition-colors ${yearly ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-400'}`}>
                연간
              </span>
              {yearly && (
                <span className="ml-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full animate-fade-in">
                  17% 할인
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Plan cards */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 -mt-2">
          {displayPlans.map(plan => {
            const isCurrentPlan = plan.id === currentPlan;
            return (
              <div
                key={plan.id}
                className={`relative bg-white dark:bg-slate-800 rounded-2xl border-2 p-6 sm:p-8 transition-all duration-200 ${
                  plan.popular
                    ? 'border-blue-500 dark:border-blue-400 shadow-xl shadow-blue-500/15 sm:scale-[1.03] ring-1 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-full shadow-md shadow-blue-600/20">
                    가장 인기
                  </span>
                )}
                {isCurrentPlan && (
                  <span className="absolute -top-3 right-4 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-sm">
                    현재 플랜
                  </span>
                )}
                <div className="text-center mb-6">
                  <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-2 ${
                    plan.id === 'free' ? 'bg-slate-100 dark:bg-slate-700' : plan.popular ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                  }`}>
                    {plan.id === 'free' ? (
                      <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    ) : plan.popular ? (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                    ) : (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                    )}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{plan.name}</h3>
                  <div className="mt-3">
                    {yearly && plan.price > 0 && (
                      <span className="text-sm text-slate-400 line-through mr-2">{formatPrice(plan.price)}</span>
                    )}
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                      {formatPrice(yearly ? Math.round(plan.yearlyPrice / 12) : plan.price)}
                    </span>
                    {plan.price > 0 && <span className="text-slate-500 dark:text-slate-400 text-sm">/월</span>}
                  </div>
                  {yearly && plan.yearlyPrice > 0 && (
                    <p className="text-xs text-slate-400 mt-1">연 {formatPrice(plan.yearlyPrice)} 결제</p>
                  )}
                  {plan.price === 0 && (
                    <p className="text-xs text-slate-400 mt-1">영구 무료</p>
                  )}
                </div>

                {planType === 'recruiter' ? (
                  <ul className="space-y-2.5 mb-6">
                    <li className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                      <span className="shrink-0 w-4 h-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"><svg className="w-2.5 h-2.5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></span>
                      스카우트 {plan.features.scoutMessages === -1 ? '무제한' : `월 ${plan.features.scoutMessages}회`}
                    </li>
                    <li className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                      <span className="shrink-0 w-4 h-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"><svg className="w-2.5 h-2.5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></span>
                      채용 공고 {plan.features.jobPosts === -1 ? '무제한' : `${plan.features.jobPosts}개`}
                    </li>
                    <li className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                      <span className="shrink-0 w-4 h-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"><svg className="w-2.5 h-2.5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></span>
                      인재 검색
                    </li>
                    <li className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                      <span className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${plan.features.prioritySupport ? 'bg-green-100 dark:bg-green-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
                        {plan.features.prioritySupport
                          ? <svg className="w-2.5 h-2.5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          : <svg className="w-2.5 h-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        }
                      </span>
                      우선 지원
                    </li>
                  </ul>
                ) : (
                  <ul className="space-y-2.5 mb-6">
                    <li className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                      <span className="shrink-0 w-4 h-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"><svg className="w-2.5 h-2.5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></span>
                      이력서 {plan.features.maxResumes === -1 ? '무제한' : `${plan.features.maxResumes}개`}
                    </li>
                    <li className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                      <span className="shrink-0 w-4 h-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"><svg className="w-2.5 h-2.5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></span>
                      AI 변환 {plan.features.aiTransformsPerMonth === -1 ? '무제한' : `월 ${plan.features.aiTransformsPerMonth}회`}
                    </li>
                    <li className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                      <span className="shrink-0 w-4 h-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"><svg className="w-2.5 h-2.5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></span>
                      테마 {plan.features.themes}종
                    </li>
                    {[
                      { feat: plan.features.aiCoaching, label: 'AI 코칭 & 자소서' },
                      { feat: plan.features.translation, label: '다국어 번역' },
                      { feat: plan.features.prioritySupport, label: '우선 지원' },
                    ].map(item => (
                      <li key={item.label} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                        <span className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${item.feat ? 'bg-green-100 dark:bg-green-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
                          {item.feat
                            ? <svg className="w-2.5 h-2.5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            : <svg className="w-2.5 h-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          }
                        </span>
                        {item.label}
                      </li>
                    ))}
                  </ul>
                )}

                {isCurrentPlan ? (
                  <div className="block w-full py-3 text-center text-sm font-medium rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 cursor-default">
                    현재 사용 중
                  </div>
                ) : !isMonetizationEnabled() ? (
                  <Link
                    to="/resumes/new"
                    className={`block w-full py-3 text-center text-sm font-semibold rounded-xl transition-all duration-200 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5'
                        : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                    }`}
                  >
                    무료로 이용하기
                  </Link>
                ) : (
                  <Link
                    to={plan.id === 'free' ? '/resumes/new' : `/payment?plan=${plan.id}&period=${yearly ? 'yearly' : 'monthly'}`}
                    className={`block w-full py-3 text-center text-sm font-semibold rounded-xl transition-all duration-200 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {plan.id === 'free' ? '무료로 시작' : '업그레이드'}
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Feature comparison table */}
        {planType === 'personal' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 text-center mb-2">상세 기능 비교</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8">플랜별 제공 기능을 한눈에 비교해보세요</p>
            <div className="overflow-x-auto imp-card shadow-sm">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-4 px-4 text-sm font-semibold text-slate-500">기능</th>
                    <th className="text-center py-4 px-2 text-sm font-semibold text-slate-500">무료</th>
                    <th className="text-center py-4 px-2 text-sm font-bold text-blue-600 dark:text-blue-400">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                        스탠다드
                      </span>
                    </th>
                    <th className="text-center py-4 px-2 text-sm font-semibold text-slate-500">프리미엄</th>
                  </tr>
                </thead>
                <tbody className="divide-y-0">
                  <FeatureRow label="이력서 수" free="3개" pro="10개" ent="무제한" />
                  <FeatureRow label="AI 변환" free="월 5회" pro="월 30회" ent="무제한" />
                  <FeatureRow label="테마" free="3종" pro="10종" ent="15종" />
                  <FeatureRow label="내보내기" free="TXT" pro="TXT, MD" ent="TXT, MD, PDF" />
                  <FeatureRow label="ATS 검사" free={true} pro={true} ent={true} />
                  <FeatureRow label="AI 코칭" free={false} pro={true} ent={true} />
                  <FeatureRow label="자소서 생성" free={false} pro={true} ent={true} />
                  <FeatureRow label="다국어 번역" free={false} pro={false} ent={true} />
                  <FeatureRow label="지원 관리" free={true} pro={true} ent={true} />
                  <FeatureRow label="스카우트" free="&mdash;" pro="월 5회" ent="무제한" />
                  <FeatureRow label="채용 공고" free="&mdash;" pro="3개" ent="무제한" />
                  <FeatureRow label="우선 지원" free={false} pro={false} ent={true} />
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 text-center mb-2">자주 묻는 질문</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8">요금제에 대해 궁금한 점을 확인해보세요</p>
          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <div key={i} className="imp-card overflow-hidden transition-all duration-200">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                >
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.q}</span>
                  <svg
                    className={`w-5 h-5 shrink-0 text-slate-400 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 animate-fade-in">
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
