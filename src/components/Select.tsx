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
import { ChevronDown, Check } from 'lucide-react';
import type { ReactNode } from 'react';

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
          'inline-flex items-center justify-between gap-2',
          'h-10 px-3.5 min-w-[140px] w-full',
          'rounded-[12px] border border-neutral-200 dark:border-neutral-800',
          'bg-white dark:bg-neutral-900',
          'text-sm text-neutral-900 dark:text-neutral-100',
          'hover:border-neutral-300 dark:hover:border-neutral-700',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/60',
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
              <span className="text-neutral-400 dark:text-neutral-500">{placeholder}</span>
            )}
          </RadixSelect.Value>
        </span>
        <RadixSelect.Icon className="text-neutral-400 dark:text-neutral-500">
          <ChevronDown size={16} strokeWidth={2} />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={6}
          className={[
            'z-[100] overflow-hidden',
            'rounded-[12px] border border-neutral-200 dark:border-neutral-800',
            'bg-white dark:bg-neutral-900',
            'shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]',
            'min-w-[var(--radix-select-trigger-width)]',
            'max-h-[var(--radix-select-content-available-height)]',
            'animate-in fade-in-0 zoom-in-95',
          ].join(' ')}
        >
          <RadixSelect.Viewport className="p-1">
            {options.map((opt) => (
              <RadixSelect.Item
                key={opt.value}
                value={opt.value}
                className={[
                  'relative flex items-center gap-2',
                  'px-2.5 py-2 pr-8 rounded-[8px]',
                  'text-sm text-neutral-900 dark:text-neutral-100',
                  'cursor-pointer select-none outline-none',
                  'data-[highlighted]:bg-neutral-100 dark:data-[highlighted]:bg-neutral-800',
                  'data-[state=checked]:text-blue-600 dark:data-[state=checked]:text-blue-400',
                  'data-[disabled]:opacity-50 data-[disabled]:pointer-events-none',
                  'transition-colors duration-100',
                ].join(' ')}
              >
                {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
                <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator className="absolute right-2 inline-flex items-center">
                  <Check size={14} strokeWidth={2.5} />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
