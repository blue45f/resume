import { useState, useEffect, useRef } from 'react';
import { API_URL } from '@/lib/config';

interface Announcement {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'promo';
  link?: string;
  linkText?: string;
  autoDismissMs?: number; // 자동 닫기 ms (기본 8000)
}

const TYPE_STYLES: Record<string, string> = {
  info: 'bg-blue-600 text-white',
  warning: 'bg-amber-500 text-white',
  success: 'bg-emerald-600 text-white',
  promo: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white',
};

const TYPE_ICONS: Record<string, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  success: '✅',
  promo: '🎉',
};

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const stored = localStorage.getItem('admin-announcement');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.message && localStorage.getItem('announcement-dismissed') !== data.id) {
          setAnnouncement(data);
          return;
        }
      } catch {}
    }

    fetch(`${API_URL}/api/health/announcement`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.message && localStorage.getItem('announcement-dismissed') !== data.id) {
          setAnnouncement(data);
        }
      })
      .catch(() => {});
  }, []);

  // Auto-dismiss timer with progress bar
  useEffect(() => {
    if (!announcement || dismissed) return;
    const duration = announcement.autoDismissMs ?? 8000;
    startTimeRef.current = Date.now();
    const interval = 50;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (elapsed >= duration) {
        clearInterval(timerRef.current!);
        setDismissed(true);
      }
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [announcement, dismissed]);

  // Pause on hover
  const pauseTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const resumeTimer = () => {
    if (!announcement || dismissed) return;
    const duration = announcement.autoDismissMs ?? 8000;
    const remaining = (progress / 100) * duration;
    startTimeRef.current = Date.now() - (duration - remaining);

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const rem = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(rem);
      if (elapsed >= duration) {
        clearInterval(timerRef.current!);
        setDismissed(true);
      }
    }, 50);
  };

  if (!announcement || dismissed) return null;

  const handleDismiss = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setDismissed(true);
    localStorage.setItem('announcement-dismissed', announcement.id || 'dismissed');
  };

  const typeStyle = TYPE_STYLES[announcement.type] || TYPE_STYLES.info;
  const typeIcon = TYPE_ICONS[announcement.type] || '';

  return (
    <div
      className={`${typeStyle} text-sm no-print relative overflow-hidden`}
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
    >
      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 h-0.5 bg-white/40 transition-none"
        style={{ width: `${progress}%` }}
      />

      <div className="max-w-6xl mx-auto pl-4 pr-10 py-2.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        {typeIcon && (
          <span className="shrink-0 text-base" aria-hidden="true">
            {typeIcon}
          </span>
        )}
        <span className="text-center leading-snug text-xs sm:text-sm">{announcement.message}</span>
        {announcement.link && (
          <a
            href={announcement.link}
            className="shrink-0 underline font-semibold hover:opacity-80 transition-opacity whitespace-nowrap text-xs sm:text-sm"
          >
            {announcement.linkText || '자세히 보기'}
          </a>
        )}
      </div>
      <button
        onClick={handleDismiss}
        className="absolute right-1 top-1/2 -translate-y-1/2 p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        aria-label="공지 닫기"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
