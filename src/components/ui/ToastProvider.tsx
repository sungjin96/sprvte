'use client';

import { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Toast, ToastData, ToastType } from './Toast';

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info', duration = 3500) => {
    const id = `toast-${++counter.current}`;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const success = useCallback((msg: string, d?: number) => toast(msg, 'success', d), [toast]);
  const error = useCallback((msg: string, d?: number) => toast(msg, 'error', d), [toast]);
  const info = useCallback((msg: string, d?: number) => toast(msg, 'info', d), [toast]);
  const warning = useCallback((msg: string, d?: number) => toast(msg, 'warning', d), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 items-end pointer-events-none">
            {toasts.map((t) => (
              <div key={t.id} className="pointer-events-auto">
                <Toast {...t} onDismiss={dismiss} />
              </div>
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export { ToastProvider, useToast };
