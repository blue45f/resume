import { memo, useMemo } from 'react';
import type { ResumeSummary } from '@/types/resume';
import { resumeThemes, type ResumeTheme } from '@/lib/resumeThemes';
import { computeResumeCompletion } from '@/lib/resumeCompletion';

interface Props {
  resume: ResumeSummary;
  themeId?: string;
  onClick?: () => void;
  index?: number;
}

/** Map accent color names to Tailwind-compatible hex values for the thumbnail */
const accentHex: Record<string, string> = {
  slate: '#475569',
  blue: '#3b82f6',
  green: '#22c55e',
  purple: '#a855f7',
  indigo: '#6366f1',
  amber: '#f59e0b',
};

/** Extract a usable background color from the theme headerStyle */
function extractHeaderBg(theme: ResumeTheme): string {
  // Check for bg-gradient — pick the "from" color
  const gradientMatch = theme.headerStyle.match(/from-(\w+-\d+)/);
  if (gradientMatch) {
    const map: Record<string, string> = {
      'purple-600': '#9333ea',
      'pink-500': '#ec4899',
      'pink-100': '#fce7f3',
      'indigo-600': '#4f46e5',
      'indigo-700': '#4338ca',
      'blue-500': '#3b82f6',
      'amber-50': '#fffbeb',
    };
    return map[gradientMatch[1]] || accentHex[theme.accentColor] || '#475569';
  }
  // Check for explicit bg color
  const bgMatch = theme.headerStyle.match(/bg-\[([^\]]+)\]/);
  if (bgMatch) return bgMatch[1];
  // Check for bg-slate-900 etc
  if (theme.headerStyle.includes('bg-slate-900')) return '#0f172a';
  if (theme.headerStyle.includes('bg-blue-50')) return '#eff6ff';
  // Fallback to accent color
  return accentHex[theme.accentColor] || '#475569';
}

