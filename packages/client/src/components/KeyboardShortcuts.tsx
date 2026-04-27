import { useState, useEffect } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';

const shortcuts = [
  { keys: ['⌘/Ctrl', 'K'], description: '글로벌 검색', category: '탐색' },
  { keys: ['⌘/Ctrl', 'S'], description: '이력서 저장', category: '편집' },
  { keys: ['⌘/Ctrl', 'P'], description: 'PDF 인쇄', category: '미리보기' },
  { keys: ['⌘/Ctrl', 'Enter'], description: '댓글/쪽지 전송', category: '일반' },
  { keys: ['\u2190', '\u2192'], description: '탭 이동', category: '편집' },
  { keys: ['N'], description: '새 이력서 (홈에서)', category: '탐색' },
  { keys: ['E'], description: '탐색 페이지', category: '탐색' },
  { keys: ['/'], description: '검색 포커스', category: '탐색' },
  { keys: ['?'], description: '단축키 도움말', category: '일반' },
  { keys: ['Esc'], description: '모달/패널 닫기', category: '일반' },
];

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
        return;
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'e' && !e.ctrlKey && !e.metaKey) {
        window.location.href = '/explore';
      }
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[type="text"][placeholder*="검색"]',
        );
        if (searchInput) searchInput.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <RadixDialog.Root open={open} onOpenChange={setOpen}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[90] bg-black/50 animate-fade-in" />
        <RadixDialog.Content
          aria-describedby={undefined}
          className="scroll-inner fixed z-[91] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl p-6 animate-scale-in max-h-[90dvh] overflow-y-auto focus:outline-none"
        >
          <div className="flex items-center justify-between mb-4">
            <RadixDialog.Title className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              키보드 단축키
            </RadixDialog.Title>
            <RadixDialog.Close asChild>
              <button className="text-neutral-400 hover:text-neutral-600 text-xl" aria-label="닫기">
                &times;
              </button>
            </RadixDialog.Close>
          </div>
          <div className="space-y-4">
            {['편집', '미리보기', '탐색', '일반'].map((cat) => {
              const items = shortcuts.filter((s) => s.category === cat);
              if (!items.length) return null;
              return (
                <div key={cat}>
                  <h3 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">
                    {cat}
                  </h3>
                  <div className="space-y-2">
                    {items.map((s, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm text-neutral-600 dark:text-neutral-300">
                          {s.description}
                        </span>
                        <div className="flex gap-1">
                          {s.keys.map((key, j) => (
                            <span key={j}>
                              <kbd className="px-2 py-1 text-xs font-mono bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded border border-neutral-300 dark:border-neutral-600 shadow-sm">
                                {key}
                              </kbd>
                              {j < s.keys.length - 1 && (
                                <span className="text-neutral-400 mx-0.5">+</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-neutral-400 text-center">Esc 로 닫기</p>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
