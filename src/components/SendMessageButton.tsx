import { useState, useRef, useEffect, memo } from 'react';
import { getUser } from '@/lib/auth';
import { API_URL } from '@/lib/config';
import { toast } from '@/components/Toast';

interface Props {
  targetUserId?: string;
  targetUserName?: string;
  userId?: string;
  userName?: string;
  variant?: 'icon' | 'button' | 'mini';
  className?: string;
}

export default memo(function SendMessageButton({ targetUserId, targetUserName, userId, userName, variant = 'icon', className = '' }: Props) {
  const me = getUser();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const recipientId = targetUserId || userId || '';
  const recipientName = targetUserName || userName || '사용자';

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      const handleClick = (e: MouseEvent) => {
        if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setOpen(false);
      };
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleEsc);
      return () => {
        document.removeEventListener('mousedown', handleClick);
        document.removeEventListener('keydown', handleEsc);
      };
    }
  }, [open]);

  if (!me || !recipientId || me.id === recipientId) return null;

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/social/messages/${recipientId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: text.trim() }),
      });
      if (res.ok) {
        toast(`${recipientName}에게 쪽지를 보냈습니다`, 'success');
        setText('');
        setOpen(false);
      } else {
        const data = await res.json().catch(() => ({}));
        toast(data.message || '전송에 실패했습니다', 'error');
      }
    } catch {
      toast('전송에 실패했습니다', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setOpen(!open);
  };

  const popover = open && (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" onClick={(e) => { e.stopPropagation(); setOpen(false); }}>
      <div className="absolute inset-0 bg-black/30" />
    <div
      ref={popoverRef}
      className="relative z-10 w-full max-w-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl animate-fade-in-up"
      onClick={e => e.stopPropagation()}
    >
      <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          {recipientName}에게 쪽지
        </span>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-3">
        <textarea
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && text.trim()) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="메시지를 입력하세요..."
          maxLength={500}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-slate-400">{text.length}/500 · ⌘Enter 전송</span>
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {sending ? '전송 중...' : '보내기'}
          </button>
        </div>
      </div>
    </div>
    </div>
  );

  if (variant === 'mini') {
    return (
      <span className="relative inline-flex">
        <button onClick={handleClick} title={`${recipientName}에게 쪽지 보내기`}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors ${className}`}
        >
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          쪽지
        </button>
        {popover}
      </span>
    );
  }

  if (variant === 'button') {
    return (
      <span className="relative inline-flex">
        <button onClick={handleClick} title={`${recipientName}에게 쪽지 보내기`}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors ${className}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          쪽지 보내기
        </button>
        {popover}
      </span>
    );
  }

  return (
    <span className="relative inline-flex">
      <button onClick={handleClick} title={`${recipientName}에게 쪽지 보내기`}
        className={`p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all ${className}`}
        aria-label="쪽지 보내기"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
      </button>
      {popover}
    </span>
  );
});
