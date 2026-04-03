import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/config';

interface Announcement {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'promo';
  link?: string;
  linkText?: string;
}

const TYPE_STYLES = {
  info: 'bg-blue-600 text-white',
  warning: 'bg-amber-500 text-white',
  success: 'bg-emerald-600 text-white',
  promo: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white',
};

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 관리자가 설정한 공지 배너 (localStorage fallback)
    const stored = localStorage.getItem('admin-announcement');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.message) {
          const dismissedId = localStorage.getItem('announcement-dismissed');
          if (dismissedId !== data.id) {
            setAnnouncement(data);
          }
        }
      } catch {}
    }

    // 서버에서 공지 가져오기 시도
    fetch(`${API_URL}/api/health/announcement`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.message) {
          const dismissedId = localStorage.getItem('announcement-dismissed');
          if (dismissedId !== data.id) {
            setAnnouncement(data);
          }
        }
      })
      .catch(() => {});
  }, []);

  if (!announcement || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('announcement-dismissed', announcement.id || 'dismissed');
  };

  return (
    <div className={`${TYPE_STYLES[announcement.type] || TYPE_STYLES.info} py-2.5 px-4 text-center text-sm no-print relative`}>
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-3">
        <span>{announcement.message}</span>
        {announcement.link && (
          <a
            href={announcement.link}
            className="underline font-medium hover:opacity-80 transition-opacity"
          >
            {announcement.linkText || '자세히 보기'}
          </a>
        )}
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:opacity-70 transition-opacity"
          aria-label="닫기"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
