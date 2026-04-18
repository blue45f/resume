/**
 * AlertDialog — 접근성 확보된 confirm/delete 다이얼로그. Radix AlertDialog 기반.
 *
 * Usage:
 *   <AlertDialog
 *     open={open}
 *     onOpenChange={setOpen}
 *     title="삭제하시겠습니까?"
 *     description="이 작업은 되돌릴 수 없습니다."
 *     confirmText="삭제"
 *     cancelText="취소"
 *     danger
 *     onConfirm={() => deleteItem()}
 *   />
 */
import * as RadixAlertDialog from '@radix-ui/react-alert-dialog';
import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  children?: ReactNode;
}

export default function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = '확인',
  cancelText = '취소',
  danger = false,
  onConfirm,
  children,
}: Props) {
  return (
    <RadixAlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixAlertDialog.Portal>
        <RadixAlertDialog.Overlay
          className="fixed inset-0 z-[90] bg-neutral-950/50 backdrop-blur-[2px]
                     data-[state=open]:animate-in data-[state=open]:fade-in-0
                     data-[state=closed]:animate-out data-[state=closed]:fade-out-0
                     motion-reduce:animate-none"
        />
        <RadixAlertDialog.Content
          className="fixed z-[91] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                     w-[calc(100%-2rem)] max-w-sm
                     bg-[var(--color-surface)] text-[var(--color-text)]
                     rounded-[var(--radius-lg)]
                     border border-[var(--color-border-subtle)]
                     shadow-[var(--shadow-hover)]
                     px-6 py-6
                     data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98]
                     data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.98]
                     motion-reduce:animate-none
                     focus:outline-none"
        >
          <div className="flex items-start gap-3">
            {danger && (
              <div className="shrink-0 mt-0.5 flex items-center justify-center h-10 w-10 rounded-full bg-red-50 dark:bg-red-900/20">
                <svg
                  className="h-5 w-5 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.2 16c-.77 1.33.2 3 1.73 3z"
                  />
                </svg>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <RadixAlertDialog.Title className="text-[17px] font-semibold tracking-tight text-[var(--color-text)] leading-snug">
                {title}
              </RadixAlertDialog.Title>
              {description && (
                <RadixAlertDialog.Description className="mt-1.5 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {description}
                </RadixAlertDialog.Description>
              )}
            </div>
          </div>
          {children && <div className="mt-4">{children}</div>}
          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
            <RadixAlertDialog.Cancel asChild>
              <button
                type="button"
                className="imp-btn px-4 h-10 text-sm font-medium text-[var(--color-text-secondary)]
                           bg-transparent hover:bg-[var(--color-surface-sunken)]
                           border border-[var(--color-border)]
                           rounded-[var(--radius-md)]
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2
                           transition-colors"
              >
                {cancelText}
              </button>
            </RadixAlertDialog.Cancel>
            <RadixAlertDialog.Action asChild>
              <button
                type="button"
                onClick={onConfirm}
                className={`imp-btn px-4 h-10 text-sm font-semibold rounded-[var(--radius-md)]
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                           transition-colors
                           ${
                             danger
                               ? 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500'
                               : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 focus-visible:ring-[var(--color-accent)]'
                           }`}
              >
                {confirmText}
              </button>
            </RadixAlertDialog.Action>
          </div>
        </RadixAlertDialog.Content>
      </RadixAlertDialog.Portal>
    </RadixAlertDialog.Root>
  );
}
