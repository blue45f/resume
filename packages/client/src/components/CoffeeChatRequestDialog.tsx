import { useState } from 'react';
import Dialog from '@/shared/ui/Dialog';
import { toast } from '@/components/Toast';
import { requestCoffeeChat } from '@/lib/api';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  hostId: string;
  hostName: string;
  defaultTopic?: string;
  onSent?: () => void;
}

const MODALITIES: { value: 'video' | 'voice' | 'chat'; label: string; icon: string }[] = [
  { value: 'video', label: '화상', icon: '📹' },
  { value: 'voice', label: '음성', icon: '🎙️' },
  { value: 'chat', label: '텍스트', icon: '💬' },
];

const DURATIONS = [15, 30, 60];

export default function CoffeeChatRequestDialog({
  open,
  onOpenChange,
  hostId,
  hostName,
  defaultTopic,
  onSent,
}: Props) {
  const [topic, setTopic] = useState(defaultTopic || '');
  const [message, setMessage] = useState('');
  const [modality, setModality] = useState<'video' | 'voice' | 'chat'>('video');
  const [durationMin, setDurationMin] = useState(30);
  const [scheduledAt, setScheduledAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast('메시지를 입력해주세요', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await requestCoffeeChat({
        hostId,
        message: message.trim(),
        topic: topic.trim() || undefined,
        modality,
        durationMin,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      });
      toast(`${hostName}님에게 커피챗을 신청했습니다`, 'success');
      onSent?.();
      onOpenChange(false);
      setMessage('');
      setTopic('');
    } catch (err) {
      toast(err instanceof Error ? err.message : '신청에 실패했습니다', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${hostName}님에게 커피챗 신청`}
      description="가벼운 1:1 만남으로 커리어 조언을 들어보세요. 음성/화상은 서버를 거치지 않는 P2P 통화입니다."
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            주제 (선택)
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            maxLength={100}
            placeholder="예: 백엔드 신입 면접 준비"
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            메시지 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="간단한 자기소개와 어떤 이야기를 나누고 싶은지 적어주세요"
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500 text-right">
            {message.length}/1000
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            소통 방식
          </label>
          <div className="grid grid-cols-3 gap-2">
            {MODALITIES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setModality(m.value)}
                className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                  modality === m.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <span aria-hidden="true">{m.icon}</span> {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              시간
            </label>
            <div className="flex gap-1">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDurationMin(d)}
                  className={`flex-1 px-2 py-1.5 text-xs rounded-lg border transition-colors ${
                    durationMin === d
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {d}분
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              희망 일시 (선택)
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-3 py-1.5 text-sm rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!message.trim() || submitting}
            className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? '신청 중...' : '신청하기'}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
