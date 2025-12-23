import { createContext, useState, useCallback } from 'react';

export const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback({
    success: (message, duration = 3000) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type: 'success' }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    },
    error: (message, duration = 3000) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type: 'error' }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    },
    info: (message, duration = 3000) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type: 'info' }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    },
    warning: (message, duration = 3000) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type: 'warning' }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  return (
    <ToastContext.Provider value={{ toast, toasts }}>
      {children}
    </ToastContext.Provider>
  );
}
