import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (settlement: any) => void;
  initialPayerId?: string;
  initialRecipientId?: string;
  initialAmount?: number;
  initialGroupId?: string;
  users: any[];
  groups: any[];
}

export const SettleUpModal: React.FC<SettleUpModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialPayerId = 'usr_alex',
  initialRecipientId = '',
  initialAmount = 0,
  initialGroupId = '',
  users,
  groups
}) => {
  const [payerId, setPayerId] = useState(initialPayerId);
  const [recipientId, setRecipientId] = useState(initialRecipientId);
  const [amount, setAmount] = useState(initialAmount > 0 ? initialAmount.toFixed(2) : '');
  const [groupId, setGroupId] = useState(initialGroupId);
  const [method, setMethod] = useState('UPI');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialPayerId) setPayerId(initialPayerId);
    if (initialRecipientId) setRecipientId(initialRecipientId);
    if (initialAmount > 0) setAmount(initialAmount.toFixed(2));
    if (initialGroupId) setGroupId(initialGroupId);
  }, [initialPayerId, initialRecipientId, initialAmount, initialGroupId]);

  if (!isOpen) return null;

  const paymentMethods = ['UPI', 'Cash', 'Bank Transfer', 'Other'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid payment amount greater than zero.');
      return;
    }

    if (!payerId || !recipientId) {
      setError('Both payer and recipient must be selected.');
      return;
    }

    if (payerId === recipientId) {
      setError('Payer and recipient cannot be the same person.');
      return;
    }

    setLoading(true);

    try {
      const created = await api.createSettlement({
        payerId,
        recipientId,
        amount: numAmount,
        groupId: groupId || null,
        method,
        notes: notes.trim()
      });
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record settlement');
    } finally {
      setLoading(false);
    }
  };

  const payer = users.find((u) => u.id === payerId);
  const recipient = users.find((u) => u.id === recipientId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-[#003b1b]/40 backdrop-blur-[6px]" onClick={onClose} />
      <div className="relative w-full max-w-[520px] bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] rounded-[24px] modal-forest-shadow flex flex-col z-10 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E1E3D5] flex items-center justify-between bg-[#FAF9F0]/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary-container border border-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl font-bold">payments</span>
            </div>
            <div>
              <h2 className="text-[18px] font-headline text-primary font-bold">Settle Up</h2>
              <p className="text-[12px] text-on-surface-variant">Record a direct payment between friends.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#E1E3D5] flex items-center justify-center text-outline hover:text-primary"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-error-container text-error text-[13px] font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Transfer Visualizer */}
          <div className="p-4 rounded-xl bg-[#FAF9F0] border border-[#E1E3D5] flex items-center justify-between">
            <div className="text-center flex-1">
              <div className="w-10 h-10 mx-auto rounded-full bg-secondary-container flex items-center justify-center font-bold text-primary text-sm border border-[#E1E3D5]">
                {payer?.initials || 'P'}
              </div>
              <div className="text-[12px] font-bold text-primary mt-1 truncate">{payer?.name || 'Payer'}</div>
              <div className="text-[10px] text-on-surface-variant">Payer</div>
            </div>

            <div className="flex flex-col items-center px-3">
              <span className="text-[11px] font-bold text-primary font-tabular">
                ₹{parseFloat(amount || '0').toFixed(2)}
              </span>
              <span className="material-symbols-outlined text-[#21864A] text-2xl">arrow_forward</span>
            </div>

            <div className="text-center flex-1">
              <div className="w-10 h-10 mx-auto rounded-full bg-[#DDEBD8] flex items-center justify-center font-bold text-primary text-sm border border-[#E1E3D5]">
                {recipient?.initials || 'R'}
              </div>
              <div className="text-[12px] font-bold text-primary mt-1 truncate">{recipient?.name || 'Recipient'}</div>
              <div className="text-[10px] text-on-surface-variant">Recipient</div>
            </div>
          </div>

          {/* Payer and Recipient Dropdowns */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-label font-bold text-on-surface-variant mb-1">
                Who Paid?
              </label>
              <select
                value={payerId}
                onChange={(e) => setPayerId(e.target.value)}
                className="w-full h-11 px-3 bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] rounded-[14px] text-[13px] text-on-surface focus:border-primary-container focus:outline-none"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.id === 'usr_alex' ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-label font-bold text-on-surface-variant mb-1">
                Who Received?
              </label>
              <select
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className="w-full h-11 px-3 bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] rounded-[14px] text-[13px] text-on-surface focus:border-primary-container focus:outline-none"
              >
                <option value="">Select friend</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.id === 'usr_alex' ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-[12px] font-label font-bold text-on-surface-variant mb-1">
              Amount (INR) <span className="text-error">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-primary font-headline font-bold text-xl pointer-events-none">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full h-12 pl-9 pr-4 bg-[#FAF9F0] border-[1.5px] border-[#E1E3D5] rounded-[14px] text-primary text-[18px] font-headline font-bold focus:border-primary-container focus:outline-none"
              />
            </div>
          </div>

          {/* Group and Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-label font-semibold text-on-surface-variant mb-1">
                For Group (Optional)
              </label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full h-10 px-3 bg-surface-container-lowest border border-[#E1E3D5] rounded-xl text-[12px] text-on-surface focus:outline-none"
              >
                <option value="">General settlement</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-label font-semibold text-on-surface-variant mb-1">
                Payment Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full h-10 px-3 bg-surface-container-lowest border border-[#E1E3D5] rounded-xl text-[12px] text-on-surface focus:outline-none"
              >
                {paymentMethods.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[12px] font-label font-semibold text-on-surface-variant mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Google Pay reference ID"
              className="w-full h-10 px-3 bg-surface-container-lowest border border-[#E1E3D5] rounded-xl text-[12px] text-on-surface focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E1E3D5]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E1E3D5] text-[13px] font-bold text-primary hover:bg-[#FAF9F0]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="butter-button px-5 py-2 rounded-xl text-[13px] font-bold shadow-xs"
            >
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
