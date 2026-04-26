import * as RadixDialog from '@radix-ui/react-dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
}: Props) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay
          className="fixed inset-0 z-[90] bg-neutral-950/55
                     data-[state=open]:animate-in data-[state=open]:fade-in-0
                     data-[state=closed]:animate-out data-[state=closed]:fade-out-0
                     motion-reduce:animate-none"
        />
        <RadixDialog.Content
          className={`fixed z-[91] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                     w-[calc(100%-2rem)] ${maxWidth}
                     bg-[var(--color-surface)] text-[var(--color-text)]
                     rounded-[var(--radius-lg)]
                     border border-[var(--color-border-subtle)]
                     shadow-[var(--shadow-hover)]
                     px-6 py-6 sm:px-7 sm:py-7
                     data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98] data-[state=open]:slide-in-from-top-1
                     data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.98]
                     motion-reduce:animate-none
                     focus:outline-none
                     max-h-[calc(100dvh-3rem)] overflow-y-auto`}
        >
          {title && (
            <RadixDialog.Title className="text-[17px] sm:text-lg font-semibold tracking-tight text-[var(--color-text)] mb-1 pr-8">
              {title}
            </RadixDialog.Title>
          )}
          {description && (
            <RadixDialog.Description className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-5 pr-8">
              {description}
            </RadixDialog.Description>
          )}
          {children}
          <RadixDialog.Close asChild>
            <button
              type="button"
              className="absolute top-3 right-3 inline-flex items-center justify-center
                         h-9 w-9 rounded-full
                         text-[var(--color-text-muted)]
                         hover:text-[var(--color-text)] hover:bg-[var(--color-surface-sunken)]
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2
                         transition-colors"
              aria-label="닫기"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </RadixDialog.Close>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
