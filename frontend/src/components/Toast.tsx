import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  durationMs?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  onClose,
  durationMs = 4000
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, durationMs);
    return () => clearTimeout(timer);
  }, [onClose, durationMs]);

  const bgStyles = {
    success: 'bg-[#DDEBD8] border-primary-container/40 text-primary',
    error: 'bg-error-container border-error/40 text-error',
    info: 'bg-secondary-container border-primary-container text-primary'
  }[type];

  const iconName = {
    success: 'check_circle',
    error: 'error',
    info: 'info'
  }[type];

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-forest-ambient ${bgStyles}`}>
        <span className="material-symbols-outlined text-[20px]">{iconName}</span>
        <span className="text-[13px] font-label font-bold">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 text-current opacity-70 hover:opacity-100 p-0.5 rounded-full"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    </div>
  );
};
