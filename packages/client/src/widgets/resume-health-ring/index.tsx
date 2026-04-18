import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ResumeSummary } from '@/types/resume';

/**
 * ResumeHealthRing — 내 이력서 평균 완성도 원형 링.
 * SVG stroke-dashoffset 기반 애니메이션으로 평균 완성도 표시.
 * ResumeSummary(personalInfo + skills + tags + updatedAt 등)로 근사 점수 산정.
 *
 * 점수 요소 (0~100):
 *  - personalInfo.name/email/phone/summary 유무 (각 10)
 *  - skills 카테고리 수 (0→0, 1→10, 2→20, 3+→30)
 *  - 공개 설정 (public/link-only→10)
 *  - tags 사용 (1+→10)
 *  - 업데이트 신선도 (<=30d→20, 60d→10, older→0)
 */

interface Props {
  resumes: ResumeSummary[];
}

function scoreResume(r: ResumeSummary): number {
  let s = 0;
  const pi = r.personalInfo;
  if (pi?.name) s += 10;
  if (pi?.email) s += 10;
  if (pi?.phone) s += 10;
  if (pi?.summary && pi.summary.replace(/<[^>]*>/g, '').length >= 30) s += 10;

  const skillCount = r.skills?.length ?? 0;
  if (skillCount >= 3) s += 30;
  else if (skillCount === 2) s += 20;
  else if (skillCount === 1) s += 10;

  if (r.visibility === 'public' || r.visibility === 'link-only') s += 10;
  if ((r.tags?.length ?? 0) >= 1) s += 10;

  const days = Math.floor((Date.now() - new Date(r.updatedAt).getTime()) / 86400000);
  if (days <= 30) s += 20;
  else if (days <= 60) s += 10;

  return Math.min(100, s);
}

function daysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function ringColor(pct: number): string {
  if (pct < 40) return '#0891b2'; // cyan-600
  if (pct < 70) return '#0284c7'; // sky-600
  return '#2563eb'; // blue-600 (sapphire-family)
}

function gradeLabel(pct: number): { label: string; tone: string } {
  if (pct >= 85) return { label: '완성형', tone: 'text-blue-700 dark:text-blue-300' };
  if (pct >= 65) return { label: '양호', tone: 'text-sky-700 dark:text-sky-300' };
  if (pct >= 40) return { label: '성장 중', tone: 'text-cyan-700 dark:text-cyan-300' };
  return { label: '초안', tone: 'text-slate-600 dark:text-slate-400' };
}

export default function ResumeHealthRing({ resumes }: Props) {
  const stats = useMemo(() => {
    if (!resumes.length) return null;
    const scores = resumes.map(scoreResume);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const latest = resumes.reduce((prev, cur) =>
      new Date(cur.updatedAt).getTime() > new Date(prev.updatedAt).getTime() ? cur : prev,
    );
    const topResume = resumes[scores.indexOf(Math.max(...scores))] ?? resumes[0];
    return { avg, latest, topResume, count: resumes.length };
  }, [resumes]);

  const [animatedPct, setAnimatedPct] = useState(0);
  const targetPct = stats?.avg ?? 0;

  useEffect(() => {
    // honor reduced motion
    const prefersReduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduce) {
      setAnimatedPct(targetPct);
      return;
    }
    const timer = setTimeout(() => setAnimatedPct(targetPct), 80);
    return () => clearTimeout(timer);
  }, [targetPct]);

  if (!stats) return null;

  const size = 132;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPct / 100) * circumference;
  const color = ringColor(stats.avg);
  const grade = gradeLabel(stats.avg);
  const daysSinceLatest = daysAgo(stats.latest.updatedAt);

  const editLink = `/resumes/${stats.topResume.id}/edit`;

  return (
    <div className="mb-6 imp-card p-5 overflow-hidden relative">
      {/* Subtle ambient glow */}
      <div
        aria-hidden
        className="absolute -top-20 -right-20 w-48 h-48 rounded-full opacity-[0.08] blur-2xl pointer-events-none"
        style={{ background: `radial-gradient(circle, ${color}, transparent 70%)` }}
      />

      <div className="flex items-center justify-between mb-4 relative">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <span className="w-5 h-5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md flex items-center justify-center text-xs">
            ◉
          </span>
          이력서 헬스
          <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">
            {stats.count}개 평균
          </span>
        </h3>
        <Link
          to={editLink}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline focus-ring-accent rounded"
        >
          편집하기 →
        </Link>
      </div>

      <div className="flex items-center gap-5 relative">
        {/* Ring */}
        <Link
          to={editLink}
          aria-label={`이력서 완성도 ${stats.avg}% — 편집 페이지로 이동`}
          className="relative shrink-0 group focus-ring-accent rounded-full"
          style={{ width: size, height: size }}
        >
          <svg
            width={size}
            height={size}
            className="-rotate-90 transition-transform duration-300 group-hover:scale-[1.02]"
            aria-hidden
          >
            <defs>
              <linearGradient id="healthRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="55%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0c4a6e" />
              </linearGradient>
            </defs>
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
              stroke="url(#healthRingGrad)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{
                transition:
                  'stroke-dashoffset 900ms cubic-bezier(0.25, 1, 0.5, 1), stroke 300ms ease',
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[28px] font-bold text-slate-900 dark:text-slate-100 tabular-nums leading-none">
              {animatedPct}
              <span className="text-sm font-medium text-slate-400 dark:text-slate-500">%</span>
            </span>
            <span className={`text-[10px] mt-0.5 font-medium ${grade.tone}`}>{grade.label}</span>
          </div>
        </Link>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-700 dark:text-slate-300 mb-1.5 truncate">
            <span className="text-slate-400 dark:text-slate-500">최근 편집:</span>{' '}
            <strong className="text-slate-800 dark:text-slate-100">
              {stats.latest.title || '제목 없음'}
            </strong>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            {daysSinceLatest === 0
              ? '오늘 업데이트됨'
              : daysSinceLatest === 1
                ? '어제 업데이트됨'
                : `마지막 수정 ${daysSinceLatest}일 전`}
            {daysSinceLatest >= 30 && (
              <span className="ml-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                업데이트 필요
              </span>
            )}
          </p>

          {/* Nudges */}
          <div className="flex flex-wrap gap-1.5">
            {stats.avg < 100 && (
              <Link
                to={editLink}
                className="imp-btn px-2.5 py-1 text-[11px] font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                완성도 높이기
              </Link>
            )}
            <Link
              to={`/resumes/${stats.topResume.id}/preview`}
              className="imp-btn px-2.5 py-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              미리보기
            </Link>
            {stats.count > 1 && (
              <Link
                to="/stats"
                className="imp-btn px-2.5 py-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                통계 보기
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
