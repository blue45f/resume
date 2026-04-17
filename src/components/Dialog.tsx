import * as RadixDialog from '@radix-ui/react-dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Dialog({ open, onOpenChange, title, description, children, maxWidth = 'max-w-lg' }: Props) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm animate-fade-in" />
        <RadixDialog.Content className={`fixed z-[91] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] ${maxWidth} bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 animate-fade-in-up focus:outline-none`}>
          {title && (
            <RadixDialog.Title className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-1">
              {title}
            </RadixDialog.Title>
          )}
          {description && (
            <RadixDialog.Description className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              {description}
            </RadixDialog.Description>
          )}
          {children}
          <RadixDialog.Close asChild>
            <button className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" aria-label="닫기">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </RadixDialog.Close>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
