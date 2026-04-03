import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '@/lib/config';


interface TrendItem {
  position: string;
  company: string;
  salary: string;
  skills: string;
}

export default function HiringTrends() {
  const [jobs, setJobs] = useState<TrendItem[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/jobs?limit=5`)
      .then(r => r.ok ? r.json() : [])
      .then((data: any[]) => setJobs(data.slice(0, 5).map(j => ({
        position: j.position,
        company: j.company,
        salary: j.salary,
        skills: j.skills,
      }))))
      .catch(() => {});
  }, []);

  if (jobs.length === 0) return null;

  // Extract trending skills
  const skillCounts: Record<string, number> = {};
  jobs.forEach(j => {
    j.skills?.split(',').forEach(s => {
      const key = s.trim().toLowerCase();
      if (key) skillCounts[key] = (skillCounts[key] || 0) + 1;
    });
  });
  const trendingSkills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-4 no-print">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{'\u{1F4C8} \uCC44\uC6A9 \uD2B8\uB80C\uB4DC'}</h3>
        <Link to="/jobs" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">{'\uC804\uCCB4 \uBCF4\uAE30'}</Link>
      </div>

      {/* Trending skills */}
      <div className="mb-3">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">{'\uC778\uAE30 \uAE30\uC220'}</p>
        <div className="flex flex-wrap gap-1">
          {trendingSkills.map(([skill, count]) => (
            <span key={skill} className="px-2 py-0.5 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full">
              {skill} ({count})
            </span>
          ))}
        </div>
      </div>

      {/* Recent positions */}
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">{'\uCD5C\uADFC \uACF5\uACE0'}</p>
        <div className="space-y-1.5">
          {jobs.slice(0, 3).map((j, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-slate-700 dark:text-slate-300 truncate">{j.company} · {j.position}</span>
              {j.salary && <span className="text-slate-400 shrink-0 ml-2">{j.salary}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
