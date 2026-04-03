import { useEffect, useState } from 'react';
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

/** Circular color based on percentage (원티드-style color grades) */
function getRingColor(pct: number): string {
  if (pct < 30) return '#ef4444';   // red
  if (pct < 60) return '#f97316';   // orange
  if (pct < 80) return '#22c55e';   // green
  return '#3b82f6';                  // blue
}

/** Specific improvement suggestions with point values */
function getMissingSuggestions(resume: Resume): { text: string; points: number }[] {
  const suggestions: { text: string; points: number }[] = [];
  const pi = resume.personalInfo;

  if (!pi.name) suggestions.push({ text: '이름 추가하면', points: 6 });
  if (!pi.email) suggestions.push({ text: '이메일 추가하면', points: 5 });
  if (!pi.summary || pi.summary.replace(/<[^>]*>/g, '').length <= 30)
    suggestions.push({ text: '자기소개 작성하면', points: 8 });
  if (!pi.photo) suggestions.push({ text: '프로필 사진 추가하면', points: 2 });
  if (!pi.website && !pi.github)
    suggestions.push({ text: '웹사이트/GitHub 추가하면', points: 3 });

  if (resume.experiences.length === 0)
    suggestions.push({ text: '경력 추가하면', points: 15 });
  else if (resume.experiences.length < 2)
    suggestions.push({ text: '경력 1개 더 추가하면', points: 5 });

  if (resume.skills.length === 0)
    suggestions.push({ text: '기술 스택 추가하면', points: 10 });
  else if (resume.skills.length < 2)
    suggestions.push({ text: '기술 카테고리 추가하면', points: 4 });

  if (resume.educations.length === 0)
    suggestions.push({ text: '학력 추가하면', points: 7 });

  if (resume.projects.length === 0)
    suggestions.push({ text: '프로젝트 추가하면', points: 5 });

  if (resume.certifications.length === 0)
    suggestions.push({ text: '자격증 추가하면', points: 3 });

  if (resume.languages.length === 0)
    suggestions.push({ text: '어학 성적 추가하면', points: 2 });

  if (resume.activities.length === 0)
    suggestions.push({ text: '활동/대외활동 추가하면', points: 3 });

  // Sort by highest point value first, take top 5
  return suggestions.sort((a, b) => b.points - a.points).slice(0, 5);
}

/** SVG circular progress ring */
function ProgressRing({ percentage, size = 100, strokeWidth = 8 }: { percentage: number; size?: number; strokeWidth?: number }) {
  const [animatedPct, setAnimatedPct] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPct / 100) * circumference;
  const color = getRingColor(percentage);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPct(percentage), 50);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100 dark:text-slate-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.3s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{percentage}%</span>
      </div>
    </div>
  );
}

export default function CompletenessBar({ resume, compact }: Props) {
  const result = calculateCompleteness(resume);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
          <div className={`${barColors[result.grade]} rounded-full h-1.5 transition-all`} style={{ width: `${result.percentage}%` }} />
        </div>
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${gradeColors[result.grade]}`}>{result.percentage}%</span>
      </div>
    );
  }

  const suggestions = getMissingSuggestions(resume);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">이력서 완성도</h3>
        <span className={`text-lg font-bold px-2 py-0.5 rounded ${gradeColors[result.grade]}`}>{result.grade}</span>
      </div>

      {/* Circular progress ring */}
      <div className="flex justify-center mb-4">
        <ProgressRing percentage={result.percentage} size={120} strokeWidth={10} />
      </div>

      {/* Section scores */}
      <div className="space-y-2 mb-4">
        {result.sections.map(s => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 w-28 shrink-0">{s.label}</span>
            <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
              <div className="bg-blue-400 rounded-full h-1.5 transition-all duration-500" style={{ width: `${Math.round((s.score / s.maxScore) * 100)}%` }} />
            </div>
            <span className="text-slate-400 dark:text-slate-500 w-10 text-right">{s.score}/{s.maxScore}</span>
          </div>
        ))}
      </div>

      {/* Missing section suggestions with point values */}
      {suggestions.length > 0 && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">완성도를 높이려면</p>
          <ul className="space-y-1.5">
            {suggestions.map((s, i) => (
              <li key={i} className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">{s.text}</span>
                <span
                  className="font-semibold px-2 py-0.5 rounded-full text-[10px]"
                  style={{ color: getRingColor(result.percentage + s.points), backgroundColor: `${getRingColor(result.percentage + s.points)}15` }}
                >
                  +{s.points}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Original tips */}
      {result.tips.length > 0 && suggestions.length === 0 && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">완성도를 높이려면</p>
          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
            {result.tips.map((tip, i) => <li key={i}>- {tip}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
