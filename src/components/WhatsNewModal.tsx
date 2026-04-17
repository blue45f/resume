import { useState, useEffect } from 'react';
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
      .then(r => r.ok ? r.json() : null)
      .then(d => {
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

  if (!open || !data || !data.features?.length) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="새로운 기능 안내"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={handleClose} />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl animate-fade-in-up overflow-hidden">
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">What's New</span>
                <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">v{data.version}</span>
              </div>
              <h2 className="text-xl font-bold">{data.title || '새로운 기능이 추가됐어요! 🎉'}</h2>
              <p className="text-sm text-white/80 mt-0.5">{data.subtitle || '이력서공방 최신 업데이트를 확인하세요'}</p>
            </div>
            <button onClick={handleClose} className="ml-4 shrink-0 p-1.5 rounded-lg hover:bg-white/20 transition-colors" aria-label="닫기">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-3">
          {data.features.map((f, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 animate-fade-in">
              <span className="text-2xl shrink-0 mt-0.5">{f.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{f.title}</span>
                  {f.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-600 text-white rounded-full uppercase tracking-wide">
                      {f.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <a href="/notices" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline" onClick={handleClose}>
            전체 공지사항 보기 →
          </a>
          <button onClick={handleClose} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
            확인했어요
          </button>
        </div>
      </div>
    </div>
  );
}
