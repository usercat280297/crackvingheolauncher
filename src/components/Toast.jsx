import React, { useState, createContext, useContext, useCallback } from 'react';
import { Check, AlertCircle, X, Info } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now();
    const toast = { id, message, type };

    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const value = { addToast, removeToast };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-3 pointer-events-none">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

const Toast = ({ toast, onRemove }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <Check className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getColors = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-600 text-green-50';
      case 'error':
        return 'bg-red-600 text-red-50';
      case 'info':
        return 'bg-blue-600 text-blue-50';
      default:
        return 'bg-gray-800 text-gray-50';
    }
  };

  return (
    <div
      className={`pointer-events-auto rounded-lg p-4 flex items-start gap-3 shadow-lg animate-in slide-in-from-right-5 ${getColors()}`}
      role="alert"
    >
      {getIcon()}
      <div className="flex-1">{toast.message}</div>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-current hover:opacity-75 flex-shrink-0"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};
