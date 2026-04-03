import { useState } from 'react';
import type { Resume } from '@/types/resume';

interface Props {
  resume: Resume;
}

interface SalaryRange {
  min: number;
  avg: number;
  max: number;
  percentile: number;
}

function estimateSalary(resume: Resume): SalaryRange {
  const expYears = resume.experiences.length;
  const skillCount = resume.skills.reduce((sum, s) => sum + s.items.split(',').length, 0);
  const hasDegree = resume.educations.some(e => e.degree.includes('석사') || e.degree.includes('박사'));
  const certCount = resume.certifications.length;
  const langCount = resume.languages.length;

  // Base salary (만원 단위)
  let base = 3000;

  // Experience multiplier
  base += expYears * 800;

  // Skill bonus
  base += Math.min(skillCount * 100, 1500);

  // Degree bonus
  if (hasDegree) base += 500;

  // Cert/Lang bonus
  base += certCount * 100 + langCount * 50;

  // Cap at realistic range
  base = Math.min(base, 15000);

  const min = Math.round(base * 0.8 / 100) * 100;
  const avg = Math.round(base / 100) * 100;
  const max = Math.round(base * 1.3 / 100) * 100;

  const percentile = Math.min(95, Math.max(20, 30 + expYears * 10 + skillCount * 2));

  return { min, avg, max, percentile };
}

export default function SalaryEstimate({ resume }: Props) {
  const [expanded, setExpanded] = useState(false);
  const salary = estimateSalary(resume);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 no-print">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">💰 예상 연봉</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-green-600">{(salary.avg / 10000).toFixed(0)}만원</span>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 animate-fade-in">
          {/* Range bar */}
          <div className="relative h-8 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
            <div className="absolute inset-y-0 bg-gradient-to-r from-blue-200 to-green-200 dark:from-blue-900/30 dark:to-green-900/30 rounded-lg"
              style={{ left: '10%', right: '10%' }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow"
              style={{ left: `${Math.min(90, Math.max(10, salary.percentile))}%` }} />
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>{(salary.min / 10000).toFixed(0)}만</span>
            <span className="font-medium text-green-600">{(salary.avg / 10000).toFixed(0)}만 (예상)</span>
            <span>{(salary.max / 10000).toFixed(0)}만</span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            경력 {resume.experiences.length}년차 기준 상위 {100 - salary.percentile}% 수준
          </p>

          <p className="text-xs text-slate-400 dark:text-slate-500 text-center italic">
            * AI 추정치이며 실제 연봉과 다를 수 있습니다
          </p>
        </div>
      )}
    </div>
  );
}
