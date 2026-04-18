import { memo, useEffect, useState } from 'react';
import type { Resume } from '@/types/resume';
import { calculateCompleteness } from '@/lib/completeness';

interface Props {
  resume: Resume;
  compact?: boolean;
}

const gradeColors: Record<string, string> = {
  S: 'text-sky-600 bg-sky-100',
  A: 'text-blue-600 bg-blue-100',
  B: 'text-green-600 bg-green-100',
  C: 'text-amber-600 bg-amber-100',
  D: 'text-red-600 bg-red-100',
};

const barColors: Record<string, string> = {
  S: 'bg-sky-500',
  A: 'bg-blue-500',
  B: 'bg-green-500',
  C: 'bg-amber-500',
  D: 'bg-red-500',
};

/** Circular color based on percentage */
function getRingColor(pct: number): string {
  if (pct < 30) return '#ef4444';
  if (pct < 60) return '#f97316';
  if (pct < 80) return '#22c55e';
  return '#3b82f6';
}

/** Section-specific actionable tips */
function getSectionTip(label: string, scorePct: number): string | null {
  if (scorePct >= 90) return null;

  const tips: Record<string, { low: string; mid: string }> = {
    인적사항: {
      low: '이름, 이메일, 자기소개를 추가하면 완성도가 크게 올라갑니다',
      mid: '프로필 사진이나 GitHub/포트폴리오 링크를 추가해 보세요',
    },
    경력: {
      low: '경력을 최소 1개 이상 추가하고, 업무 내용을 상세히 작성하세요',
      mid: '성과를 수치화하고 사용 기술 스택을 명시하면 더 강한 인상을 줍니다',
    },
    학력: {
      low: '학력 정보를 추가하세요 (학교, 전공, 학위)',
      mid: '학점이나 관련 활동을 추가하면 차별화됩니다',
    },
    기술: {
      low: '기술 스택을 카테고리별로 3개 이상 추가하세요',
      mid: '기술 카테고리를 세분화하면 전문성이 돋보입니다 (예: Frontend, Backend, DevOps)',
    },
    프로젝트: {
      low: '프로젝트를 1개 이상 추가하고 역할과 성과를 기술하세요',
      mid: '프로젝트 설명에 기술적 도전과 해결 과정을 포함하면 좋습니다',
    },
    '자격/어학/수상/활동': {
      low: '자격증, 어학 성적, 수상 경력, 대외활동 중 해당 항목을 추가하세요',
      mid: '관련 자격증이나 어학 성적을 추가하면 경쟁력이 올라갑니다',
    },
  };

  const sectionTips = tips[label];
  if (!sectionTips) return null;
  return scorePct < 50 ? sectionTips.low : sectionTips.mid;
}

/** Industry benchmark averages (simulated) per section */
const BENCHMARKS: Record<string, number> = {
  인적사항: 72,
  경력: 58,
  학력: 65,
  기술: 55,
  프로젝트: 40,
  '자격/어학/수상/활동': 35,
};

/** Specific improvement suggestions with point values */
function getMissingSuggestions(resume: Resume): { text: string; points: number }[] {
  const suggestions: { text: string; points: number }[] = [];
  const pi = resume.personalInfo;

  if (!pi.name) suggestions.push({ text: '이름 추가하면', points: 6 });
  if (!pi.email) suggestions.push({ text: '이메일 추가하면', points: 5 });
  if (!pi.summary || pi.summary.replace(/<[^>]*>/g, '').length <= 30)
    suggestions.push({ text: '자기소개 작성하면', points: 8 });
  if (!pi.photo) suggestions.push({ text: '프로필 사진 추가하면', points: 2 });
  if (!pi.website && !pi.github) suggestions.push({ text: '웹사이트/GitHub 추가하면', points: 3 });

  if (resume.experiences.length === 0) suggestions.push({ text: '경력 추가하면', points: 15 });
  else if (resume.experiences.length < 2)
    suggestions.push({ text: '경력 1개 더 추가하면', points: 5 });

  if (resume.skills.length === 0) suggestions.push({ text: '기술 스택 추가하면', points: 10 });
  else if (resume.skills.length < 2)
    suggestions.push({ text: '기술 카테고리 추가하면', points: 4 });

  if (resume.educations.length === 0) suggestions.push({ text: '학력 추가하면', points: 7 });

  if (resume.projects.length === 0) suggestions.push({ text: '프로젝트 추가하면', points: 5 });

  if (resume.certifications.length === 0) suggestions.push({ text: '자격증 추가하면', points: 3 });

  if (resume.languages.length === 0) suggestions.push({ text: '어학 성적 추가하면', points: 2 });

  if (resume.activities.length === 0)
    suggestions.push({ text: '활동/대외활동 추가하면', points: 3 });

  return suggestions.sort((a, b) => b.points - a.points).slice(0, 5);
}

