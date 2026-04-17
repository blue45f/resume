import { API_URL } from '@/lib/config';
import { useEffect, useState } from 'react';

interface Notice {
  id: string;
  title: string;
  content: string;
  type: string;
}


const DISMISSED_KEY = 'dismissed_notices';
const TODAY_KEY = 'dismissed_notices_today';

function getDismissedToday(): string[] {
  try {
    const stored = JSON.parse(localStorage.getItem(TODAY_KEY) || '{}');
    const today = new Date().toDateString();
    return stored.date === today ? (stored.ids || []) : [];
  } catch { return []; }
}

function setDismissedToday(id: string) {
  const existing = getDismissedToday();
  localStorage.setItem(TODAY_KEY, JSON.stringify({ date: new Date().toDateString(), ids: [...existing, id] }));
}

const TYPE_CONFIG: Record<string, { label: string; badge: string; border: string }> = {
  MAINTENANCE: { label: '점검', badge: 'bg-red-500 text-white', border: 'border-red-200 dark:border-red-800' },
  EVENT: { label: '이벤트', badge: 'bg-emerald-500 text-white', border: 'border-emerald-200 dark:border-emerald-800' },
  GENERAL: { label: '공지', badge: 'bg-indigo-500 text-white', border: 'border-indigo-200 dark:border-indigo-800' },
};

export default function NoticePopup() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/api/notices/popup`)
      .then(r => r.ok ? r.json() : [])
      .then((data: Notice[]) => {
        const permanentlyDismissed = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]') as string[];
        const todayDismissed = getDismissedToday();
        const visible = data.filter(n => !permanentlyDismissed.includes(n.id) && !todayDismissed.includes(n.id));
        setNotices(visible);
      })
      .catch(() => {});
  }, []);

  // Esc key to close
  useEffect(() => {
    if (!notices.length) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss(notices[index]?.id);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [notices, index]);

  const dismiss = (id: string, permanently = false) => {
    if (permanently) {
      const prev = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]') as string[];
      localStorage.setItem(DISMISSED_KEY, JSON.stringify([...prev, id]));
    }
    const next = notices.filter(n => n.id !== id);
    setNotices(next);
    if (index >= next.length) setIndex(Math.max(0, next.length - 1));
  };

  const dismissToday = (id: string) => {
    setDismissedToday(id);
    dismiss(id);
  };

  if (!notices.length) return null;
  const notice = notices[index];
  const cfg = TYPE_CONFIG[notice.type] || TYPE_CONFIG.GENERAL;

  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[9999] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) dismiss(notice.id); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notice-popup-title"
    >
      <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border ${cfg.border} animate-scale-in`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.badge}`}>
              {cfg.label}
            </span>
            {notices.length > 1 && (
              <span className="text-xs text-slate-400 dark:text-slate-500">{index + 1} / {notices.length}</span>
            )}
          </div>
          <button
            onClick={() => dismiss(notice.id)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="닫기 (Esc)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <h3 id="notice-popup-title" className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3 leading-snug">
            {notice.title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
            {notice.content}
          </p>
        </div>

        {/* Navigation dots */}
        {notices.length > 1 && (
          <div className="flex justify-center gap-1.5 pb-3">
            {notices.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === index ? 'bg-indigo-500 w-4' : 'bg-slate-300 dark:bg-slate-600'}`}
                aria-label={`${i + 1}번 공지`}
              />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 px-6 pb-5">
          <button
            onClick={() => dismissToday(notice.id)}
            className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors underline underline-offset-2"
          >
            오늘 하루 보지 않기
          </button>
          <div className="flex items-center gap-2">
            {notices.length > 1 && index < notices.length - 1 && (
              <button
                onClick={() => setIndex(i => i + 1)}
                className="px-4 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                다음
              </button>
            )}
            <button
              onClick={() => dismiss(notice.id)}
              className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
