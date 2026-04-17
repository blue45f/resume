import { useState, useEffect } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { API_URL } from '@/lib/config';

const STORAGE_KEY = 'whats-new-seen-v';

interface Feature {
  icon: string;
  title: string;
  desc: string;
  badge?: string;
}

interface WhatsNewData {
  version: string;
  title?: string;
  subtitle?: string;
  features: Feature[];
}

const FALLBACK: WhatsNewData = {
  version: '2.8.0',
  features: [],
};

export default function WhatsNewModal() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<WhatsNewData | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/system-config/content/whats_new`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const content: WhatsNewData = d && d.version ? d : FALLBACK;
        if (!content.features?.length) return;
        const seen = localStorage.getItem(STORAGE_KEY);
        if (seen !== content.version) {
          setData(content);
          const t = setTimeout(() => setOpen(true), 2000);
          return () => clearTimeout(t);
        }
      })
      .catch(() => {});
  }, []);

  const handleClose = () => {
    if (data) localStorage.setItem(STORAGE_KEY, data.version);
    setOpen(false);
  };

  if (!data || !data.features?.length) return null;

  return (
    <RadixDialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
      }}
    >
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm animate-fade-in" />
        <RadixDialog.Content
          aria-label="새로운 기능 안내"
          className="fixed z-[101] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl animate-fade-in-up overflow-hidden max-h-[90vh] focus:outline-none flex flex-col"
        >
          <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-blue-600 via-sky-600 to-cyan-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-widest opacity-80">
                    What's New
                  </span>
                  <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">
                    v{data.version}
                  </span>
                </div>
                <RadixDialog.Title className="text-xl font-bold">
                  {data.title || '새로운 기능이 추가됐어요!'}
                </RadixDialog.Title>
                <RadixDialog.Description className="text-sm text-white/80 mt-0.5">
                  {data.subtitle || '이력서공방 최신 업데이트를 확인하세요'}
                </RadixDialog.Description>
              </div>
              <RadixDialog.Close asChild>
                <button
                  className="ml-4 shrink-0 p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                  aria-label="닫기"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </RadixDialog.Close>
            </div>
          </div>

          <div className="px-6 py-4 overflow-y-auto space-y-3">
            {data.features.map((f, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 animate-fade-in"
              >
                <span className="text-2xl shrink-0 mt-0.5">{f.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                      {f.title}
                    </span>
                    {f.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-600 text-white rounded-full uppercase tracking-wide">
                        {f.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-700 flex items-center justify-between">
            <a
              href="/notices"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              onClick={handleClose}
            >
              전체 공지사항 보기 →
            </a>
            <button
              onClick={handleClose}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              확인했어요
            </button>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
