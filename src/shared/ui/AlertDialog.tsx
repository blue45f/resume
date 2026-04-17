/**
 * AlertDialog - Accessible confirm/delete dialog built on @radix-ui/react-alert-dialog.
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
        <RadixAlertDialog.Overlay className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm animate-fade-in" />
        <RadixAlertDialog.Content className="fixed z-[91] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-sm bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 animate-fade-in-up focus:outline-none max-h-[90vh] overflow-y-auto">
          <RadixAlertDialog.Title className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-1">
            {title}
          </RadixAlertDialog.Title>
          {description && (
            <RadixAlertDialog.Description className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              {description}
            </RadixAlertDialog.Description>
          )}
          {children}
          <div className="flex items-center justify-end gap-2 mt-6">
            <RadixAlertDialog.Cancel asChild>
              <button className="imp-btn px-4 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                {cancelText}
              </button>
            </RadixAlertDialog.Cancel>
            <RadixAlertDialog.Action asChild>
              <button
                onClick={onConfirm}
                className={`imp-btn px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  danger
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100'
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
