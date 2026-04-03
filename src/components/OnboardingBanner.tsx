import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const STEPS = [
  {
    num: 1,
    title: '이력서 작성',
    desc: '템플릿 선택 후 9개 섹션 편집',
    href: '/resumes/new',
    color: 'from-blue-500 to-blue-600',
  },
  {
    num: 2,
    title: 'AI 분석',
    desc: '피드백, JD매칭, ATS 검사',
    href: '/tutorial',
    color: 'from-indigo-500 to-indigo-600',
  },
  {
    num: 3,
    title: '공유/지원',
    desc: '링크 공유, PDF 내보내기',
    href: '/explore',
    color: 'from-purple-500 to-purple-600',
  },
];

export default function OnboardingBanner() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('onboarding-dismissed') === 'true');
  const [hiding, setHiding] = useState(false);
  const location = useLocation();

  if (dismissed) return null;

  const handleDismiss = () => {
    setHiding(true);
    setTimeout(() => {
      localStorage.setItem('onboarding-dismissed', 'true');
      setDismissed(true);
    }, 300);
  };

  const handleNeverShow = () => {
    localStorage.setItem('onboarding-dismissed', 'true');
    localStorage.setItem('onboarding-never-show', 'true');
    setDismissed(true);
  };

  // Determine active step based on current route
  const getStepStatus = (href: string) => {
    if (location.pathname.startsWith('/resumes/') && location.pathname.includes('/edit')) return href === '/resumes/new' ? 'active' : 'upcoming';
    return 'upcoming';
  };

  return (
    <div className={`mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden transition-all duration-300 ${hiding ? 'opacity-0 -translate-y-2' : 'animate-fade-in-up'}`}>
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-1/3 w-24 h-24 bg-white/5 rounded-full translate-y-1/2" />

      {/* Close + never-show buttons */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <button
          onClick={handleNeverShow}
          className="text-white/50 hover:text-white/80 text-xs transition-colors px-2 py-1 rounded hover:bg-white/10"
          title="다시 보지 않기"
        >
          다시 보지 않기
        </button>
        <button
          onClick={handleDismiss}
          className="text-white/60 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
          aria-label="닫기"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <h2 className="text-lg font-bold mb-1 relative z-10">시작하기 가이드</h2>
      <p className="text-blue-100 text-sm mb-5 relative z-10">3단계로 완벽한 이력서를 완성하세요</p>

      {/* Step progress bar */}
      <div className="hidden sm:flex items-center justify-center gap-0 mb-5 relative z-10">
        {STEPS.map((step, i) => (
          <div key={step.num} className="flex items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              getStepStatus(step.href) === 'active'
                ? 'bg-white text-blue-600'
                : 'bg-white/20 text-white'
            }`}>
              {step.num}
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-16 h-0.5 bg-white/20 mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* Step cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
        {STEPS.map((step, i) => (
          <Link
            key={step.num}
            to={step.href}
            className="group flex items-center gap-3 p-3.5 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-200 hover:-translate-y-0.5"
          >
            <span className={`shrink-0 w-9 h-9 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center text-sm font-bold shadow-sm`}>
              {step.num}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold flex items-center gap-1.5">
                {step.title}
                <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </p>
              <p className="text-xs text-blue-200 truncate">{step.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
