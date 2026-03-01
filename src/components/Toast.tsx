import { useEffect, useState, useCallback } from 'react';

interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

let toastId = 0;
let addToastFn: ((text: string, type: ToastMessage['type']) => void) | null = null;

export function toast(text: string, type: ToastMessage['type'] = 'info') {
  addToastFn?.(text, type);
}

export function ToastContainer() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const addToast = useCallback((text: string, type: ToastMessage['type']) => {
    const id = ++toastId;
    setMessages(prev => [...prev, { id, text, type }]);
    const duration = type === 'error' || type === 'warning' ? 4000 : 3000;
    setTimeout(() => setMessages(prev => prev.filter(m => m.id !== id)), duration);
  }, []);

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

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" aria-live="polite">
      {messages.map(msg => (
        <div
          key={msg.id}
          className={`${bgColors[msg.type]} text-white px-4 py-2.5 rounded-lg shadow-xl text-sm max-w-xs animate-[slideIn_0.2s_ease-out] flex items-center`}
          role="alert"
        >
          <span className="flex-1">{msg.text}</span>
          <button onClick={() => setMessages(prev => prev.filter(m => m.id !== msg.id))} className="ml-2 opacity-70 hover:opacity-100" aria-label="닫기">&times;</button>
        </div>
      ))}
    </div>
  );
}
