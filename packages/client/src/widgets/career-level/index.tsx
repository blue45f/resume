import { useEffect, useMemo, useState } from 'react';
import type { ResumeSummary } from '@/types/resume';
import type { User } from '@/features/auth/model/auth';

/**
 * CareerLevel — 커리어 경험치 미터 (Lv.1~Lv.10).
 * 가입일 대비 일수 + 이력서 수 + 총 조회수 + 공개 이력서 비율로 EXP 산정.
 * 얕은 게이미피케이션: 은근한 sapphire 그라디언트 bar + Lv 뱃지.
 */

interface Props {
  user: User;
  resumes: ResumeSummary[];
}

interface LevelInfo {
  level: number;
  title: string;
  exp: number;
  nextExp: number;
  progressPct: number;
  totalExp: number;
}

const LEVEL_TITLES = [
  '탐색자', // Lv.1
  '지원자', // Lv.2
  '도전자', // Lv.3
  '성장러', // Lv.4
  '전문가', // Lv.5
  '스페셜리스트', // Lv.6
  '시니어', // Lv.7
  '리더', // Lv.8
  '마스터', // Lv.9
  '레전드', // Lv.10
];

// Thresholds: cumulative EXP required to reach each level
const LEVEL_THRESHOLDS = [0, 50, 140, 280, 480, 760, 1120, 1580, 2160, 2880, 4000];

function computeExp(user: User, resumes: ResumeSummary[]): number {
  const days = user.createdAt
    ? Math.max(0, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000))
    : 0;
  const daysExp = Math.min(days, 365); // cap at 1 year = 365 EXP
  const resumeExp = resumes.length * 40;
  const views = resumes.reduce((s, r) => s + (r.viewCount || 0), 0);
  const viewsExp = Math.min(views * 2, 600);
  const publicCount = resumes.filter(
    (r) => r.visibility === 'public' || r.visibility === 'link-only',
  ).length;
  const publicExp = publicCount * 30;
  const tagsExp = resumes.reduce((s, r) => s + (r.tags?.length || 0), 0) * 5;
  return daysExp + resumeExp + viewsExp + publicExp + tagsExp;
}

function levelFromExp(totalExp: number): LevelInfo {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalExp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  const cap = Math.min(level, LEVEL_THRESHOLDS.length - 1);
  const prev = LEVEL_THRESHOLDS[cap - 1] ?? 0;
  const next = LEVEL_THRESHOLDS[cap] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const exp = totalExp - prev;
  const nextExp = Math.max(1, next - prev);
  const progressPct = level >= 10 ? 100 : Math.round((exp / nextExp) * 100);
  return {
    level,
    title: LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)],
    exp,
    nextExp,
    progressPct,
    totalExp,
  };
}

export default function CareerLevel({ user, resumes }: Props) {
  const info = useMemo(() => levelFromExp(computeExp(user, resumes)), [user, resumes]);
  const [animatedPct, setAnimatedPct] = useState(0);

  useEffect(() => {
    const prefersReduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduce) {
      setAnimatedPct(info.progressPct);
      return;
    }
    const t = setTimeout(() => setAnimatedPct(info.progressPct), 100);
    return () => clearTimeout(t);
  }, [info.progressPct]);

  const isMaxed = info.level >= 10;

  return (
    <div className="imp-card p-4 sm:p-5 overflow-hidden relative">
      <div className="flex items-center justify-between mb-3 relative">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <span className="w-5 h-5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md flex items-center justify-center text-xs">
            ★
          </span>
          커리어 레벨
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
            EXP {info.totalExp.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3">
        {/* Level badge */}
        <div
          className="relative shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-sapphire-900 flex items-center justify-center text-white shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 55%, #0c4a6e 100%)',
          }}
        >
          <span className="text-[10px] font-semibold opacity-80 absolute top-1 left-2">Lv</span>
          <span className="text-xl font-extrabold tabular-nums">{info.level}</span>
          {isMaxed && (
            <span
              aria-hidden
              className="absolute -top-1 -right-1 text-[10px] bg-white text-blue-700 rounded-full px-1.5 py-0.5 font-bold shadow-sm"
            >
              MAX
            </span>
          )}
        </div>

        {/* Title + progress */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1 truncate">
            {info.title}
            <span className="ml-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500">
              {isMaxed
                ? '최종 단계'
                : `다음 레벨까지 ${(info.nextExp - info.exp).toLocaleString()} EXP`}
            </span>
          </p>
          <div
            className="relative h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden"
            role="progressbar"
            aria-valuenow={info.progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`레벨 진행도 ${info.progressPct}%`}
          >
            <div
              className="h-full rounded-full transition-[width] duration-700 ease-out"
              style={{
                width: `${animatedPct}%`,
                background: 'linear-gradient(90deg, #38bdf8 0%, #0284c7 50%, #0c4a6e 100%)',
              }}
            />
          </div>
          <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
            {info.exp.toLocaleString()} / {info.nextExp.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
