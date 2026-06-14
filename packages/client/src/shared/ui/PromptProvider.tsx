import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

import Dialog from '@/shared/ui/Dialog'

interface PromptOptions {
  title: string
  description?: string
  label?: string
  placeholder?: string
  defaultValue?: string
  confirmText?: string
  cancelText?: string
}

type PromptFn = (options: PromptOptions) => Promise<string | null>

const PromptContext = createContext<PromptFn | null>(null)

/**
 * Imperative `prompt()` resolving to the entered string (or null if cancelled),
 * backed by the branded {@link Dialog} — a themed, accessible replacement for
 * `window.prompt`. One instance lives at the app root (beside ConfirmProvider);
 * call sites do `const v = await prompt({ title }); if (v === null) return;`.
 */
const promptProvider = function PromptProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<PromptOptions | null>(null)
  const [value, setValue] = useState('')
  const resolverRef = useRef<((value: string | null) => void) | null>(null)

  const prompt = useCallback<PromptFn>((opts) => {
    setOptions(opts)
    setValue(opts.defaultValue ?? '')
    return new Promise<string | null>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const settle = useCallback((result: string | null) => {
    resolverRef.current?.(result)
    resolverRef.current = null
    setOptions(null)
  }, [])

  return (
    <PromptContext.Provider value={prompt}>
      {children}
      <Dialog
        open={options !== null}
        onOpenChange={(open) => {
          if (!open) settle(null)
        }}
        title={options?.title ?? ''}
        description={options?.description}
        maxWidth="max-w-sm"
      >
        {options && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              settle(value)
            }}
          >
            {options.label && (
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                {options.label}
              </label>
            )}
            <input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={options.placeholder}
              className="w-full px-3 h-10 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
            />
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
              <button
                type="button"
                onClick={() => settle(null)}
                className="imp-btn px-4 h-10 text-sm font-medium text-[var(--color-text-secondary)] bg-transparent hover:bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[var(--radius-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 transition-colors"
              >
                {options.cancelText ?? '취소'}
              </button>
              <button
                type="submit"
                className="imp-btn px-4 h-10 text-sm font-semibold rounded-[var(--radius-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-colors bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 focus-visible:ring-[var(--color-accent)]"
              >
                {options.confirmText ?? '확인'}
              </button>
            </div>
          </form>
        )}
      </Dialog>
    </PromptContext.Provider>
  )
}

export const PromptProvider = promptProvider

export function usePrompt(): PromptFn {
  const ctx = useContext(PromptContext)
  if (!ctx) throw new Error('usePrompt must be used within a PromptProvider')
  return ctx
}
