import type { Resume } from '@/types/resume';

interface Props {
  resume: Resume;
}

export default function CareerTimeline({ resume }: Props) {
  const items = [
    ...resume.experiences.map(e => ({
      type: 'experience' as const,
      title: e.company,
      subtitle: e.position,
      start: e.startDate,
      end: e.current ? '현재' : e.endDate,
      color: 'blue',
    })),
    ...resume.educations.map(e => ({
      type: 'education' as const,
      title: e.school,
      subtitle: `${e.degree} ${e.field}`,
      start: e.startDate,
      end: e.endDate,
      color: 'green',
    })),
  ].sort((a, b) => (b.start || '').localeCompare(a.start || ''));

  if (items.length === 0) return null;

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 no-print">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">경력 타임라인</h3>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-600" />

        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="flex gap-3 relative">
              <div className={`w-3.5 h-3.5 rounded-full ${colorMap[item.color]} shrink-0 mt-0.5 ring-2 ring-white dark:ring-slate-800 z-10`} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
                  <div>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.title}</span>
                    {item.subtitle && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">{item.subtitle}</span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums shrink-0">
                    {item.start} — {item.end}
                  </span>
                </div>
                <span className={`inline-block mt-1 text-xs px-1.5 py-0.5 rounded ${
                  item.type === 'experience' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                }`}>
                  {item.type === 'experience' ? '경력' : '학력'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> 경력</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> 학력</span>
      </div>
    </div>
  );
}
