import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [accepted, setAccepted] = useState(() => localStorage.getItem('cookie-consent') === 'true');

  // 배너가 떠 있는 동안 body 하단에 여백을 확보한다. 고정 배너가 어느 페이지에서도
  // 콘텐츠/CTA(특히 모바일 폼 제출 버튼)를 가리지 않게 하는 전역 처리.
  useEffect(() => {
    if (accepted) return;
    document.body.classList.add('has-cookie-banner');
    return () => document.body.classList.remove('has-cookie-banner');
  }, [accepted]);

  if (accepted) return null;

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'true');
    setAccepted(true);
  };

  return (
    <div className="fixed bottom-[72px] md:bottom-0 left-0 right-0 z-50 px-4 py-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg animate-fade-in-up no-print">
      <div className="max-w-4xl mx-auto flex items-center gap-3">
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 flex-1 leading-snug">
          서비스 개선을 위해 쿠키를 사용합니다. 계속 사용하면{' '}
          <a href="/terms" className="text-blue-600 dark:text-blue-400 underline">
            이용약관
          </a>
          에 동의하는 것으로 간주합니다.
        </p>
        <button
          onClick={handleAccept}
          className="shrink-0 min-h-[44px] px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          동의
        </button>
      </div>
    </div>
  );
}
