import { useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export function ToastDisplay() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }) {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-950/80 border-green-500/30';
      case 'error':
        return 'bg-red-950/80 border-red-500/30';
      case 'warning':
        return 'bg-yellow-950/80 border-yellow-500/30';
      case 'info':
      default:
        return 'bg-blue-950/80 border-blue-500/30';
    }
  };

  const getTextColor = () => {
    switch (toast.type) {
      case 'success':
        return 'text-green-300';
      case 'error':
        return 'text-red-300';
      case 'warning':
        return 'text-yellow-300';
      case 'info':
      default:
        return 'text-blue-300';
    }
  };

  return (
    <div
      className={`flex gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm pointer-events-auto animate-in fade-in slide-in-from-right-4 ${getBackgroundColor()}`}
      role="alert"
    >
      {getIcon()}
      <p className={`text-sm font-medium ${getTextColor()}`}>{toast.message}</p>
    </div>
  );
}
