import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'receipt_long',
  title,
  description,
  actionText,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] rounded-[20px] ambient-card my-4">
      <div className="w-14 h-14 rounded-2xl bg-surface-container-low text-primary flex items-center justify-center mb-3">
        <span className="material-symbols-outlined text-3xl text-surface-tint">{icon}</span>
      </div>
      <h3 className="text-[18px] font-headline font-bold text-primary">{title}</h3>
      <p className="text-[13px] font-body text-on-surface-variant max-w-sm mt-1 mb-4 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="butter-button font-label text-[13px] px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
};
