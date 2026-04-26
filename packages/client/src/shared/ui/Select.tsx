/**
 * Select — Impeccable-styled Radix Select wrapper.
 *
 * Example:
 *   <Select
 *     value={category}
 *     onChange={setCategory}
 *     placeholder="카테고리 선택"
 *     options={[
 *       { value: 'free', label: '자유' },
 *       { value: 'qna', label: 'Q&A', icon: <HelpIcon /> },
 *     ]}
 *   />
 */
import * as RadixSelect from '@radix-ui/react-select';
import type { ReactNode } from 'react';

function ChevronDown({ size = 16, strokeWidth = 2 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function Check({ size = 14, strokeWidth = 2.5 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export default function Select({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  className = '',
  ariaLabel,
}: SelectProps) {
  const selected = options.find((o) => o.value === value);

  return (
    <RadixSelect.Root value={value} onValueChange={onChange} disabled={disabled}>
      <RadixSelect.Trigger
        aria-label={ariaLabel ?? placeholder}
        className={[
          'group inline-flex items-center justify-between gap-3',
          'h-10 pl-3.5 pr-3 min-w-[140px] w-full',
          'rounded-[var(--radius-md)] border border-[var(--color-border)]',
          'bg-[var(--color-surface)]',
          'text-sm text-[var(--color-text)]',
          'hover:border-[var(--color-text-muted)]',
          'data-[state=open]:border-[var(--color-accent)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:border-[var(--color-accent)]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors duration-150',
          className,
        ].join(' ')}
      >
        <span className="flex items-center gap-2 truncate">
          {selected?.icon && <span className="flex-shrink-0">{selected.icon}</span>}
          <RadixSelect.Value placeholder={placeholder}>
            {selected ? (
              <span className="truncate">{selected.label}</span>
            ) : (
              <span className="text-[var(--color-text-muted)]">{placeholder}</span>
            )}
          </RadixSelect.Value>
        </span>
        <RadixSelect.Icon className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)] group-data-[state=open]:rotate-180 transition-all duration-200">
          <ChevronDown />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={6}
          className={[
            'z-[100] overflow-hidden',
            'rounded-[var(--radius-md)] border border-[var(--color-border-subtle)]',
            'bg-[var(--color-surface)]',
            'shadow-[var(--shadow-lg)]',
            'min-w-[var(--radix-select-trigger-width)]',
            'max-h-[var(--radix-select-content-available-height)]',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.96]',
            'data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.96]',
            'motion-reduce:animate-none',
          ].join(' ')}
        >
          <RadixSelect.Viewport className="p-1">
            {options.map((opt) => (
              <RadixSelect.Item
                key={opt.value}
                value={opt.value}
                className={[
                  'relative flex items-center gap-2',
                  'px-2.5 py-2 pr-8 rounded-[var(--radius-sm)]',
                  'text-sm text-[var(--color-text)]',
                  'cursor-pointer select-none outline-none',
                  'data-[highlighted]:bg-[var(--color-surface-sunken)]',
                  'data-[state=checked]:text-[var(--color-accent)] data-[state=checked]:font-medium',
                  'data-[disabled]:opacity-50 data-[disabled]:pointer-events-none',
                  'transition-colors duration-100',
                ].join(' ')}
              >
                {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
                <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator className="absolute right-2 inline-flex items-center">
                  <Check />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
