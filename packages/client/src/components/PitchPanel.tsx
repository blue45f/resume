import { useMemo, useState } from 'react';
import type { Resume } from '@/types/resume';
import { generatePitch, type PitchTone } from '@/lib/pitchGenerator';
import { toast } from '@/components/Toast';

interface Props {
  resume: Resume;
}

const TONES: Array<{ id: PitchTone; label: string; emoji: string; hint: string }> = [
  { id: 'professional', label: '공식', emoji: '💼', hint: '면접·이력서 제출용' },
  { id: 'casual', label: '캐주얼', emoji: '👋', hint: 'Slack·Notion About' },
  { id: 'networking', label: '네트워킹', emoji: '🤝', hint: 'LinkedIn·커피챗' },
];

/**
 * PitchPanel — 이력서 데이터로 3가지 톤의 자기 PR 한 줄 소개 즉시 생성.
 * LLM 호출 없음, 사용자가 톤만 고르면 바로 복사 가능.
 */
export default function PitchPanel({ resume }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [tone, setTone] = useState<PitchTone>('professional');

  const pitch = useMemo(() => generatePitch(resume, { tone }), [resume, tone]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pitch);
      toast('한 줄 소개 복사됨', 'success');
    } catch {
      toast('복사 실패', 'error');
    }
  };

  return (
    <div className="imp-card bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 no-print">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 rounded-[var(--radius-sm)]"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="text-base">
            ✨
          </span>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            자동 한 줄 소개 생성
          </h3>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
            LinkedIn · Slack · 커피챗에 바로 사용
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3 animate-in fade-in-0 duration-200">
          {/* 톤 선택 */}
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => {
              const active = tone === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                    active
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-blue-300'
                  }`}
                  title={t.hint}
                >
                  <span className="mr-1" aria-hidden="true">
                    {t.emoji}
                  </span>
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* 생성 결과 */}
          <div className="relative">
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3 pr-14 border border-slate-100 dark:border-slate-700">
              {pitch || '이력서 정보가 부족해 한 줄 소개를 만들 수 없습니다.'}
            </p>
            <button
              onClick={copy}
              className="absolute top-2 right-2 px-2.5 py-1 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="한 줄 소개 복사"
            >
              📋 복사
            </button>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            💡 톤을 바꿔 여러 버전을 만들어보세요. 경력·기술·프로젝트 데이터로 즉시 생성되며 LLM
            호출 없어 무료·즉답 · 개인정보 외부 전송 없음.
          </p>
        </div>
      )}
    </div>
  );
}
