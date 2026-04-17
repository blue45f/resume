import { useState } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { toast } from '@/components/Toast';
import { API_URL } from '@/lib/config';

interface Props {
  onClose: () => void;
  onSuccess: (resumeId: string) => void;
}

export default function QuickImportModal({ onClose, onSuccess }: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (text.trim().length < 50) {
      toast('최소 50자 이상의 텍스트를 입력해주세요', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const previewRes = await fetch(`${API_URL}/api/auto-generate/preview`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text }),
      });
      if (!previewRes.ok) throw new Error('텍스트 분석에 실패했습니다');
      await previewRes.json();

      const createRes = await fetch(`${API_URL}/api/auto-generate/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text }),
      });
      if (!createRes.ok) throw new Error('이력서 생성에 실패했습니다');
      const created = await createRes.json();

      toast('이력서가 생성되었습니다!', 'success');
      onSuccess(created.id || created.data?.id);
    } catch (e: any) {
      toast(e.message || '가져오기에 실패했습니다', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RadixDialog.Root
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[90] bg-black/50 animate-fade-in" />
        <RadixDialog.Content className="fixed z-[91] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-2xl bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl animate-scale-in max-h-[90vh] flex flex-col focus:outline-none">
          <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-700">
            <div>
              <RadixDialog.Title className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                빠른 가져오기
              </RadixDialog.Title>
              <RadixDialog.Description className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                기존 이력서나 LinkedIn 프로필 텍스트를 붙여넣으세요
              </RadixDialog.Description>
            </div>
            <RadixDialog.Close asChild>
              <button
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-xl"
                aria-label="닫기"
              >
                &times;
              </button>
            </RadixDialog.Close>
          </div>

          <div className="p-5 flex-1 overflow-y-auto">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                '이름: 홍길동\n이메일: hong@example.com\n\n경력:\n- ABC 회사 (2020-현재)\n  프론트엔드 개발자\n  React, TypeScript 기반 웹 서비스 개발\n\n학력:\n- 서울대학교 컴퓨터공학과 (2016-2020)\n\n기술:\n- React, TypeScript, Next.js, Node.js'
              }
              rows={15}
              className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-600 rounded-xl text-sm dark:bg-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-neutral-400">
                {text.length}자 입력됨 {text.length < 50 && '(최소 50자)'}
              </span>
              <div className="flex gap-2 text-xs text-neutral-400">
                <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded">
                  LinkedIn 프로필
                </span>
                <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded">
                  사람인 이력서
                </span>
                <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded">
                  자유 형식
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 border-t border-neutral-200 dark:border-neutral-700 flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleImport}
              disabled={loading || text.trim().length < 50}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 shadow-sm"
            >
              {loading ? 'AI 분석 중...' : 'AI로 가져오기'}
            </button>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
