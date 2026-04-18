import { useState, useEffect } from 'react';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white text-center py-2 px-4 text-sm font-medium shadow-md"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center justify-center gap-2">
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636a9 9 0 11-12.728 0M12 9v4m0 4h.01"
          />
        </svg>
        <span>인터넷 연결이 끊어졌습니다. 연결 상태를 확인해주세요.</span>
      </div>
    </div>
  );
}
