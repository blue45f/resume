import { useState, useRef, useEffect } from 'react';
import { aiInlineAssist } from '@/lib/api';

interface Props {
  resumeId?: string;
  value: string;
  onAccept: (text: string) => void;
}

const ASSIST_OPTIONS = [
  { type: 'improve', label: '문장 개선', desc: '더 전문적이고 임팩트 있게' },
  { type: 'quantify', label: '성과 수치화', desc: '정량적 지표 추가' },
  { type: 'concise', label: '간결하게', desc: '분량 30-50% 축소' },
  { type: 'english', label: '영문 변환', desc: '전문적인 영어로 번역' },
];

export default function AiWritingAssist({ resumeId, value, onAccept }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ original: string; improved: string; type: string } | null>(
    null,
  );
  const [error, setError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        if (!loading && !result) setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, loading, result]);

  const plainText = (value || '').replace(/<[^>]*>/g, '').trim();

  const handleAssist = async (type: string) => {
    if (!plainText || plainText.length < 2) {
      setError('개선할 텍스트를 먼저 입력하세요.');
      return;
    }
    if (!resumeId) {
      setError('이력서를 먼저 저장해주세요.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await aiInlineAssist(resumeId, plainText, type);
      setResult(res);
    } catch (err: any) {
      setError(err?.message || 'AI 요청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (result) {
      onAccept(result.improved);
      setResult(null);
      setOpen(false);
    }
  };

  const handleReject = () => {
    setResult(null);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          setResult(null);
          setError('');
        }}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs text-sky-600 hover:text-purple-800 hover:bg-purple-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
        title="AI 문장 개선"
        aria-label="AI 작성 도우미"
        aria-expanded={open}
      >
        <svg
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
          />
        </svg>
        <span>AI</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-b border-slate-100 dark:border-slate-700">
            <p className="text-xs font-semibold text-purple-700 dark:text-sky-400">
              AI 작성 도우미
            </p>
            {plainText.length > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                &ldquo;{plainText.substring(0, 40)}
                {plainText.length > 40 ? '...' : ''}&rdquo;
              </p>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="px-4 py-6 text-center">
              <div className="inline-flex items-center gap-2 text-sm text-sky-600 dark:text-sky-400">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                AI가 분석 중입니다...
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="px-3 py-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10">
              {error}
            </div>
          )}

          {/* Result State */}
          {result && !loading && (
            <div className="p-3 space-y-3">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  AI 제안:
                </p>
                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {result.improved}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAccept}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  적용
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  다시 선택
                </button>
              </div>
            </div>
          )}

          {/* Options (shown when no loading and no result) */}
          {!loading && !result && (
            <div className="p-1">
              {ASSIST_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => handleAssist(opt.type)}
                  disabled={plainText.length < 2}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors group"
                >
                  <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center shrink-0 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/40 transition-colors">
                    {opt.type === 'improve' && (
                      <svg
                        className="w-3.5 h-3.5 text-sky-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                        />
                      </svg>
                    )}
                    {opt.type === 'quantify' && (
                      <svg
                        className="w-3.5 h-3.5 text-sky-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                        />
                      </svg>
                    )}
                    {opt.type === 'concise' && (
                      <svg
                        className="w-3.5 h-3.5 text-sky-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25"
                        />
                      </svg>
                    )}
                    {opt.type === 'english' && (
                      <svg
                        className="w-3.5 h-3.5 text-sky-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {opt.label}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