/** SVG circular progress ring */
function ProgressRing({
  percentage,
  size = 100,
  strokeWidth = 8,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}) {
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
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100 dark:text-slate-700"
        />
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

/** Animated horizontal bar for section scores */
function SectionBar({ scorePct, color }: { scorePct: number; color: string }) {
  const [animatedWidth, setAnimatedWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedWidth(scorePct), 80);
    return () => clearTimeout(timer);
  }, [scorePct]);

  return (
    <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
      <div
        className="rounded-full h-2 transition-all duration-700 ease-out"
        style={{ width: `${animatedWidth}%`, backgroundColor: color }}
      />
    </div>
  );
}

/** Benchmark comparison badge */
function BenchmarkBadge({ scorePct, benchmark }: { scorePct: number; benchmark: number }) {
  const diff = scorePct - benchmark;
  if (diff === 0) return <span className="text-[10px] text-slate-400">평균</span>;

  const isPositive = diff > 0;
  return (
    <span
      className={`text-[10px] font-semibold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}
    >
      평균 대비 {isPositive ? '+' : ''}
      {diff}%
    </span>
  );
}

function CompletenessBar({ resume, compact }: Props) {
  const result = calculateCompleteness(resume);
  const [showDetails, setShowDetails] = useState(true);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
          <div
            className={`${barColors[result.grade]} rounded-full h-1.5 transition-all`}
            style={{ width: `${result.percentage}%` }}
          />
        </div>
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${gradeColors[result.grade]}`}>
          {result.percentage}%
        </span>
      </div>
    );
  }

  const suggestions = getMissingSuggestions(resume);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">이력서 완성도</h3>
        <span className={`text-lg font-bold px-2 py-0.5 rounded ${gradeColors[result.grade]}`}>
          {result.grade}
        </span>
      </div>

      {/* Circular progress ring */}
      <div className="flex justify-center mb-4">
        <ProgressRing percentage={result.percentage} size={120} strokeWidth={10} />
      </div>

      {/* Detail toggle */}
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors mb-2"
      >
        <span>섹션별 상세 분석</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Section-by-section scores with benchmarks and tips */}
      {showDetails && (
        <div className="space-y-3 mb-4">
          {result.sections.map((s) => {
            const scorePct = Math.round((s.score / s.maxScore) * 100);
            const benchmark = BENCHMARKS[s.label] ?? 50;
            const sectionColor = getRingColor(scorePct);
            const tip = getSectionTip(s.label, scorePct);

            return (
              <div key={s.label} className="group">
                {/* Section header with score and benchmark */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {s.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <BenchmarkBadge scorePct={scorePct} benchmark={benchmark} />
                    <span
                      className="text-xs font-bold px-1.5 py-0.5 rounded-md"
                      style={{ color: sectionColor, backgroundColor: `${sectionColor}15` }}
                    >
                      {s.score}/{s.maxScore}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-2">
                  <SectionBar scorePct={scorePct} color={sectionColor} />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 w-8 text-right tabular-nums">
                    {scorePct}%
                  </span>
                </div>

                {/* Actionable tip */}
                {tip && (
                  <div className="mt-1 flex items-start gap-1.5">
                    <svg
                      className="w-3 h-3 text-amber-500 mt-0.5 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
                      />
                    </svg>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-snug">
                      {tip}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Overall benchmark comparison */}
      {showDetails && (
        <div className="px-3 py-2.5 mb-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <svg
                className="w-4 h-4 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                />
              </svg>
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                업계 평균 대비
              </span>
            </div>
            <span
              className={`text-sm font-bold ${result.percentage >= 54 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}
            >
              {result.percentage >= 54 ? '+' : ''}
              {result.percentage - 54}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {result.percentage >= 80
              ? '상위 10% 수준의 이력서입니다. 훌륭합니다!'
              : result.percentage >= 60
                ? '평균 이상입니다. 몇 가지 보완하면 상위권에 진입할 수 있습니다.'
                : '아직 개선의 여지가 많습니다. 위 팁을 참고해 보세요.'}
          </p>
        </div>
      )}

      {/* Missing section suggestions with point values */}
      {suggestions.length > 0 && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
            완성도를 높이려면
          </p>
          <ul className="space-y-1.5">
            {suggestions.map((s, i) => (
              <li key={i} className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">{s.text}</span>
                <span
                  className="font-semibold px-2 py-0.5 rounded-full text-[10px]"
                  style={{
                    color: getRingColor(result.percentage + s.points),
                    backgroundColor: `${getRingColor(result.percentage + s.points)}15`,
                  }}
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
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">
            완성도를 높이려면
          </p>
          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
            {result.tips.map((tip, i) => (
              <li key={i}>- {tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default memo(CompletenessBar);
