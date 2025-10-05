import type { Resume } from '@/types/resume';
import { calculateCompleteness } from '@/lib/completeness';

interface Props {
  resume: Resume;
  compact?: boolean;
}

const gradeColors: Record<string, string> = {
  S: 'text-purple-600 bg-purple-100',
  A: 'text-blue-600 bg-blue-100',
  B: 'text-green-600 bg-green-100',
  C: 'text-amber-600 bg-amber-100',
  D: 'text-red-600 bg-red-100',
};

const barColors: Record<string, string> = {
  S: 'bg-purple-500',
  A: 'bg-blue-500',
  B: 'bg-green-500',
  C: 'bg-amber-500',
  D: 'bg-red-500',
};

export default function CompletenessBar({ resume, compact }: Props) {
  const result = calculateCompleteness(resume);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-slate-100 rounded-full h-1.5">
          <div className={`${barColors[result.grade]} rounded-full h-1.5 transition-all`} style={{ width: `${result.percentage}%` }} />
        </div>
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${gradeColors[result.grade]}`}>{result.percentage}%</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800">이력서 완성도</h3>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold px-2 py-0.5 rounded ${gradeColors[result.grade]}`}>{result.grade}</span>
          <span className="text-2xl font-bold text-slate-900">{result.percentage}%</span>
        </div>
      </div>

      {/* Overall bar */}
      <div className="bg-slate-100 rounded-full h-3 mb-4">
        <div className={`${barColors[result.grade]} rounded-full h-3 transition-all duration-500`} style={{ width: `${result.percentage}%` }} />
      </div>

      {/* Section scores */}
      <div className="space-y-2 mb-4">
        {result.sections.map(s => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 w-28 shrink-0">{s.label}</span>
            <div className="flex-1 bg-slate-100 rounded-full h-1.5">
              <div className="bg-blue-400 rounded-full h-1.5" style={{ width: `${Math.round((s.score / s.maxScore) * 100)}%` }} />
            </div>
            <span className="text-slate-400 w-10 text-right">{s.score}/{s.maxScore}</span>
          </div>
        ))}
      </div>

      {/* Tips */}
      {result.tips.length > 0 && (
        <div className="pt-3 border-t border-slate-100">
          <p className="text-xs font-medium text-amber-700 mb-1">💡 완성도를 높이려면</p>
          <ul className="text-xs text-slate-500 space-y-0.5">
            {result.tips.map((tip, i) => <li key={i}>• {tip}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
