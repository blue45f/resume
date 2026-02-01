import { useState } from 'react';
import { toast } from '@/components/Toast';

const API_URL = import.meta.env.VITE_API_URL || '';

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

      // Step 1: Preview (parse text to structured data)
      const previewRes = await fetch(`${API_URL}/api/auto-generate/preview`, {
        method: 'POST', headers, body: JSON.stringify({ text }),
      });
      if (!previewRes.ok) throw new Error('텍스트 분석에 실패했습니다');
      const preview = await previewRes.json();

      // Step 2: Create resume from parsed data
      const createRes = await fetch(`${API_URL}/api/auto-generate/create`, {
        method: 'POST', headers, body: JSON.stringify({ text }),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 animate-scale-in max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">빠른 가져오기</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">기존 이력서나 LinkedIn 프로필 텍스트를 붙여넣으세요</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl" aria-label="닫기">&times;</button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={"이름: 홍길동\n이메일: hong@example.com\n\n경력:\n- ABC 회사 (2020-현재)\n  프론트엔드 개발자\n  React, TypeScript 기반 웹 서비스 개발\n\n학력:\n- 서울대학교 컴퓨터공학과 (2016-2020)\n\n기술:\n- React, TypeScript, Next.js, Node.js"}
            rows={15}
            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-slate-400">{text.length}자 입력됨 {text.length < 50 && '(최소 50자)'}</span>
            <div className="flex gap-2 text-xs text-slate-400">
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">LinkedIn 프로필</span>
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">사람인 이력서</span>
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">자유 형식</span>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-200 dark:border-slate-700 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 transition-colors">취소</button>
          <button
            onClick={handleImport}
            disabled={loading || text.trim().length < 50}
            className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition-all duration-200 shadow-sm"
          >
            {loading ? 'AI 분석 중...' : 'AI로 가져오기'}
          </button>
        </div>
      </div>
    </div>
  );
}
