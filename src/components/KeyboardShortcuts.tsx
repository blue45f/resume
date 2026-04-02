import { useState, useEffect } from 'react';

const shortcuts = [
  { keys: ['Ctrl/⌘', 'S'], description: '이력서 저장' },
  { keys: ['Ctrl/⌘', 'P'], description: 'PDF 인쇄' },
  { keys: ['?'], description: '단축키 도움말 토글' },
  { keys: ['Esc'], description: '모달/패널 닫기' },
  { keys: ['N'], description: '새 이력서 (홈에서)' },
  { keys: ['\u2190', '\u2192'], description: '탭 이동 (편집 페이지)' },
];

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in" onClick={() => setOpen(false)}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">키보드 단축키</h2>
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl" aria-label="닫기">&times;</button>
        </div>
        <div className="space-y-3">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">{s.description}</span>
              <div className="flex gap-1">
                {s.keys.map((key, j) => (
                  <span key={j}>
                    <kbd className="px-2 py-1 text-xs font-mono bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded border border-slate-300 dark:border-slate-600">{key}</kbd>
                    {j < s.keys.length - 1 && <span className="text-slate-400 mx-0.5">+</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-400 text-center">아무 키나 눌러 닫기</p>
      </div>
    </div>
  );
}
