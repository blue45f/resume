import { useEffect, useState, useCallback, useRef } from 'react';

interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error' | 'info' | 'warning';
  exiting?: boolean;
}

let toastId = 0;
let addToastFn: ((text: string, type: ToastMessage['type']) => void) | null = null;

export function toast(text: string, type: ToastMessage['type'] = 'info') {
  addToastFn?.(text, type);
}

export function ToastContainer() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: number) => {
    // Start exit animation
    setMessages(prev => prev.map(m => m.id === id ? { ...m, exiting: true } : m));
    // Remove after animation completes
    setTimeout(() => setMessages(prev => prev.filter(m => m.id !== id)), 200);
  }, []);

  const addToast = useCallback((text: string, type: ToastMessage['type']) => {
    const id = ++toastId;
    setMessages(prev => [...prev, { id, text, type }]);
    const duration = type === 'error' || type === 'warning' ? 4000 : 3000;
    const timer = setTimeout(() => removeToast(id), duration);
    timersRef.current.set(id, timer);
  }, [removeToast]);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  if (messages.length === 0) return null;

  const bgColors = {
    success: 'bg-green-500',
    error: 'bg-red-600',
    info: 'bg-slate-800 dark:bg-slate-700',
    warning: 'bg-amber-500',
  };

  const icons = {
    success: (
      <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 2l10 18H2L12 2z" />
      </svg>
    ),
    info: (
      <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
      </svg>
    ),
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:bottom-4 sm:left-auto sm:right-4 z-50 flex flex-col gap-2" aria-live="polite">
      {messages.map(msg => (
        <div
          key={msg.id}
          className={`${bgColors[msg.type]} text-white px-4 py-2.5 rounded-lg shadow-xl text-sm max-w-xs flex items-center`}
          style={{
            animation: msg.exiting
              ? 'slideOut 0.2s ease-in forwards'
              : 'slideIn 0.2s ease-out',
          }}
          role="alert"
        >
          {icons[msg.type]}
          <span className="flex-1">{msg.text}</span>
          <button
            onClick={() => {
              const timer = timersRef.current.get(msg.id);
              if (timer) clearTimeout(timer);
              timersRef.current.delete(msg.id);
              removeToast(msg.id);
            }}
            className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
            aria-label="닫기"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
