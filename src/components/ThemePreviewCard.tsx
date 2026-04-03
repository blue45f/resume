import type { ResumeTheme } from '@/lib/resumeThemes';

interface Props {
  theme: ResumeTheme;
  selected?: boolean;
  usageCount?: number;
  onClick: () => void;
  onPreview?: () => void;
}

export default function ThemePreviewCard({ theme, selected, usageCount, onClick, onPreview }: Props) {
  const p = theme.preview;
  const isGradient = p?.headerBg.startsWith('linear-gradient');

  return (
    <div
      className={`group relative bg-white dark:bg-slate-800 rounded-xl border-2 overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-1 focus-within:ring-2 focus-within:ring-blue-500 ${
        selected
          ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800 shadow-md'
          : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      aria-label={`${theme.name} 테마 선택`}
    >
      {/* Miniature resume preview */}
      <div className="aspect-[3/4] relative overflow-hidden">
        {/* Header area */}
        <div
          className="h-[35%] flex items-end px-3 pb-2"
          style={{ background: p?.headerBg || '#f1f5f9' }}
        >
          <div className="space-y-1 w-full">
            <div
              className="h-2.5 rounded-sm w-2/3"
              style={{ backgroundColor: p?.headerText || '#1e293b', opacity: 0.9 }}
            />
            <div
              className="h-1.5 rounded-sm w-1/2"
              style={{ backgroundColor: p?.headerText || '#1e293b', opacity: 0.5 }}
            />
          </div>
        </div>

        {/* Accent bar */}
        <div
          className="h-[3px]"
          style={{ backgroundColor: p?.accentBar || '#3b82f6' }}
        />

        {/* Body area */}
        <div className="px-3 pt-2.5 pb-3 space-y-2.5" style={{ backgroundColor: p?.bodyBg || '#ffffff' }}>
          {/* Section title */}
          <div className="space-y-1">
            <div className="h-1.5 rounded-sm w-1/3" style={{ backgroundColor: p?.accentBar || '#3b82f6', opacity: 0.8 }} />
            <div className="h-1 bg-slate-200 dark:bg-slate-600 rounded-sm w-full" />
            <div className="h-1 bg-slate-200 dark:bg-slate-600 rounded-sm w-4/5" />
            <div className="h-1 bg-slate-200 dark:bg-slate-600 rounded-sm w-3/5" />
          </div>
          {/* Section title 2 */}
          <div className="space-y-1">
            <div className="h-1.5 rounded-sm w-1/4" style={{ backgroundColor: p?.accentBar || '#3b82f6', opacity: 0.8 }} />
            <div className="h-1 bg-slate-200 dark:bg-slate-600 rounded-sm w-full" />
            <div className="h-1 bg-slate-200 dark:bg-slate-600 rounded-sm w-2/3" />
          </div>
          {/* Skill pills */}
          <div className="flex gap-1 flex-wrap">
            {[0.6, 0.5, 0.4, 0.3].map((w, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full"
                style={{ width: `${w * 50}%`, backgroundColor: p?.accentBar || '#3b82f6', opacity: 0.25 }}
              />
            ))}
          </div>
        </div>

        {/* Hover overlay with preview button */}
        {onPreview && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button
              onClick={(e) => { e.stopPropagation(); onPreview(); }}
              className="px-3 py-1.5 bg-white/95 text-slate-800 text-xs font-medium rounded-lg shadow-lg hover:bg-white transition-colors"
            >
              미리보기
            </button>
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="px-3 py-2.5 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-1.5 mb-0.5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {theme.name}
          </h3>
          {theme.premium && (
            <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full leading-none">
              프리미엄
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{theme.description}</p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-slate-400 dark:text-slate-500" style={{ fontFamily: theme.fontFamily }}>
            Aa
          </span>
          {usageCount !== undefined && usageCount > 0 && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-0.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {usageCount}명 사용 중
            </span>
          )}
        </div>
        {/* Color palette dots */}
        <div className="flex items-center gap-1 mt-1.5">
          {p && (
            <>
              <div className="w-3 h-3 rounded-full border border-slate-200 dark:border-slate-600 shrink-0" style={{ background: isGradient ? p.accentBar : p.headerBg }} title="헤더" />
              <div className="w-3 h-3 rounded-full border border-slate-200 dark:border-slate-600 shrink-0" style={{ backgroundColor: p.accentBar }} title="포인트" />
              <div className="w-3 h-3 rounded-full border border-slate-200 dark:border-slate-600 shrink-0" style={{ backgroundColor: p.headerText }} title="텍스트" />
            </>
          )}
        </div>
      </div>

      {/* Selected checkmark */}
      {selected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
}
