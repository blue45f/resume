import { API_URL } from '@/lib/config';
import { useEffect, useState } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';

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
    return stored.date === today ? stored.ids || [] : [];
  } catch {
    return [];
  }
}

function setDismissedToday(id: string) {
  const existing = getDismissedToday();
  localStorage.setItem(
    TODAY_KEY,
    JSON.stringify({ date: new Date().toDateString(), ids: [...existing, id] }),
  );
}

const TYPE_CONFIG: Record<string, { label: string; badge: string; border: string }> = {
  MAINTENANCE: {
    label: '점검',
    badge: 'bg-red-500 text-white',
    border: 'border-red-200 dark:border-red-800',
  },
  EVENT: {
    label: '이벤트',
    badge: 'bg-emerald-500 text-white',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  GENERAL: {
    label: '공지',
    badge: 'bg-blue-500 text-white',
    border: 'border-blue-200 dark:border-blue-800',
  },
};

export default function NoticePopup() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/api/notices/popup`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Notice[]) => {
        const permanentlyDismissed = JSON.parse(
          localStorage.getItem(DISMISSED_KEY) || '[]',
        ) as string[];
        const todayDismissed = getDismissedToday();
        const visible = data.filter(
          (n) => !permanentlyDismissed.includes(n.id) && !todayDismissed.includes(n.id),
        );
        setNotices(visible);
      })
      .catch(() => {});
  }, []);

  const dismiss = (id: string, permanently = false) => {
    if (permanently) {
      const prev = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]') as string[];
      localStorage.setItem(DISMISSED_KEY, JSON.stringify([...prev, id]));
    }
    const next = notices.filter((n) => n.id !== id);
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
    <RadixDialog.Root
      open
      onOpenChange={(o) => {
        if (!o) dismiss(notice.id);
      }}
    >
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[9998] bg-black/50 dark:bg-black/70 animate-fade-in" />
        <RadixDialog.Content
          aria-describedby={undefined}
          className={`fixed z-[9999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl border ${cfg.border} animate-scale-in max-h-[90vh] overflow-y-auto focus:outline-none`}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-700">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.badge}`}>
                {cfg.label}
              </span>
              {notices.length > 1 && (
                <span className="text-xs text-neutral-400 dark:text-neutral-500">
                  {index + 1} / {notices.length}
                </span>
              )}
            </div>
            <RadixDialog.Close asChild>
              <button
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                aria-label="닫기 (Esc)"
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
            </RadixDialog.Close>
          </div>

          <div className="px-6 py-5">
            <RadixDialog.Title className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-3 leading-snug">
              {notice.title}
            </RadixDialog.Title>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed whitespace-pre-wrap">
              {notice.content}
            </p>
          </div>

          {notices.length > 1 && (
            <div className="flex justify-center gap-1.5 pb-3">
              {notices.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === index ? 'bg-blue-500 w-4' : 'bg-neutral-300 dark:bg-neutral-600'}`}
                  aria-label={`${i + 1}번 공지`}
                />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-2 px-6 pb-5">
            <button
              onClick={() => dismissToday(notice.id)}
              className="text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors underline underline-offset-2"
            >
              오늘 하루 보지 않기
            </button>
            <div className="flex items-center gap-2">
              {notices.length > 1 && index < notices.length - 1 && (
                <button
                  onClick={() => setIndex((i) => i + 1)}
                  className="px-4 py-2 text-sm bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                >
                  다음
                </button>
              )}
              <button
                onClick={() => dismiss(notice.id)}
                className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
