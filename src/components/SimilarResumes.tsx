import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Resume } from '@/types/resume';
import { API_URL } from '@/lib/config';


interface Props {
  resume: Resume;
}

export default function SimilarResumes({ resume }: Props) {
  const [similar, setSimilar] = useState<any[]>([]);

  useEffect(() => {
    const topSkills = resume.skills.flatMap(s => s.items.split(',').map(i => i.trim())).slice(0, 3);
    if (topSkills.length === 0) return;

    const query = topSkills[0];
    fetch(`${API_URL}/api/resumes/public?q=${encodeURIComponent(query)}&limit=5`)
      .then(r => r.ok ? r.json() : { data: [] })
      .then(d => {
        const others = (d.data || []).filter((r: any) => r.id !== resume.id);
        setSimilar(others.slice(0, 3));
      })
      .catch(() => {});
  }, [resume.id, resume.skills]);

  if (similar.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 no-print">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">비슷한 이력서</h3>
      <div className="space-y-2">
        {similar.map(r => (
          <Link
            key={r.id}
            to={`/resumes/${r.id}/preview`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
              {r.personalInfo?.name?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{r.title || '제목 없음'}</p>
              <p className="text-xs text-slate-400 truncate">{r.personalInfo?.name}</p>
            </div>
            {r.viewCount > 0 && (
              <span className="text-xs text-slate-400 shrink-0">{r.viewCount} 조회</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
