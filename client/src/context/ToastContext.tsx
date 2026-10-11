import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastItem = { id, type, message };
    setToasts((prev) => [...prev.slice(-4), newToast]); // Keep max 5 toasts

    setTimeout(() => {
      removeToast(id);
    }, 3800);
  }, [removeToast]);

  const success = useCallback((msg: string) => showToast(msg, 'success'), [showToast]);
  const error = useCallback((msg: string) => showToast(msg, 'error'), [showToast]);
  const info = useCallback((msg: string) => showToast(msg, 'info'), [showToast]);
  const warning = useCallback((msg: string) => showToast(msg, 'warning'), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}

      {/* Floating Modern Toast Stack Container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          let bgClass = 'bg-white border-zinc-200/90 text-zinc-800';
          let icon = <Info className="w-4 h-4 text-indigo-600 flex-shrink-0" />;

          if (toast.type === 'success') {
            bgClass = 'bg-white border-emerald-200/80 text-zinc-900 shadow-emerald-500/5';
            icon = <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />;
          } else if (toast.type === 'error') {
            bgClass = 'bg-white border-rose-200/80 text-zinc-900 shadow-rose-500/5';
            icon = <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />;
          } else if (toast.type === 'warning') {
            bgClass = 'bg-white border-amber-200/80 text-zinc-900 shadow-amber-500/5';
            icon = <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto p-3.5 rounded-2xl border shadow-lg backdrop-blur-md flex items-center justify-between gap-3 transition-all duration-200 animate-in slide-in-from-bottom-5 fade-in ${bgClass}`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                {icon}
                <span className="text-xs font-semibold leading-snug break-words">
                  {toast.message}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg hover:bg-zinc-100 transition flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
