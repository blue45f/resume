import { useState, useRef, useEffect } from 'react';
import { API_URL } from '@/lib/config';

interface Props {
  resumeId: string;
  resumeTitle: string;
  onPrint: () => void;
}

interface ExportOption {
  label: string;
  format: string;
  icon: React.ReactNode;
  description: string;
  href?: string;
  download?: string;
  comingSoon?: boolean;
  onClick?: () => void;
}

export default function ExportPanel({ resumeId, resumeTitle, onPrint }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const safeTitle = resumeTitle || 'resume';

  const options: ExportOption[] = [
    {
      label: 'PDF',
      format: '.pdf',
      icon: (
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h2m-2 3h4m2-9V3l5 5h-4a1 1 0 01-1-1z" />
        </svg>
      ),
      description: '인쇄 다이얼로그에서 PDF로 저장',
      onClick: () => { onPrint(); setOpen(false); },
    },
    {
      label: 'Word',
      format: '.docx',
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          <text x="8" y="17" fontSize="7" fontWeight="bold" fill="currentColor" stroke="none">W</text>
        </svg>
      ),
      description: 'Microsoft Word 형식 (.docx)',
      href: `${API_URL}/api/resumes/${resumeId}/export/docx`,
      download: `${safeTitle}.docx`,
    },
    {
      label: '텍스트',
      format: '.txt',
      icon: (
        <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      description: '순수 텍스트 파일',
      href: `${API_URL}/api/resumes/${resumeId}/export/text`,
      download: `${safeTitle}.txt`,
    },
    {
      label: '마크다운',
      format: '.md',
      icon: (
        <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth={1.5} />
          <path d="M7 15V9l2.5 3L12 9v6m3-6v4l2-2 2 2V9" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      description: 'GitHub 등에서 사용 가능',
      href: `${API_URL}/api/resumes/${resumeId}/export/markdown`,
      download: `${safeTitle}.md`,
    },
    {
      label: 'JSON',
      format: '.json',
      icon: (
        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      description: '구조화된 데이터 형식',
      href: `${API_URL}/api/resumes/${resumeId}/export/json`,
      download: `${safeTitle}.json`,
    },
    {
      label: '이미지',
      format: '.png',
      icon: (
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      description: 'PNG 이미지 형식',
      comingSoon: true,
    },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="px-2.5 sm:px-3 py-2 text-slate-600 bg-slate-100 text-xs sm:text-sm font-medium rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 flex items-center gap-1.5"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        내보내기
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150 py-1">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">내보내기 형식</p>
          </div>
          {options.map(opt => {
            const inner = (
              <div className="flex items-center gap-3 w-full">
                <div className="flex-shrink-0">{opt.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{opt.label}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{opt.format}</span>
                    {opt.comingSoon && (
                      <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full leading-none">
                        준비 중
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{opt.description}</p>
                </div>
                {!opt.comingSoon && (
                  <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            );

            if (opt.comingSoon) {
              return (
                <div key={opt.label} className="px-3 py-2.5 opacity-60 cursor-not-allowed">
                  {inner}
                </div>
              );
            }

            if (opt.href) {
              return (
                <a
                  key={opt.label}
                  href={opt.href}
                  download={opt.download}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  {inner}
                </a>
              );
            }

            return (
              <button
                key={opt.label}
                onClick={opt.onClick}
                className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                {inner}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
