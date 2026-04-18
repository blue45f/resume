import { toast as sonnerToast, Toaster } from 'sonner';

type ToastType = 'success' | 'error' | 'info' | 'warning';

export function toast(text: string, type: ToastType = 'info') {
  switch (type) {
    case 'success':
      sonnerToast.success(text);
      break;
    case 'error':
      sonnerToast.error(text);
      break;
    case 'warning':
      sonnerToast.warning(text);
      break;
    default:
      sonnerToast.info(text);
  }
}

export function ToastContainer() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 3000,
        className: 'text-sm',
        style: { borderRadius: '0.75rem' },
      }}
      richColors
      closeButton
    />
  );
}
