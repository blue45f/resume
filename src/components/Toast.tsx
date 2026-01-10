import { useEffect, useState, useCallback } from 'react';

interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error' | 'info';
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
    setTimeout(() => setMessages(prev => prev.filter(m => m.id !== id)), 3000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  if (messages.length === 0) return null;

  const bgColors = {
    success: 'bg-green-500',
    error: 'bg-red-600',
    info: 'bg-slate-800',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" aria-live="polite">
      {messages.map(msg => (
        <div
          key={msg.id}
          className={`${bgColors[msg.type]} text-white px-4 py-2.5 rounded-lg shadow-xl text-sm max-w-xs animate-[slideIn_0.2s_ease-out]`}
          role="alert"
        >
          {msg.text}
        </div>
      ))}
    </div>
  );
}
