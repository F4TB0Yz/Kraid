import { useToastStore } from '../../store/toastStore';
import { CheckIcon } from '../icons';

export const ToastProvider = () => {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-2 rounded-lg bg-text px-4 py-3 text-sm text-bg shadow-xl animate-message-slide-up"
        >
          {toast.type === 'success' && <CheckIcon className="h-4 w-4 text-green-400" />}
          {toast.message}
        </div>
      ))}
    </div>
  );
};