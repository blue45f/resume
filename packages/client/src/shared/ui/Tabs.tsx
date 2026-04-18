import { useState, type ReactNode, useId } from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: ReactNode;
  content: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
  value?: string;
  onChange?: (id: string) => void;
  /** Optional class appended to the tablist container */
  className?: string;
  /** Optional class appended to each panel wrapper */
  panelClassName?: string;
  ariaLabel?: string;
}

/**
 * Minimal accessible Tabs component (no library).
 * - Supports both controlled (value/onChange) and uncontrolled (defaultTab) modes.
 * - Uses Impeccable Design tokens (neutral, subtle underline indicator).
 */
export default function Tabs({
  items,
  defaultTab,
  value,
  onChange,
  className = '',
  panelClassName = '',
  ariaLabel = 'Tabs',
}: TabsProps) {
  const [internal, setInternal] = useState(() => defaultTab ?? items[0]?.id ?? '');
  const active = value ?? internal;
  const uid = useId();

  const activate = (id: string) => {
    if (value === undefined) setInternal(id);
    onChange?.(id);
  };

  const activeItem = items.find((i) => i.id === active) ?? items[0];

  return (
    <div className="w-full">
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={`flex gap-1 border-b border-slate-200 dark:border-slate-700 ${className}`}
      >
        {items.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              id={`${uid}-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`${uid}-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => activate(tab.id)}
              className={`relative px-3 sm:px-4 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500 rounded-t-md ${
                isActive
                  ? 'text-slate-900 dark:text-slate-100'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {tab.icon && <span aria-hidden>{tab.icon}</span>}
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${
                      isActive
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </span>
              {isActive && (
                <span
                  aria-hidden
                  className="absolute left-0 right-0 -bottom-px h-0.5 bg-slate-900 dark:bg-slate-100"
                />
              )}
            </button>
          );
        })}
      </div>

      {activeItem && (
        <div
          role="tabpanel"
          id={`${uid}-panel-${activeItem.id}`}
          aria-labelledby={`${uid}-tab-${activeItem.id}`}
          className={`pt-4 ${panelClassName}`}
        >
          {activeItem.content}
        </div>
      )}
    </div>
  );
}
