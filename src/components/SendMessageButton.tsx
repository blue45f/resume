import { useNavigate } from 'react-router-dom';
import { getUser } from '@/lib/auth';

interface Props {
  targetUserId?: string;
  targetUserName?: string;
  /** @deprecated use targetUserId */
  userId?: string;
  /** @deprecated use targetUserName */
  userName?: string;
  variant?: 'icon' | 'button' | 'mini';
  className?: string;
}

export default function SendMessageButton({ targetUserId, targetUserName, userId, userName, variant = 'icon', className = '' }: Props) {
  const navigate = useNavigate();
  const me = getUser();

  const recipientId = targetUserId || userId || '';
  const recipientName = targetUserName || userName || '사용자';

  if (!me || !recipientId || me.id === recipientId) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigate(`/messages?to=${recipientId}`);
  };

  if (variant === 'mini') {
    return (
      <button onClick={handleClick} title={`${recipientName}에게 쪽지 보내기`}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors ${className}`}
      >
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        쪽지
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <button onClick={handleClick} title={`${recipientName}에게 쪽지 보내기`}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors ${className}`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        쪽지 보내기
      </button>
    );
  }

  return (
    <button onClick={handleClick} title={`${recipientName}에게 쪽지 보내기`}
      className={`p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all ${className}`}
      aria-label="쪽지 보내기"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
    </button>
  );
}
