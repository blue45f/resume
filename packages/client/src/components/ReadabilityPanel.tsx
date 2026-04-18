import { useMemo, useState } from 'react';
import type { Resume } from '@/types/resume';
import { analyzeReadability } from '@/lib/readability';

interface Props {
  resume: Resume;
}

const GRADE_COLORS: Record<string, { chip: string; bar: string; label: string }> = {
  S: { chip: 'text-blue-700 bg-blue-50 border-blue-200', bar: '#2563eb', label: '탁월' },
  A: { chip: 'text-green-700 bg-green-50 border-green-200', bar: '#16a34a', label: '우수' },
  B: { chip: 'text-amber-700 bg-amber-50 border-amber-200', bar: '#ca8a04', label: '양호' },
  C: { chip: 'text-orange-700 bg-orange-50 border-orange-200', bar: '#ea580c', label: '보통' },
  D: { chip: 'text-red-700 bg-red-50 border-red-200', bar: '#dc2626', label: '미흡' },
};

/**
 * ReadabilityPanel — 이력서 본문 텍스트의 "글 쓰기 품질" 분석.
 * 평균 문장 길이 / 액션 동사 / 정량 성과 / 수동태 비율 기반 0-100 점.
 * Hemingway Editor 영어판 대신 한국 이력서 특화.
 */
export default function ReadabilityPanel({ resume }: Props) {
  const [expanded, setExpanded] = useState(false);
  const m = useMemo(() => analyzeReadability(resume), [resume]);
  const style = GRADE_COLORS[m.grade] ?? GRADE_COLORS.D;

  return (
    <div className="imp-card bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 no-print">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 rounded-[var(--radius-sm)]"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span aria-hidden="true" className="text-base">
            📝
          </span>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 shrink-0">
            가독성 분석
          </h3>
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${style.chip} shrink-0`}
          >
            {m.grade}등급 · {style.label}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {m.score}점 · 문장 {m.sentenceCount}개 · 평균 {m.avgSentenceLength} 어절
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4 animate-in fade-in-0 duration-200">
          {/* 4개 메트릭 카드 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <MetricCard
              label="평균 문장"
              value={`${m.avgSentenceLength}`}
              unit="어절"
              ok={m.avgSentenceLength >= 8 && m.avgSentenceLength <= 22}
              hint="12-20 권장"
            />
            <MetricCard
              label="액션 동사"
              value={`${m.actionVerbCount}`}
              unit={`/${m.sentenceCount} 문장`}
              ok={m.sentenceCount > 0 && m.actionVerbCount / m.sentenceCount > 0.3}
              hint="30% 이상 권장"
            />
            <MetricCard
              label="정량 성과"
              value={`${m.quantifiedCount}`}
              unit={`/${m.sentenceCount} 문장`}
              ok={m.sentenceCount > 0 && m.quantifiedCount / m.sentenceCount > 0.2}
              hint="숫자로 증명"
            />
            <MetricCard
              label="수동 표현"
              value={`${m.passiveCount}`}
              unit={`/${m.sentenceCount} 문장`}
              ok={m.sentenceCount === 0 || m.passiveCount / m.sentenceCount < 0.15}
              hint="주도성 강조"
              inverse
            />
          </div>

          {/* 점수 바 */}
          <div className="bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${m.score}%`, backgroundColor: style.bar }}
            />
          </div>

          {/* 개선 제안 */}
          <div className="space-y-2">
            {m.suggestions.map((s, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 text-xs rounded-lg px-3 py-2 ${
                  s.severity === 'error'
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    : s.severity === 'warning'
                      ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                      : 'bg-slate-50 dark:bg-slate-700/30 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="font-semibold uppercase text-[9px] tracking-wider mt-0.5 shrink-0">
                  {s.section}
                </span>
                <div className="min-w-0">
                  <p className="font-medium">{s.message}</p>
                  {s.example && <p className="text-[10px] mt-1 opacity-80">💡 {s.example}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* 가장 긴 문장 */}
          {m.longestSentence && m.longestSentence.split(/\s+/).length > 25 && (
            <details className="text-xs text-slate-600 dark:text-slate-400">
              <summary className="cursor-pointer font-medium">가장 긴 문장 보기</summary>
              <p className="mt-2 pl-3 border-l-2 border-amber-300 italic">"{m.longestSentence}"</p>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
  ok,
  hint,
  inverse,
}: {
  label: string;
  value: string;
  unit: string;
  ok: boolean;
  hint: string;
  inverse?: boolean;
}) {
  // inverse=true 일 땐 ok=true 도 같은 색상 — passive 는 낮을수록 좋음.
  const good = inverse ? ok : ok;
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        good
          ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
          : 'bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-700'
      }`}
    >
      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span
          className={`text-lg font-bold ${
            good ? 'text-green-700 dark:text-green-400' : 'text-slate-700 dark:text-slate-300'
          }`}
        >
          {value}
        </span>
        <span className="text-[10px] text-slate-400">{unit}</span>
      </div>
      <div className="text-[9px] text-slate-400 mt-0.5">{hint}</div>
    </div>
  );
}
