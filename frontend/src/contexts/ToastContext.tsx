'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'error' | 'success' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number; // in ms
}

interface ToastContextType {
  toast: {
    show: (message: string, type?: ToastType, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    success: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 3500) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = { id, message, type, duration };

      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const toastMethods = {
    show,
    error: (msg: string, duration = 3500) => show(msg, 'error', duration),
    success: (msg: string, duration = 3500) => show(msg, 'success', duration),
    warning: (msg: string, duration = 3500) => show(msg, 'warning', duration),
    info: (msg: string, duration = 3500) => show(msg, 'info', duration),
  };

  return (
    <ToastContext.Provider value={{ toast: toastMethods }}>
      {children}

      {/* ── Fixed Toast Container (Top Right) ── */}
      <div
        className="fixed top-5 right-5 z-[99999] flex flex-col gap-3 max-w-[360px] sm:max-w-md w-full pointer-events-none px-3 sm:px-0"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const config = {
            error: {
              bg: 'bg-rose-500 text-white',
              bar: 'bg-black/90',
              icon: AlertCircle,
              title: 'Error',
            },
            success: {
              bg: 'bg-emerald-400 text-slate-950',
              bar: 'bg-black/80',
              icon: CheckCircle2,
              title: 'Success',
            },
            warning: {
              bg: 'bg-yellow-400 text-slate-950',
              bar: 'bg-black/80',
              icon: AlertTriangle,
              title: 'Notice',
            },
            info: {
              bg: 'bg-cyan-400 text-slate-950',
              bar: 'bg-black/80',
              icon: Info,
              title: 'Information',
            },
          }[t.type];

          const IconComponent = config.icon;

          return (
            <div
              key={t.id}
              className={`animate-toast-in pointer-events-auto overflow-hidden border-2 border-black rounded-sm shadow-[4px_4px_0px_#000] ${config.bg} transition-all duration-200`}
            >
              {/* Toast Body */}
              <div className="flex items-start gap-3 p-3.5 pr-2.5">
                <div className="p-1 rounded bg-black text-white shrink-0 mt-0.5">
                  <IconComponent className="w-4 h-4 stroke-[2.5px]" />
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  <div className="text-[10px] font-mono font-black uppercase tracking-wider opacity-80 mb-0.5">
                    {config.title}
                  </div>
                  <div className="text-xs sm:text-sm font-bold leading-snug break-words">
                    {t.message}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  className="p-1 text-black/60 hover:text-black hover:bg-black/10 rounded transition-colors shrink-0 cursor-pointer"
                  aria-label="Close notification"
                >
                  <X className="w-4 h-4 stroke-[2.5px]" />
                </button>
              </div>

              {/* Shrinking Progress Bar at Bottom */}
              <div className="w-full h-1.5 bg-black/20 overflow-hidden">
                <div
                  className={`h-full ${config.bar}`}
                  style={{
                    animation: `toastProgress ${t.duration}ms linear forwards`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
}

