import { useToastStore } from '../../store/toastStore';
import { CheckIcon, CloseIcon } from '../icons';

export const ToastProvider = () => {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  const typeStyles: Record<string, string> = {
    success: 'text-green-400',
    error: 'text-error',
    info: 'text-accent',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-3 rounded-lg bg-text px-4 py-3 text-sm text-bg shadow-xl animate-message-slide-up"
        >
          {toast.type === 'success' && <CheckIcon className={`h-4 w-4 ${typeStyles[toast.type]}`} />}
          <span className="flex-1">{toast.message}</span>
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="whitespace-nowrap rounded bg-ivory/20 px-2 py-0.5 text-xs font-medium transition-colors hover:bg-ivory/30"
            >
              {toast.action.label}
            </button>
          )}
          <button
            onClick={() => removeToast(toast.id)}
            className="rounded p-0.5 text-warm-silver/60 transition-colors hover:text-warm-silver"
          >
            <CloseIcon className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
};
