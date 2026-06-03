import { useMemo } from 'react';
import { analyzeJdCompetitiveLandscape, type Intensity } from '@/lib/jdCompetitiveLandscape';
import { tx } from '@/lib/i18n';

interface Props {
  text: string;
  minLength?: number;
  className?: string;
}

// intensity → 톤. high=주의(amber), medium=중립(slate), low=유리(emerald). purple 금지.
const TONE: Record<Intensity, string> = {
  high: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/40',
  medium:
    'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/40',
  unknown:
    'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
};

function Stat({ label, value }: { label: string; value: Intensity }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full border ${TONE[value]}`}>
        {tx(`resumeAnalysis.jdLandscape.intensity.${value}`)}
      </span>
    </div>
  );
}

/**
 * 채용공고 경쟁 환경 패널 — 지원 전 경쟁 강도·기술 장벽·암묵적 근무 난제를 한눈에.
 * analyzeJdCompetitiveLandscape 결과를 시각화.
 */
export default function JdCompetitiveLandscapePanel({
  text,
  minLength = 60,
  className = '',
}: Props) {
  const r = useMemo(() => analyzeJdCompetitiveLandscape(text), [text]);

  if (!text || text.trim().length < minLength || r.competitionIntensity === 'unknown') return null;

  const titleId = 'jd-competitive-title';
  return (
    <section
      className={`mt-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 p-3 ${className}`}
      aria-labelledby={titleId}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 id={titleId} className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">
          <span aria-hidden="true">🧭 </span>
          {tx('resumeAnalysis.jdLandscape.title')}
        </h3>
        <div className="flex items-center gap-3">
          <Stat
            label={tx('resumeAnalysis.jdLandscape.competition')}
            value={r.competitionIntensity}
          />
          <Stat label={tx('resumeAnalysis.jdLandscape.barrier')} value={r.technicalBarrier} />
        </div>
      </div>

      {r.demandedExperience.length > 0 && (
        <div
          className="flex flex-wrap gap-1 mb-2"
          aria-label={tx('resumeAnalysis.jdLandscape.demandedAria')}
        >
          {r.demandedExperience.map((d, i) => (
            <span
              key={i}
              className="px-1.5 py-0.5 text-[10px] rounded-md bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/40"
            >
              {d}
            </span>
          ))}
        </div>
      )}

      {r.implicitChallenges.length > 0 && (
        <ul className="space-y-1.5 mb-2">
          {r.implicitChallenges.map((c, i) => (
            <li
              key={i}
              className="rounded-md bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 px-2 py-1.5"
            >
              <p className="text-[11px] font-medium text-slate-700 dark:text-slate-200">
                {c.challenge}
                <span className="ml-1 font-normal text-[9.5px] text-slate-400 dark:text-slate-500">
                  “{c.evidence}”
                </span>
              </p>
              <p className="text-[10.5px] leading-snug text-slate-500 dark:text-slate-400">
                {c.implication}
              </p>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[10.5px] leading-snug text-slate-500 dark:text-slate-400">
        <span aria-hidden="true">💡 </span>
        {r.fitmentSuggestion}
      </p>
    </section>
  );
}