/** Format relative time in Korean */
function formatRelativeTime(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}분 전`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}시간 전`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}일 전`;
    return `${Math.floor(days / 30)}개월 전`;
  } catch {
    return '';
  }
}

/** Circular progress SVG */
function CircularProgress({ pct, color }: { pct: number; color: string }) {
  const r = 9;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" className="rotate-[-90deg]" aria-hidden="true">
      <circle cx="13" cy="13" r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" />
      <circle
        cx="13"
        cy="13"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}

const ResumeThumbnail = memo(function ResumeThumbnail({
  resume,
  themeId,
  onClick,
  index = 0,
  showOpenToWork = true,
}: Props & { showOpenToWork?: boolean }) {
  const theme = useMemo(
    () => resumeThemes.find((t) => t.id === (themeId || 'classic')) || resumeThemes[0],
    [themeId],
  );

  const headerBg = useMemo(() => extractHeaderBg(theme), [theme]);
  const completionResult = useMemo(() => computeResumeCompletion(resume), [resume]);
  const completion = completionResult.pct;
  const isLightHeader =
    headerBg.startsWith('#fff') || headerBg.startsWith('#eff') || headerBg.startsWith('#fce');
  const headerTextColor = isLightHeader ? '#1e293b' : '#ffffff';
  const accentColor = accentHex[theme.accentColor] || '#6366f1';
  // Grade-based progress color for at-a-glance signal (excellent=emerald, good=blue, fair=amber, low=red)
  const gradeColor =
    completionResult.grade === 'excellent'
      ? '#10b981'
      : completionResult.grade === 'good'
        ? '#3b82f6'
        : completionResult.grade === 'fair'
          ? '#f59e0b'
          : '#ef4444';
  const progressColor = isLightHeader ? gradeColor : '#ffffff';
  // Tooltip: show top 3 missing items so users know exactly what to improve
  const missingHint =
    completionResult.missingItems.length > 0
      ? '\n부족한 항목:\n' +
        completionResult.missingItems
          .slice(0, 3)
          .map((m) => `• ${m.label}${m.hint ? ` — ${m.hint}` : ''}`)
          .join('\n')
      : '';
  const relativeTime = formatRelativeTime(resume.updatedAt);
  const staggerClass = `stagger-${Math.min(index + 1, 6)}`;
  const isPublic = resume.visibility === 'public';

  return (
    <button
      onClick={onClick}
      className={`group relative w-full aspect-[3/4] rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 animate-card-enter ${staggerClass}`}
      aria-label={`${resume.title || '제목 없음'} 미리보기`}
    >
      {/* Header area with gradient overlay */}
      <div
        className="px-3 pt-3 pb-2.5 relative"
        style={{ backgroundColor: headerBg, fontFamily: theme.fontFamily }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/15 pointer-events-none" />
        <div className="relative flex items-start justify-between gap-1">
          <div className="flex-1 min-w-0">
            <div
              className="text-[11px] font-bold truncate leading-tight"
              style={{ color: headerTextColor }}
            >
              {resume.personalInfo.name || '이름 미입력'}
            </div>
            <div
              className="text-[9px] truncate mt-0.5 opacity-80"
              style={{ color: headerTextColor }}
            >
              {resume.title || '제목 없음'}
            </div>
          </div>
          {/* Quick-look profile score (목록 카드 전용 lightweight metric).
              상세 페이지의 "완성도"는 경력·학력·프로젝트까지 평가하므로 값이 다름. */}
          <div
            className="relative shrink-0 flex items-center justify-center"
            title={`프로필 점수 ${completion}% (${completionResult.score}/${completionResult.max}점)\n— 목록용 빠른 점수입니다. 상세 페이지의 완성도는 모든 섹션을 평가합니다.${missingHint}`}
            aria-label={`프로필 점수 ${completion}퍼센트, ${completionResult.missingItems.length}개 항목 미완성`}
          >
            <CircularProgress pct={completion} color={progressColor} />
            <span
              className="absolute text-[7px] font-bold"
              style={{ color: headerTextColor, opacity: 0.9 }}
            >
              {completion}
            </span>
          </div>
        </div>
      </div>

      {/* Miniaturized body area — placeholder lines */}
      <div className="px-3 py-2 space-y-2" style={{ fontFamily: theme.fontFamily }}>
        {/* Section title placeholder */}
        <div className="flex items-center gap-1">
          <div
            className="h-[3px] rounded-full"
            style={{ width: 24, backgroundColor: accentColor }}
          />
          <div className="h-[3px] w-10 bg-slate-200 dark:bg-slate-600 rounded-full" />
        </div>
        {/* Content line placeholders */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-1">
            <div
              className="h-[2px] bg-slate-200 dark:bg-slate-600 rounded-full"
              style={{ width: `${85 - i * 12}%` }}
            />
            <div
              className="h-[2px] bg-slate-100 dark:bg-slate-700 rounded-full"
              style={{ width: `${70 - i * 8}%` }}
            />
          </div>
        ))}

        {/* Second section placeholder */}
        <div className="flex items-center gap-1 pt-1">
          <div
            className="h-[3px] rounded-full"
            style={{ width: 24, backgroundColor: accentColor }}
          />
          <div className="h-[3px] w-8 bg-slate-200 dark:bg-slate-600 rounded-full" />
        </div>
        {[...Array(2)].map((_, i) => (
          <div key={`s2-${i}`} className="space-y-1">
            <div
              className="h-[2px] bg-slate-200 dark:bg-slate-600 rounded-full"
              style={{ width: `${75 - i * 15}%` }}
            />
            <div
              className="h-[2px] bg-slate-100 dark:bg-slate-700 rounded-full"
              style={{ width: `${60 - i * 10}%` }}
            />
          </div>
        ))}
      </div>

      {/* Hover action overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-indigo-600/85 via-indigo-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4 gap-2 flex-wrap">
        <span className="text-slate-900 text-xs font-semibold bg-white px-3 py-1.5 rounded-full shadow-sm">
          편집
        </span>
        <span className="text-slate-900 text-xs font-semibold bg-white px-3 py-1.5 rounded-full shadow-sm">
          미리보기
        </span>
        <span className="text-slate-800 text-[10px] font-medium bg-white/95 px-2 py-1 rounded-full">
          자소서
        </span>
        <span className="text-slate-800 text-[10px] font-medium bg-white/95 px-2 py-1 rounded-full">
          면접
        </span>
      </div>

      {/* Open to Work badge */}
      {showOpenToWork && resume.isOpenToWork && (
        <div className="absolute top-8 left-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-emerald-500 text-white shadow-sm">
          <span className="w-1.5 h-1.5 bg-white rounded-full inline-block animate-pulse" />
          구직중
        </div>
      )}

      {/* Visibility badge */}
      <div
        className={`absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-semibold shadow-sm ${isPublic ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-100'}`}
      >
        {isPublic ? (
          <svg
            className="w-2.5 h-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        ) : (
          <svg
            className="w-2.5 h-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
            />
          </svg>
        )}
        {isPublic ? '공개' : '비공개'}
      </div>

      {/* Tags */}
      {resume.tags?.length > 0 && (
        <div className="absolute top-2 right-2 flex gap-0.5">
          {resume.tags.slice(0, 2).map((tag) => (
            <span
              key={tag.id}
              className="w-2 h-2 rounded-full shadow-sm"
              style={{ backgroundColor: tag.color }}
              title={tag.name}
            />
          ))}
        </div>
      )}

      {/* Bottom info bar */}
      <div className="absolute bottom-0 left-0 right-0 px-2.5 py-1.5 flex items-center justify-between bg-gradient-to-t from-white/95 to-transparent dark:from-slate-800/95">
        {relativeTime && (
          <span className="text-[8px] text-slate-400 dark:text-slate-500 truncate">
            {relativeTime}
          </span>
        )}
        <span
          className={`text-[8px] font-semibold ml-auto ${
            completion >= 80
              ? 'text-emerald-600 dark:text-emerald-400'
              : completion >= 50
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-red-500 dark:text-red-400'
          }`}
          title="목록용 빠른 점수. 상세 페이지의 완성도는 별도 계산입니다."
        >
          {completion >= 80 ? '✓ ' : ''}프로필 {completion}%
        </span>
      </div>
    </button>
  );
});

export default ResumeThumbnail;
