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
  open, onOpenChange, title, description,
  confirmText = '확인', cancelText = '취소',
  danger = false, onConfirm,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={title} description={description} maxWidth="max-w-sm">
      <div className="flex items-center justify-end gap-2 mt-6">
        <button
          onClick={() => onOpenChange(false)}
          className="imp-btn px-4 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
        >
          {cancelText}
        </button>
        <button
          onClick={() => { onConfirm(); onOpenChange(false); }}
          className={`imp-btn px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            danger
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100'
          }`}
        >
          {confirmText}
        </button>
      </div>
    </Dialog>
  );
}
