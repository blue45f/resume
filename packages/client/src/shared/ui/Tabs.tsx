import { useState, useRef, type ReactNode, type KeyboardEvent, useId } from 'react';

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
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const activate = (id: string) => {
    if (value === undefined) setInternal(id);
    onChange?.(id);
  };

  const onTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End')
      return;
    e.preventDefault();
    const last = items.length - 1;
    let next = index;
    if (e.key === 'ArrowLeft') next = index === 0 ? last : index - 1;
    else if (e.key === 'ArrowRight') next = index === last ? 0 : index + 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    const nextId = items[next]?.id;
    if (!nextId) return;
    activate(nextId);
    tabRefs.current[nextId]?.focus();
  };

  const activeItem = items.find((i) => i.id === active) ?? items[0];

  return (
    <div className="w-full">
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={`flex gap-1 border-b border-[var(--color-border-subtle)] ${className}`}
      >
        {items.map((tab, index) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[tab.id] = el;
              }}
              role="tab"
              type="button"
              id={`${uid}-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`${uid}-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => activate(tab.id)}
              onKeyDown={(e) => onTabKeyDown(e, index)}
              className={`relative px-3 sm:px-4 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 rounded-t-[var(--radius-sm)] ${
                isActive
                  ? 'text-[var(--color-text)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {tab.icon && <span aria-hidden>{tab.icon}</span>}
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${
                      isActive
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </span>
              {isActive && (
                <span
                  aria-hidden
                  className="absolute left-0 right-0 -bottom-px h-0.5 bg-[var(--color-accent)]"
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
