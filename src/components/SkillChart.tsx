import type { Resume } from '@/types/resume';

interface Props {
  resume: Resume;
}

export default function SkillChart({ resume }: Props) {
  const skills = resume.skills;
  if (skills.length === 0) return null;

  const data = skills.map(s => ({
    category: s.category,
    count: s.items.split(',').map(i => i.trim()).filter(Boolean).length,
    items: s.items,
  }));

  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 no-print">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">기술 분포</h3>
      <div className="space-y-2.5">
        {data.map(d => (
          <div key={d.category}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{d.category}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500">{d.count}개</span>
            </div>
            <div className="bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${(d.count / maxCount) * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{d.items}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
