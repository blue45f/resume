import { useState } from 'react';
import type { Resume } from '@/types/resume';

interface CareerPath {
  title: string;
  match: number;
  requiredSkills: string[];
  currentSkills: string[];
  missingSkills: string[];
  avgSalary: string;
}

function analyzeCareerPaths(resume: Resume): CareerPath[] {
  const currentSkills = new Set(
    resume.skills.flatMap(s => s.items.split(',').map(i => i.trim().toLowerCase()))
  );

  const paths: { title: string; skills: string[]; salary: string }[] = [
    { title: '시니어 프론트엔드', skills: ['react', 'typescript', 'next.js', 'graphql', 'testing'], salary: '7,000~10,000만원' },
    { title: '풀스택 개발자', skills: ['react', 'node.js', 'typescript', 'postgresql', 'docker'], salary: '6,000~9,000만원' },
    { title: '프론트엔드 리드', skills: ['react', 'typescript', 'architecture', 'mentoring', 'ci/cd'], salary: '8,000~12,000만원' },
    { title: 'DevOps 엔지니어', skills: ['docker', 'kubernetes', 'aws', 'terraform', 'ci/cd'], salary: '7,000~11,000만원' },
    { title: 'PM/PO', skills: ['agile', 'jira', 'sql', 'analytics', 'ux'], salary: '6,000~10,000만원' },
    { title: 'AI/ML 엔지니어', skills: ['python', 'tensorflow', 'pytorch', 'sql', 'docker'], salary: '7,000~12,000만원' },
    { title: 'UX 디자이너', skills: ['figma', 'sketch', 'user research', 'prototyping', 'a/b testing'], salary: '5,000~8,000만원' },
    { title: '데이터 엔지니어', skills: ['python', 'sql', 'spark', 'airflow', 'aws'], salary: '6,000~10,000만원' },
  ];

  return paths.map(p => {
    const matched = p.skills.filter(s => currentSkills.has(s));
    const missing = p.skills.filter(s => !currentSkills.has(s));
    return {
      title: p.title,
      match: Math.round((matched.length / p.skills.length) * 100),
      requiredSkills: p.skills,
      currentSkills: matched,
      missingSkills: missing,
      avgSalary: p.salary,
    };
  }).filter(p => p.match >= 20).sort((a, b) => b.match - a.match).slice(0, 4);
}

interface Props {
  resume: Resume;
}

export default function CareerPathSuggestion({ resume }: Props) {
  const [expanded, setExpanded] = useState(false);
  const paths = analyzeCareerPaths(resume);

  if (paths.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 no-print">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">추천 커리어 패스</h3>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 animate-fade-in">
          {paths.map(p => (
            <div key={p.title} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{p.title}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{p.avgSalary}</span>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                    p.match >= 80 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                    p.match >= 50 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                    'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                  }`}>{p.match}%</span>
                </div>
              </div>
              <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mb-2">
                <div className={`h-1.5 rounded-full transition-all ${p.match >= 80 ? 'bg-green-500' : p.match >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${p.match}%` }} />
              </div>
              <div className="flex flex-wrap gap-1">
                {p.currentSkills.map(s => (
                  <span key={s} className="px-1.5 py-0.5 text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded">{s}</span>
                ))}
                {p.missingSkills.map(s => (
                  <span key={s} className="px-1.5 py-0.5 text-xs bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded">+ {s}</span>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center">현재 기술 스택 기반 AI 추천</p>
        </div>
      )}
    </div>
  );
}
