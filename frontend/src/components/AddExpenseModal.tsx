import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (expense: any) => void;
  initialGroupId?: string;
  groups: any[];
  users: any[];
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialGroupId,
  groups,
  users
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [groupId, setGroupId] = useState(initialGroupId || '');
  const [payerId, setPayerId] = useState('usr_alex');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Food & Dining');
  const [splitMethod, setSplitMethod] = useState<'equal' | 'exact' | 'percentage'>('equal');
  const [notes, setNotes] = useState('');

  // Participant selection and custom shares
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [exactShares, setExactShares] = useState<Record<string, string>>({});
  const [percentageShares, setPercentageShares] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize or update participants when group changes
  useEffect(() => {
    if (groupId) {
      const selectedGroup = groups.find((g) => g.id === groupId);
      if (selectedGroup && selectedGroup.memberIds && selectedGroup.memberIds.length > 0) {
        setSelectedUserIds(selectedGroup.memberIds);
        return;
      }
    }
    // Default to first 4 users or all users
    if (users.length > 0) {
      setSelectedUserIds(users.slice(0, 4).map((u) => u.id));
    }
  }, [groupId, groups, users]);

  // Set default initialGroupId if provided
  useEffect(() => {
    if (initialGroupId) {
      setGroupId(initialGroupId);
    } else if (groups.length > 0 && !groupId) {
      setGroupId(groups[0].id);
    }
  }, [initialGroupId, groups]);

  if (!isOpen) return null;

  const categories = [
    { name: 'Food & Dining', icon: 'restaurant' },
    { name: 'Transport', icon: 'directions_car' },
    { name: 'Stay', icon: 'hotel' },
    { name: 'Groceries', icon: 'shopping_basket' },
    { name: 'Entertainment', icon: 'attractions' },
    { name: 'Utilities', icon: 'bolt' },
    { name: 'Other', icon: 'more_horiz' }
  ];

  const parsedAmount = parseFloat(amount.replace(/,/g, '')) || 0;
  const participantCount = selectedUserIds.length;
  const equalSharePerPerson = participantCount > 0 ? (parsedAmount / participantCount).toFixed(2) : '0.00';

  // Toggle participant
  const toggleParticipant = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      if (selectedUserIds.length === 1) return; // Must have at least 1
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  // Validation logic
  let isBalanced = true;
  let balanceDiff = 0;

  if (splitMethod === 'exact') {
    const sumExact = selectedUserIds.reduce((sum, id) => sum + (parseFloat(exactShares[id]) || 0), 0);
    balanceDiff = parseFloat((parsedAmount - sumExact).toFixed(2));
    isBalanced = Math.abs(balanceDiff) < 0.01;
  } else if (splitMethod === 'percentage') {
    const sumPct = selectedUserIds.reduce((sum, id) => sum + (parseFloat(percentageShares[id]) || 0), 0);
    balanceDiff = parseFloat((100 - sumPct).toFixed(2));
    isBalanced = Math.abs(balanceDiff) < 0.05;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError('Please enter an expense description.');
      return;
    }

    if (parsedAmount <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }

    if (selectedUserIds.length === 0) {
      setError('Please select at least one participant.');
      return;
    }

    if (!isBalanced) {
      if (splitMethod === 'exact') {
        setError(`Exact shares must total ₹${parsedAmount.toFixed(2)}. Difference: ₹${balanceDiff}`);
      } else if (splitMethod === 'percentage') {
        setError(`Percentages must total 100%. Current sum: ${(100 - balanceDiff).toFixed(1)}%`);
      }
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        description: description.trim(),
        amount: parsedAmount,
        groupId: groupId || null,
        payerId,
        date,
        category,
        splitMethod,
        notes: notes.trim()
      };

      if (splitMethod === 'equal') {
        payload.participantIds = selectedUserIds;
      } else if (splitMethod === 'exact') {
        payload.customShares = selectedUserIds.map((id) => ({
          userId: id,
          amount: parseFloat(exactShares[id]) || 0
        }));
      } else if (splitMethod === 'percentage') {
        payload.percentageShares = selectedUserIds.map((id) => ({
          userId: id,
          percentage: parseFloat(percentageShares[id]) || 0
        }));
      }

      const created = await api.createExpense(payload);
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  const payerUser = users.find((u) => u.id === payerId) || { name: 'Alex Morgan' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Translucent Dimmed Backdrop */}
      <div className="fixed inset-0 bg-[#003b1b]/40 backdrop-blur-[6px] transition-opacity" onClick={onClose} />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-[730px] max-h-[92vh] bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] rounded-[24px] modal-forest-shadow flex flex-col z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E1E3D5] flex items-center justify-between bg-[#FAF9F0]/70">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-secondary-container border border-primary-container flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-primary text-2xl font-bold">receipt</span>
            </div>
            <div>
              <h2 className="text-[20px] font-headline text-primary font-bold leading-snug">Add an Expense</h2>
              <p className="text-[12px] font-body text-on-surface-variant">
                Log a bill, select friends, and split it effortlessly.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-[#E1E3D5] flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all active:scale-95"
            title="Close modal"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-error-container border border-error/30 text-error text-[13px] font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Basic Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Description */}
              <div className="md:col-span-7">
                <label className="block text-[12px] font-label font-bold text-on-surface-variant mb-1.5">
                  Expense Description <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-outline text-xl">
                    edit_note
                  </span>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Fisherman's Wharf Seafood Dinner"
                    className="w-full h-12 pl-11 pr-4 bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] rounded-[14px] text-[14px] font-body text-on-surface focus:border-primary-container focus:ring-2 focus:ring-secondary-container focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Amount in INR */}
              <div className="md:col-span-5">
                <label className="block text-[12px] font-label font-bold text-on-surface-variant mb-1.5">
                  Amount (INR) <span className="text-error">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-primary font-headline font-extrabold text-2xl pointer-events-none">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-12 pl-10 pr-12 bg-[#FAF9F0] border-[1.5px] border-[#E1E3D5] rounded-[14px] text-primary text-[20px] font-headline font-bold focus:border-primary-container focus:ring-2 focus:ring-secondary-container focus:outline-none transition-all"
                  />
                  <span className="absolute right-3 px-2 py-0.5 text-[10px] font-bold rounded-md bg-secondary-container text-primary uppercase">
                    INR
                  </span>
                </div>
              </div>
            </div>

            {/* Group, Payer, Date Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Group */}
              <div>
                <label className="block text-[12px] font-label font-semibold text-on-surface-variant mb-1">
                  In Group
                </label>
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="w-full h-11 px-3 bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] rounded-[14px] text-[13px] font-body text-on-surface focus:border-primary-container focus:outline-none cursor-pointer"
                >
                  <option value="">Non-group expense</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Paid By */}
              <div>
                <label className="block text-[12px] font-label font-semibold text-on-surface-variant mb-1">
                  Paid by
                </label>
                <select
                  value={payerId}
                  onChange={(e) => setPayerId(e.target.value)}
                  className="w-full h-11 px-3 bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] rounded-[14px] text-[13px] font-body text-on-surface focus:border-primary-container focus:outline-none cursor-pointer"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} {u.id === 'usr_alex' ? '(You)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-[12px] font-label font-semibold text-on-surface-variant mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-11 px-3 bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] rounded-[14px] text-[13px] font-body text-on-surface focus:border-primary-container focus:outline-none"
                />
              </div>
            </div>

            {/* Category Tags */}
            <div>
              <label className="block text-[12px] font-label font-semibold text-on-surface-variant mb-2">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => {
                  const isActive = category === c.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setCategory(c.name)}
                      className={`px-3.5 py-1.5 rounded-full text-[12px] font-label flex items-center gap-1.5 transition-all ${
                        isActive
                          ? 'bg-secondary-container border-[1.5px] border-primary-container text-primary font-bold shadow-xs'
                          : 'bg-surface-container-lowest border border-[#E1E3D5] hover:border-outline text-on-surface-variant'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">{c.icon}</span>
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Split Method Selector */}
          <div className="border-t border-[#E1E3D5] pt-4">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-[14px] font-headline font-bold text-primary">Split Method</label>
              <span className="text-[12px] font-body text-on-surface-variant">
                {selectedUserIds.length} of {users.length} members participating
              </span>
            </div>

            {/* 3 Split Method Tabs */}
            <div className="grid grid-cols-3 p-1 bg-surface-container-high rounded-[16px] border border-[#E1E3D5] text-center">
              <button
                type="button"
                onClick={() => setSplitMethod('equal')}
                className={`py-2 rounded-xl text-[12px] font-label font-bold flex items-center justify-center gap-1.5 transition-all ${
                  splitMethod === 'equal'
                    ? 'bg-surface-container-lowest text-primary shadow-xs border border-[#E1E3D5]'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-base text-surface-tint">equalizer</span>
                <span>Split Equally</span>
              </button>

              <button
                type="button"
                onClick={() => setSplitMethod('exact')}
                className={`py-2 rounded-xl text-[12px] font-label font-bold flex items-center justify-center gap-1.5 transition-all ${
                  splitMethod === 'exact'
                    ? 'bg-surface-container-lowest text-primary shadow-xs border border-[#E1E3D5]'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                <span className="font-bold text-sm">₹</span>
                <span>Exact Amounts</span>
              </button>

              <button
                type="button"
                onClick={() => setSplitMethod('percentage')}
                className={`py-2 rounded-xl text-[12px] font-label font-bold flex items-center justify-center gap-1.5 transition-all ${
                  splitMethod === 'percentage'
                    ? 'bg-surface-container-lowest text-primary shadow-xs border border-[#E1E3D5]'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-base">percent</span>
                <span>Percentages</span>
              </button>
            </div>
          </div>

          {/* Section 3: Participant Split Breakdown */}
          <div className="space-y-3 bg-[#FAF9F0]/60 p-4 rounded-[20px] border border-[#E1E3D5]">
            <div className="flex items-center justify-between pb-1">
              <span className="text-[13px] font-label font-bold text-primary">Participants & Share breakdown</span>
              <button
                type="button"
                onClick={() => setSelectedUserIds(users.map((u) => u.id))}
                className="text-[12px] text-surface-tint hover:underline font-semibold"
              >
                Select all
              </button>
            </div>

            {/* Participant Rows */}
            <div className="space-y-2">
              {users.map((u) => {
                const isSelected = selectedUserIds.includes(u.id);
                const isPayer = u.id === payerId;

                return (
                  <div
                    key={u.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                      isSelected
                        ? 'bg-surface-container-lowest border-[#E1E3D5] shadow-xs'
                        : 'bg-[#FAF9F0] border-dashed border-[#E1E3D5] opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleParticipant(u.id)}
                        className="w-4 h-4 rounded text-primary-container focus:ring-secondary-container"
                      />
                      <div className="w-8 h-8 rounded-full bg-secondary-container/70 border border-primary-container/40 flex items-center justify-center font-bold text-primary text-xs">
                        {u.initials || u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-[13px] font-label font-bold text-primary flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {isPayer && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-secondary-container rounded font-bold text-primary">
                              Payer
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-on-surface-variant">
                          {isSelected ? (isPayer ? 'Pays bill upfront' : 'Participating') : 'Opted out'}
                        </div>
                      </div>
                    </div>

                    {/* Right: Dynamic Share Value or Input */}
                    <div className="text-right">
                      {isSelected ? (
                        splitMethod === 'equal' ? (
                          <>
                            <div className="text-[14px] font-headline font-bold text-primary font-tabular">
                              ₹{equalSharePerPerson}
                            </div>
                            <div className="text-[10px] text-on-surface-variant">
                              {participantCount > 0 ? (100 / participantCount).toFixed(1) : 0}% share
                            </div>
                          </>
                        ) : splitMethod === 'exact' ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-primary">₹</span>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={exactShares[u.id] || ''}
                              onChange={(e) =>
                                setExactShares({ ...exactShares, [u.id]: e.target.value })
                              }
                              className="w-24 h-8 px-2 text-right rounded-lg border border-[#E1E3D5] text-[13px] font-bold text-primary focus:outline-none focus:border-primary-container"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.1"
                              placeholder="0"
                              value={percentageShares[u.id] || ''}
                              onChange={(e) =>
                                setPercentageShares({ ...percentageShares, [u.id]: e.target.value })
                              }
                              className="w-16 h-8 px-2 text-right rounded-lg border border-[#E1E3D5] text-[13px] font-bold text-primary focus:outline-none focus:border-primary-container"
                            />
                            <span className="text-xs font-bold text-primary">%</span>
                          </div>
                        )
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-container border border-[#E1E3D5] text-on-surface-variant">
                          Excluded
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Split Summary Callout Banner */}
            <div className="mt-4 p-3.5 bg-surface-container-high rounded-[16px] border border-[#E1E3D5] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-surface-container-lowest border border-[#E1E3D5] flex items-center justify-center text-primary font-bold">
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      isBalanced ? 'text-surface-tint' : 'text-error'
                    }`}
                  >
                    {isBalanced ? 'check_circle' : 'warning'}
                  </span>
                </div>
                <div>
                  <div className="text-[13px] font-headline font-bold text-primary flex items-center gap-2">
                    <span>
                      {splitMethod === 'equal'
                        ? `₹${equalSharePerPerson} / person`
                        : isBalanced
                        ? 'Custom split balanced'
                        : 'Custom shares do not match'}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-container-lowest font-medium border border-[#E1E3D5] text-on-surface-variant">
                      {participantCount} people
                    </span>
                  </div>
                  <div className="text-[11px] text-on-surface-variant">
                    {payerUser.name} pays ₹{parsedAmount.toFixed(2)} upfront.
                  </div>
                </div>
              </div>

              <div className="hidden sm:block text-right">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                    isBalanced
                      ? 'bg-surface-container-lowest border-[#E1E3D5] text-surface-tint'
                      : 'bg-error-container border-error/30 text-error'
                  }`}
                >
                  <span>{isBalanced ? 'Balanced' : `Diff: ₹${Math.abs(balanceDiff)}`}</span>
                  <span className="material-symbols-outlined text-[14px]">
                    {isBalanced ? 'done_all' : 'close'}
                  </span>
                </span>
                <div className="text-[10px] text-on-surface-variant mt-0.5 font-tabular">
                  Total ₹{parsedAmount.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Notes */}
          <div>
            <label className="block text-[12px] font-label font-semibold text-on-surface-variant mb-1">
              Optional Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Tip included 10%, beach chair rent"
              className="w-full h-11 px-3.5 bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] rounded-[14px] text-[13px] font-body text-on-surface placeholder:text-outline focus:border-primary-container focus:outline-none"
            />
          </div>
        </form>

        {/* Modal Actions Footer */}
        <div className="px-6 py-4 border-t border-[#E1E3D5] bg-surface-container-lowest flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[12px] text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-surface-tint"></span>
            <span>Instant balance sync with all participants.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-[14px] border-[1.5px] border-[#E1E3D5] hover:bg-surface-container-high text-primary font-bold text-[13px] transition-colors"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !isBalanced}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-[14px] bg-primary-container hover:bg-primary text-on-primary font-bold text-[13px] shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">check</span>
              <span>{loading ? 'Saving...' : '+ Save Expense'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
