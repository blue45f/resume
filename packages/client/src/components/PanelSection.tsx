import { useState, type ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  icon?: string;
  children: ReactNode;
  /** 기본 펼침 상태. 기본값 true */
  defaultOpen?: boolean;
}

/**
 * PanelSection — PreviewPage 의 연속된 imp-card 패널을 주제별로 그룹핑.
 * 헤더는 얇은 bg-slate 표식으로만 구분 (카드 속의 카드 회피).
 * 내부 패널들은 기존 imp-card 스타일 그대로 유지, 좌측 세로 border 1px 로 시각적 결속.
 */
export default function PanelSection({
  title,
  subtitle,
  icon,
  children,
  defaultOpen = true,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="no-print" aria-label={title}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-t-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 border-b-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        aria-expanded={open}
      >
        <div className="flex items-baseline gap-2 min-w-0">
          {icon && (
            <span aria-hidden className="text-base shrink-0">
              {icon}
            </span>
          )}
          <h2 className="text-[13px] font-bold tracking-tight text-slate-800 dark:text-slate-100 shrink-0">
            {title}
          </h2>
          {subtitle && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              — {subtitle}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          style={{ transitionDuration: 'var(--transition-fast, 150ms)' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="border border-slate-200 dark:border-slate-700/70 border-t-0 rounded-b-lg px-2 py-2 space-y-3 bg-white/30 dark:bg-slate-900/20">
          {children}
        </div>
      )}
    </section>
  );
}
