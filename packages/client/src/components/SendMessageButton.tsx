import { useState, memo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getUser } from '@/lib/auth';
import { API_URL } from '@/lib/config';
import { toast } from '@/components/Toast';
import Dialog from '@/shared/ui/Dialog';
import { messageSchema, type MessageFormValues } from '@/shared/lib/schemas/message';

interface Props {
  targetUserId?: string;
  targetUserName?: string;
  userId?: string;
  userName?: string;
  variant?: 'icon' | 'button' | 'mini';
  className?: string;
}

export default memo(function SendMessageButton({
  targetUserId,
  targetUserName,
  userId,
  userName,
  variant = 'icon',
  className = '',
}: Props) {
  const me = getUser();
  const [open, setOpen] = useState(false);

  const recipientId = targetUserId || userId || '';
  const recipientName = targetUserName || userName || '사용자';

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: { content: '' },
  });

  const text = watch('content') ?? '';

  if (!me || !recipientId || me.id === recipientId) return null;

  const onSubmit = async (data: MessageFormValues) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/social/messages/${recipientId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: data.content.trim() }),
      });
      if (res.ok) {
        toast(`${recipientName}에게 쪽지를 보냈습니다`, 'success');
        reset();
        setOpen(false);
      } else {
        const body = await res.json().catch(() => ({}));
        toast(body.message || '전송에 실패했습니다', 'error');
      }
    } catch {
      toast('전송에 실패했습니다', 'error');
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setOpen(true);
  };

  const dialog = (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title={`${recipientName}에게 쪽지`}
      maxWidth="max-w-sm"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <textarea
          {...register('content')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && text.trim()) {
              e.preventDefault();
              handleSubmit(onSubmit)();
            }
          }}
          placeholder="메시지를 입력하세요..."
          maxLength={500}
          rows={3}
          autoFocus
          className="w-full px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {errors.content && <p className="mt-1 text-xs text-red-500">{errors.content.message}</p>}
        <div className="flex items-center justify-between mt-3">
          <span className="text-[10px] text-neutral-400">{text.length}/500 · ⌘Enter 전송</span>
          <button
            type="submit"
            disabled={!text.trim() || isSubmitting}
            className="imp-btn px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? '전송 중...' : '보내기'}
          </button>
        </div>
      </form>
    </Dialog>
  );

  if (variant === 'mini') {
    return (
      <>
        <button
          onClick={handleClick}
          title={`${recipientName}에게 쪽지 보내기`}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors ${className}`}
        >
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          쪽지
        </button>
        {dialog}
      </>
    );
  }

  if (variant === 'button') {
    return (
      <>
        <button
          onClick={handleClick}
          title={`${recipientName}에게 쪽지 보내기`}
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${className}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          쪽지 보내기
        </button>
        {dialog}
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        title={`${recipientName}에게 쪽지 보내기`}
        className={`inline-flex items-center justify-center min-w-[36px] min-h-[36px] p-1.5 text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${className}`}
        aria-label="쪽지 보내기"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </button>
      {dialog}
    </>
  );
});
