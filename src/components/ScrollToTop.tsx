import { useState, useEffect, useCallback } from 'react';

export default function ScrollToTop() {
  const [show, setShow] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleScroll = useCallback(() => {
    setShow(window.scrollY > 400);

    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight > 0) {
      setProgress(Math.min((window.scrollY / scrollHeight) * 100, 100));
    } else {
      setProgress(0);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <>
      {/* Scroll progress bar */}
      {progress > 0 && (
        <div
          className="scroll-progress no-print"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="페이지 스크롤 진행률"
        />
      )}

      {/* Scroll to top button */}
      {show && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 w-10 h-10 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center no-print animate-fade-in"
          aria-label="맨 위로 스크롤"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
    </>
  );
}
