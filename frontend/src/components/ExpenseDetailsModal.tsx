import React, { useState } from 'react';
import { api } from '../api/client';

interface ExpenseDetailsModalProps {
  expense: any | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (expenseId: string) => void;
  onUpdated: (expense: any) => void;
}

export const ExpenseDetailsModal: React.FC<ExpenseDetailsModalProps> = ({
  expense,
  isOpen,
  onClose,
  onDeleted,
  onUpdated
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !expense) return null;

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${expense.description}"? This will recalculate all balances.`)) {
      return;
    }
    setIsDeleting(true);
    setError(null);
    try {
      await api.deleteExpense(expense.id);
      onDeleted(expense.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete expense');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-[#003b1b]/40 backdrop-blur-[6px]" onClick={onClose} />
      <div className="relative w-full max-w-[560px] bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] rounded-[24px] modal-forest-shadow flex flex-col z-10 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E1E3D5] flex items-center justify-between bg-[#FAF9F0]/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary-container border border-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl font-bold">receipt_long</span>
            </div>
            <div>
              <h2 className="text-[18px] font-headline text-primary font-bold">Expense Details</h2>
              <span className="text-[12px] text-on-surface-variant">{expense.groupName || 'Non-group'}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#E1E3D5] flex items-center justify-center text-outline hover:text-primary"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-error-container text-error text-[13px] font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Amount & Description */}
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-surface-container border border-[#E1E3D5] text-on-surface-variant font-bold">
                {expense.category}
              </span>
              <h3 className="text-[20px] font-headline font-bold text-primary mt-1.5">{expense.description}</h3>
              <p className="text-[12px] text-on-surface-variant mt-0.5">
                Paid by <strong className="text-primary font-bold">{expense.payerName}</strong> on{' '}
                {new Date(expense.date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-on-surface-variant font-medium">Total Bill</span>
              <div className="text-[24px] font-headline font-extrabold text-primary font-tabular">
                ₹{Number(expense.amount).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Notes if available */}
          {expense.notes && (
            <div className="p-3 rounded-xl bg-[#FAF9F0] border border-[#E1E3D5] text-[13px] text-on-surface flex items-start gap-2">
              <span className="material-symbols-outlined text-outline text-lg">notes</span>
              <span>{expense.notes}</span>
            </div>
          )}

          {/* Participant Breakdown */}
          <div>
            <h4 className="text-[13px] font-label font-bold text-primary mb-2 flex items-center justify-between">
              <span>Split Breakdown ({expense.splitMethod})</span>
              <span className="text-[11px] text-on-surface-variant font-normal">
                {expense.shares?.length || 0} participants
              </span>
            </h4>
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {expense.shares?.map((s: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF9F0] border border-[#E1E3D5] text-[13px]"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center font-bold text-xs text-primary">
                      {s.userId?.replace('usr_', '').substring(0, 2).toUpperCase()}
                    </div>
                    <span className="font-medium text-primary">
                      {s.userId === expense.payerId ? `${expense.payerName} (Payer)` : s.userId}
                    </span>
                  </div>
                  <div className="text-right font-tabular">
                    <span className="font-bold text-primary">₹{Number(s.shareAmount).toFixed(2)}</span>
                    {s.percentage && <span className="text-[11px] text-outline ml-1.5">({s.percentage}%)</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#E1E3D5] bg-[#FAF9F0] flex items-center justify-between">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-error font-bold text-[13px] hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            <span>{isDeleting ? 'Deleting...' : 'Delete Expense'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-primary-container text-on-primary font-bold text-[13px] hover:bg-primary transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
