import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

import ConfirmDialog from '@/shared/ui/ConfirmDialog';

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Imperative `confirm()` resolving to a boolean, backed by the branded
 * {@link ConfirmDialog} — a themed, accessible replacement for `window.confirm`.
 * One instance lives at the app root; call sites do
 * `if (!(await confirm({ title, danger: true }))) return;`.
 */
const confirmProvider = function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  // Guarded so the double-call in ConfirmDialog's confirm button
  // (onConfirm() then onOpenChange(false)) resolves exactly once.
  const settle = useCallback((result: boolean) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setOptions(null);
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) settle(false);
          }}
          title={options.title}
          description={options.description}
          confirmText={options.confirmText}
          cancelText={options.cancelText}
          danger={options.danger}
          onConfirm={() => settle(true)}
        />
      )}
    </ConfirmContext.Provider>
  );
};

export const ConfirmProvider = confirmProvider;

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider');
  return ctx;
}
