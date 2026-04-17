import { useState, useEffect, useRef } from 'react';
import type { Resume } from '@/types/resume';
import { calculateCompleteness } from '@/lib/completeness';
import { analyzeAtsCompatibility } from '@/lib/ats';

interface Props {
  resume: Resume;
}

/** Animated number counter hook */
function useAnimatedCounter(target: number, duration = 800): number {
  const [value, setValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}

/** Large SVG score circle for the overall score */
function ScoreCircle({ score, size = 140, strokeWidth = 12 }: { score: number; size?: number; strokeWidth?: number }) {
  const animatedScore = useAnimatedCounter(score, 1000);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (score / 100) * circumference);
    }, 100);
    return () => clearTimeout(timer);
  }, [score, circumference]);

  const getScoreColor = (s: number) => {
    if (s >= 80) return '#3b82f6';
    if (s >= 60) return '#22c55e';
    if (s >= 40) return '#f97316';
    return '#ef4444';
  };

  const color = getScoreColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="currentColor" strokeWidth={strokeWidth}
          className="text-slate-100 dark:text-slate-700"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">{animatedScore}</span>
        <span className="text-xs text-slate-400 dark:text-slate-500 -mt-1">/ 100</span>
      </div>
    </div>
  );
}

/** Category mini bar */
function CategoryBar({ label, score, color }: { label: string; score: number; color: string }) {
  const animatedScore = useAnimatedCounter(score, 900);
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setBarWidth(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-500 dark:text-slate-400 w-20 shrink-0">{label}</span>
      <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
        <div
          className="rounded-full h-2.5"
          style={{
            width: `${barWidth}%`,
            backgroundColor: color,
            transition: 'width 0.9s ease-out',
          }}
        />
      </div>
      <span className="text-xs font-bold w-8 text-right" style={{ color }}>{animatedScore}</span>
    </div>
  );
}

export default function ResumeScoreboard({ resume }: Props) {
  const [expanded, setExpanded] = useState(false);

  const completeness = calculateCompleteness(resume);
  const ats = analyzeAtsCompatibility(resume);

  // Calculate various scores
  const expYears = resume.experiences.length;
  const skillCount = resume.skills.reduce((sum, s) => sum + s.items.split(',').length, 0);
  const projectCount = resume.projects.length;
  const certCount = resume.certifications.length;
  const hasPhoto = !!resume.personalInfo.photo;
  const hasSummary = !!(resume.personalInfo.summary && resume.personalInfo.summary.replace(/<[^>]*>/g, '').length > 30);

  // Category scores (0-100 each)
  const scores = {
    completeness: completeness.percentage,
    keyword: Math.min(100, skillCount * 8 + (resume.experiences.some(e => e.techStack) ? 20 : 0) + (resume.experiences.some(e => e.achievements) ? 15 : 0)),
    readability: Math.min(100,
      (hasSummary ? 25 : 0) +
      (resume.experiences.some(e => e.description && e.description.replace(/<[^>]*>/g, '').length > 50) ? 25 : 0) +
      (resume.educations.length > 0 ? 15 : 0) +
      (projectCount > 0 ? 15 : 0) +
      (hasPhoto ? 10 : 0) +
      Math.min(10, expYears * 3)
    ),
    atsCompat: ats.score,
  };

  const overallScore = Math.round(
    scores.completeness * 0.3 +
    scores.keyword * 0.25 +
    scores.readability * 0.2 +
    scores.atsCompat * 0.25
  );

  // Percentile estimation
  const getPercentile = (score: number): number => {
    if (score >= 90) return 5;
    if (score >= 80) return 12;
    if (score >= 70) return 25;
    if (score >= 60) return 40;
    if (score >= 50) return 55;
    if (score >= 40) return 70;
    return 85;
  };

  const percentile = getPercentile(overallScore);

  const categories = [
    { label: '완성도', score: scores.completeness, color: '#22c55e' },
    { label: '키워드', score: scores.keyword, color: '#8b5cf6' },
    { label: '가독성', score: scores.readability, color: '#f59e0b' },
    { label: 'ATS호환성', score: scores.atsCompat, color: '#3b82f6' },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 no-print">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">이력서 경쟁력</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-blue-600">{overallScore}점</span>
          <span className="text-xs text-slate-400">상위 {percentile}%</span>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="mt-4 space-y-5 animate-fade-in">
          {/* Overall score circle */}
          <div className="flex flex-col items-center">
            <ScoreCircle score={overallScore} />
            <div className="mt-3 px-4 py-1.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: overallScore >= 70 ? '#dbeafe' : overallScore >= 50 ? '#fef9c3' : '#fee2e2',
                color: overallScore >= 70 ? '#1d4ed8' : overallScore >= 50 ? '#a16207' : '#dc2626',
              }}
            >
              같은 분야 구직자 중 <strong>상위 {percentile}%</strong>에 해당합니다
            </div>
          </div>

          {/* Category breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">카테고리별 점수</h4>
            {categories.map(c => (
              <CategoryBar key={c.label} label={c.label} score={c.score} color={c.color} />
            ))}
          </div>

          {/* Tips */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-1.5">경쟁력 높이기</p>
            {scores.keyword < 50 && <p>- 기술 키워드를 더 추가하면 ATS 매칭률이 높아집니다</p>}
            {scores.readability < 60 && <p>- 경력과 프로젝트 설명을 더 상세하게 작성하세요</p>}
            {!hasPhoto && <p>- 프로필 사진을 추가하면 신뢰도가 높아집니다</p>}
            {!hasSummary && <p>- 자기소개를 30자 이상 작성하세요</p>}
            {skillCount < 5 && <p>- 기술 스택을 5개 이상 추가하세요</p>}
            {certCount === 0 && <p>- 자격증을 추가하면 경쟁력이 높아집니다</p>}
            {overallScore >= 80 && <p>- 훌륭합니다! AI 코칭으로 더 다듬어보세요</p>}
          </div>
        </div>
      )}
    </div>
  );
}
