import { useMemo } from 'react';
import { analyzeCoverLetterJdResonance, type ResonanceTone } from '@/lib/coverLetterJdResonance';
import { tx } from '@/lib/i18n';

interface Props {
  coverLetter: string;
  jd: string;
  className?: string;
}

const TONE_RING: Record<ResonanceTone, string> = {
  good: 'text-emerald-600 dark:text-emerald-400',
  neutral: 'text-amber-600 dark:text-amber-400',
  warning: 'text-rose-600 dark:text-rose-400',
};

/**
 * 자소서 ↔ 채용공고 가치 정합성 패널 — 공고가 강조한 가치·문화 테마를 자소서가
 * 얼마나 반영하는지, 어떤 가치가 빠졌는지 보여준다.
 */
export default function CoverLetterJdResonancePanel({ coverLetter, jd, className = '' }: Props) {
  const report = useMemo(() => analyzeCoverLetterJdResonance(coverLetter, jd), [coverLetter, jd]);

  if (
    !jd ||
    jd.trim().length < 40 ||
    !coverLetter ||
    coverLetter.trim().length < 50 ||
    report.themes.length === 0
  ) {
    return null;
  }

  const titleId = 'cl-resonance-title';
  return (
    <section
      className={`rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 p-3 ${className}`}
      aria-labelledby={titleId}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 id={titleId} className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">
          <span aria-hidden="true">🎯 </span>
          {tx('resumeAnalysis.clResonance.title')}
        </h3>
        <span
          className={`text-[13px] font-bold tabular-nums ${TONE_RING[report.tone]}`}
          aria-label={`가치 정합성 점수 ${report.resonanceScore}점`}
        >
          {report.resonanceScore}
          <span className="text-[10px] font-normal text-slate-400">/100</span>
        </span>
      </div>

      {report.resonantLabels.length > 0 && (
        <div className="mb-1.5">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">
            {tx('resumeAnalysis.clResonance.reflected')} ✓
          </p>
          <div className="flex flex-wrap gap-1">
            {report.resonantLabels.map((label) => (
              <span
                key={label}
                className="px-1.5 py-0.5 text-[10px] rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/40"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {report.missingLabels.length > 0 && (
        <div className="mb-1.5">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">
            {tx('resumeAnalysis.clResonance.missing')}
          </p>
          <div className="flex flex-wrap gap-1">
            {report.missingLabels.map((label) => (
              <span
                key={label}
                className="px-1.5 py-0.5 text-[10px] rounded-md bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/40"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10.5px] leading-snug text-slate-500 dark:text-slate-400">
        <span aria-hidden="true">💡 </span>
        {report.suggestion}
      </p>
    </section>
  );
}
