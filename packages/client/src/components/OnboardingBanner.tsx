import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { API_URL } from '@/lib/config';
import { tx } from '@/lib/i18n';

interface Step {
  num: number;
  title: string;
  desc: string;
  href: string;
  color: string;
}

const DEFAULT_STEPS: Step[] = [
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
    color: 'from-sky-500 to-sky-700',
  },
  {
    num: 3,
    title: '공유/지원',
    desc: '링크 공유, PDF 내보내기',
    href: '/explore',
    color: 'from-sky-500 to-sky-700',
  },
];

export default function OnboardingBanner() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('onboarding-dismissed') === 'true',
  );
  const [hiding, setHiding] = useState(false);
  const [steps, setSteps] = useState<Step[]>(DEFAULT_STEPS);
  const [title, setTitle] = useState(tx('onboarding.welcome'));
  const [subtitle, setSubtitle] = useState('3단계로 완벽한 이력서를 완성하세요');
  const location = useLocation();

  useEffect(() => {
    if (dismissed) return;
    fetch(`${API_URL}/api/system-config/content/onboarding`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.steps?.length) setSteps(d.steps);
        if (d?.title) setTitle(d.title);
        if (d?.subtitle) setSubtitle(d.subtitle);
      })
      .catch(() => {});
  }, [dismissed]);

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

  const getStepStatus = (href: string) => {
    if (location.pathname.startsWith('/resumes/') && location.pathname.includes('/edit'))
      return href === '/resumes/new' ? 'active' : 'upcoming';
    return 'upcoming';
  };

  return (
    <div
      className={`mb-6 bg-sky-900 rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden transition-all duration-300 ${hiding ? 'opacity-0 -translate-y-2' : 'animate-fade-in-up'}`}
    >
      {/* refined dot grid — single purposeful texture, no gradient blob decor */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-15"
        style={{
          backgroundImage: 'radial-gradient(circle, rgb(255 255 255 / 0.6) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />

      <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
        <button
          onClick={handleNeverShow}
          className="text-sky-200 hover:text-white text-xs transition-colors px-2 py-1 rounded hover:bg-sky-800"
          title="다시 보지 않기"
        >
          다시 보지 않기
        </button>
        <button
          onClick={handleDismiss}
          className="text-sky-200 hover:text-white transition-colors p-1 rounded hover:bg-sky-800"
          aria-label="닫기"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300 mb-2 relative z-10">
        시작하기
      </div>
      <h2 className="text-xl font-black mb-1.5 relative z-10 tracking-tight">{title}</h2>
      <p className="text-sky-200 text-sm mb-5 relative z-10">{subtitle}</p>

      <div className="hidden sm:flex items-center justify-center gap-0 mb-5 relative z-10">
        {steps.map((step, i) => (
          <div key={step.num} className="flex items-center">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                getStepStatus(step.href) === 'active'
                  ? 'bg-white text-sky-900'
                  : 'border border-sky-300 text-sky-100'
              }`}
            >
              {step.num}
            </div>
            {i < steps.length - 1 && <div className="w-16 h-px bg-sky-300/40 mx-1" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
        {steps.map((step) => (
          <Link
            key={step.num}
            to={step.href}
            className="group flex items-center gap-3 p-3.5 bg-sky-800/60 hover:bg-sky-700 border border-sky-700 hover:border-sky-500 rounded-xl transition-colors duration-200"
          >
            <span className="shrink-0 w-9 h-9 bg-white text-sky-900 rounded-full flex items-center justify-center text-sm font-black tabular-nums">
              {step.num}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold flex items-center gap-2">
                {step.title}
                <svg
                  className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </p>
              <p className="text-xs text-sky-200 truncate">{step.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
