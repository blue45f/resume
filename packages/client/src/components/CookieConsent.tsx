import { useState } from 'react';

export default function CookieConsent() {
  const [accepted, setAccepted] = useState(() => localStorage.getItem('cookie-consent') === 'true');

  if (accepted) return null;

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'true');
    setAccepted(true);
  };

  return (
    <div className="fixed bottom-[72px] md:bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg animate-fade-in-up no-print">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
        <p className="text-sm text-slate-600 dark:text-slate-300 flex-1">
          이력서공방은 로그인 및 서비스 개선을 위해 쿠키를 사용합니다. 계속 사용하면{' '}
          <a href="/terms" className="text-blue-600 dark:text-blue-400 underline">
            이용약관
          </a>
          에 동의하는 것으로 간주합니다.
        </p>
        <button
          onClick={handleAccept}
          className="shrink-0 w-full sm:w-auto min-h-[44px] px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          동의합니다
        </button>
      </div>
    </div>
  );
}
