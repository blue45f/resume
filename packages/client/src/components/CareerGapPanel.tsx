import { useMemo } from 'react';
import { detectCareerGaps } from '@/lib/koreanChecker';

interface Props {
  text: string;
  minLength?: number;
  className?: string;
}

const SEVERITY_META: Record<
  'minor' | 'notable' | 'major',
  { label: string; color: string; border: string }
> = {
  minor: {
    label: '경미',
    color: 'text-slate-600 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
  },
  notable: {
    label: '주의',
    color: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-900/40',
  },
  major: {
    label: '중요',
    color: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-900/40',
  },
};

/**
 * 경력 구간 사이 6개월↑ 공백을 감지해 면접에서 설명 필요한 신호로 강조.
 * 잡코리아·사람인 이력서 코칭 가이드 벤치: 공백 설명 준비 유도.
 */
export default function CareerGapPanel({ text, minLength = 200, className = '' }: Props) {
  const analysis = useMemo(() => {
    if (!text || text.length < minLength) return null;
    return detectCareerGaps(text);
  }, [text, minLength]);

  if (!analysis || analysis.gaps.length === 0) return null;

  return (
    <div className={`mt-3 ${className}`}>
      <div className="flex items-baseline justify-between mb-1.5">
        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          📅 경력 공백 {analysis.gaps.length}건
        </div>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">
          총 {analysis.totalGapMonths}개월
        </span>
      </div>
      <ul className="space-y-1">
        {analysis.gaps.map((g, i) => {
          const meta = SEVERITY_META[g.severity];
          return (
            <li
              key={i}
              className={`flex items-center gap-2 rounded-md border px-2 py-1 text-[11px] ${meta.border}`}
            >
              <span
                className={`shrink-0 text-[9.5px] font-semibold uppercase tracking-wider ${meta.color}`}
              >
                {meta.label}
              </span>
              <span className="text-slate-700 dark:text-slate-200 tabular-nums">
                {g.from.year}.{String(g.from.month).padStart(2, '0')} → {g.to.year}.
                {String(g.to.month).padStart(2, '0')}
              </span>
              <span className="ml-auto text-slate-500 dark:text-slate-400 tabular-nums">
                {g.gapMonths}개월
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-1 text-[10.5px] text-slate-500 dark:text-slate-400">
        💡 면접 답변 또는 이력서 내 1~2줄 설명(학습/재충전/프리랜서 등)으로 공백을 투명화하세요.
      </p>
    </div>
  );
}
