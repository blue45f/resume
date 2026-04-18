import Dialog from '@/shared/ui/Dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = '확인',
  cancelText = '취소',
  danger = false,
  onConfirm,
}: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      maxWidth="max-w-sm"
    >
      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="imp-btn px-4 h-10 text-sm font-medium text-[var(--color-text-secondary)]
                     bg-transparent hover:bg-[var(--color-surface-sunken)]
                     border border-[var(--color-border)]
                     rounded-[var(--radius-md)]
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2
                     transition-colors"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onOpenChange(false);
          }}
          className={`imp-btn px-4 h-10 text-sm font-semibold rounded-[var(--radius-md)]
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                     transition-colors ${
                       danger
                         ? 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500'
                         : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 focus-visible:ring-[var(--color-accent)]'
                     }`}
        >
          {confirmText}
        </button>
      </div>
    </Dialog>
  );
}
