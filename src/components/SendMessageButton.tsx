import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '@/lib/config';
import { toast } from '@/components/Toast';


interface Props {
  userId: string;
  userName: string;
}

export default function SendMessageButton({ userId, userName }: Props) {
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowPopup(false);
      }
    }
    if (showPopup) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPopup]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/social/messages/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: message.trim() }),
      });
      if (!res.ok) throw new Error();
      toast('메시지가 전송되었습니다', 'success');
      setMessage('');
      setShowPopup(false);
    } catch {
      toast('메시지 전송에 실패했습니다', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleGoToMessages = () => {
    navigate(`/messages?to=${userId}`);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowPopup(v => !v)}
        className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-700 dark:hover:text-slate-200 transition-all duration-200"
        aria-label={`${userName}님에게 메시지 보내기`}
        title={`${userName}님에게 메시지`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {showPopup && (
        <div
          ref={popupRef}
          className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {userName}님에게 메시지
              </span>
              <button
                onClick={handleGoToMessages}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                대화 열기
              </button>
            </div>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="메시지를 입력하세요..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleSendMessage}
                disabled={sending || !message.trim()}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? '전송 중...' : '전송'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
