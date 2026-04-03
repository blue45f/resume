import { useMemo } from 'react';
import type { ResumeSummary } from '@/types/resume';
import { resumeThemes, type ResumeTheme } from '@/lib/resumeThemes';

interface Props {
  resume: ResumeSummary;
  themeId?: string;
  onClick?: () => void;
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
      'purple-600': '#9333ea', 'pink-500': '#ec4899', 'pink-100': '#fce7f3',
      'indigo-600': '#4f46e5', 'indigo-700': '#4338ca', 'blue-500': '#3b82f6',
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

/** Count non-empty sections in a resume summary */
function countSections(resume: ResumeSummary): number {
  let count = 0;
  if (resume.personalInfo.name) count++;
  if (resume.personalInfo.email) count++;
  if (resume.personalInfo.summary) count++;
  // We only have personalInfo and tags in ResumeSummary, so estimate
  return Math.max(count, 1);
}

export default function ResumeThumbnail({ resume, themeId, onClick }: Props) {
  const theme = useMemo(
    () => resumeThemes.find(t => t.id === (themeId || 'classic')) || resumeThemes[0],
    [themeId],
  );

  const headerBg = useMemo(() => extractHeaderBg(theme), [theme]);
  const sectionCount = countSections(resume);
  const isLightHeader = headerBg.startsWith('#fff') || headerBg.startsWith('#eff') || headerBg.startsWith('#fce');
  const headerTextColor = isLightHeader ? '#1e293b' : '#ffffff';

  return (
    <button
      onClick={onClick}
      className="group relative w-full aspect-[3/4] rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label={`${resume.title || '제목 없음'} 미리보기`}
    >
      {/* Miniaturized header area */}
      <div
        className="px-3 pt-3 pb-2"
        style={{ backgroundColor: headerBg, fontFamily: theme.fontFamily }}
      >
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

      {/* Miniaturized body area — placeholder lines */}
      <div className="px-3 py-2 space-y-2" style={{ fontFamily: theme.fontFamily }}>
        {/* Section title placeholder */}
        <div className="flex items-center gap-1">
          <div className="h-[3px] rounded-full" style={{ width: 24, backgroundColor: accentHex[theme.accentColor] || '#475569' }} />
          <div className="h-[3px] w-10 bg-slate-200 dark:bg-slate-600 rounded-full" />
        </div>
        {/* Content line placeholders */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-[2px] bg-slate-200 dark:bg-slate-600 rounded-full" style={{ width: `${85 - i * 12}%` }} />
            <div className="h-[2px] bg-slate-100 dark:bg-slate-700 rounded-full" style={{ width: `${70 - i * 8}%` }} />
          </div>
        ))}

        {/* Second section placeholder */}
        <div className="flex items-center gap-1 pt-1">
          <div className="h-[3px] rounded-full" style={{ width: 24, backgroundColor: accentHex[theme.accentColor] || '#475569' }} />
          <div className="h-[3px] w-8 bg-slate-200 dark:bg-slate-600 rounded-full" />
        </div>
        {[...Array(2)].map((_, i) => (
          <div key={`s2-${i}`} className="space-y-1">
            <div className="h-[2px] bg-slate-200 dark:bg-slate-600 rounded-full" style={{ width: `${75 - i * 15}%` }} />
            <div className="h-[2px] bg-slate-100 dark:bg-slate-700 rounded-full" style={{ width: `${60 - i * 10}%` }} />
          </div>
        ))}
      </div>

      {/* Overlay badge with section count */}
      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-600 rounded text-[9px] text-slate-500 dark:text-slate-400 font-medium backdrop-blur-sm">
        {sectionCount}개 섹션
      </div>

      {/* Tags */}
      {resume.tags?.length > 0 && (
        <div className="absolute top-0 right-0 flex gap-0.5 p-1.5">
          {resume.tags.slice(0, 2).map(tag => (
            <span
              key={tag.id}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: tag.color }}
              title={tag.name}
            />
          ))}
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors duration-200" />
    </button>
  );
}
