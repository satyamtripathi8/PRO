import { useState, useCallback, useRef } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

let globalShowToast: ((message: string, type?: ToastType, duration?: number) => void) | null = null;

// Call from anywhere — even outside React components
export function showToastGlobal(message: string, type: ToastType = 'info', duration = 3500) {
  globalShowToast?.(message, type, duration);
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3500) => {
    const id = `toast-${++counterRef.current}-${Date.now()}`;
    const toast: Toast = { id, message, type, duration };

    setToasts(prev => [...prev.slice(-4), toast]); // Max 5 visible

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Register global handler
  globalShowToast = showToast;

  return { toasts, showToast, dismissToast };
}
