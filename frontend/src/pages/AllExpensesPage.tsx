import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { EmptyState } from '../components/EmptyState';
import { ExpenseDetailsModal } from '../components/ExpenseDetailsModal';

interface AllExpensesPageProps {
  onOpenAddExpense: () => void;
}

export const AllExpensesPage: React.FC<AllExpensesPageProps> = ({ onOpenAddExpense }) => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expList, grpList] = await Promise.all([api.getExpenses(), api.getGroups()]);
      setExpenses(expList);
      setGroups(grpList);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const categories = ['all', 'Food & Dining', 'Transport', 'Stay', 'Groceries', 'Utilities', 'Entertainment'];

  const filteredExpenses = expenses.filter((e) => {
    const matchesGroup = selectedGroup === 'all' || e.groupId === selectedGroup;
    const matchesCategory = selectedCategory === 'all' || e.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      search === '' ||
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      (e.notes && e.notes.toLowerCase().includes(search.toLowerCase())) ||
      e.payerName.toLowerCase().includes(search.toLowerCase()) ||
      (e.groupName && e.groupName.toLowerCase().includes(search.toLowerCase()));

    return matchesGroup && matchesCategory && matchesSearch;
  });

  // Calculate current user metrics across expenses
  const currentUserId = 'usr_alex';
  let totalUserPaid = 0;
  let totalUserShare = 0;

  for (const exp of expenses) {
    if (exp.payerId === currentUserId) {
      totalUserPaid += exp.amount;
    }
    const myShare = exp.shares?.find((s: any) => s.userId === currentUserId);
    if (myShare) {
      totalUserShare += myShare.shareAmount;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-headline font-bold text-primary tracking-tight">All Expenses</h1>
          <p className="text-[13px] font-body text-on-surface-variant mt-1">
            Comprehensive ledger of all bills and shared payments.
          </p>
        </div>

        <button
          onClick={onOpenAddExpense}
          className="butter-button font-label text-[13px] px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs w-fit"
        >
          <span className="material-symbols-outlined text-[18px] font-bold">add</span>
          <span>+ Add Expense</span>
        </button>
      </div>

      {/* Top 3 Summary Cards matching Stitch */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-[#E1E3D5] rounded-2xl p-5 ambient-card">
          <div className="text-[12px] font-label font-bold text-on-surface-variant uppercase tracking-wider">
            Total You Paid
          </div>
          <div className="text-[26px] font-headline font-extrabold text-primary mt-1 font-tabular">
            ₹{totalUserPaid.toFixed(2)}
          </div>
          <p className="text-[11px] text-outline mt-0.5">Across all shared activities</p>
        </div>

        <div className="bg-surface-container-lowest border border-[#E1E3D5] rounded-2xl p-5 ambient-card">
          <div className="text-[12px] font-label font-bold text-[#21864A] uppercase tracking-wider">
            Your Assigned Shares
          </div>
          <div className="text-[26px] font-headline font-extrabold text-primary mt-1 font-tabular">
            ₹{totalUserShare.toFixed(2)}
          </div>
          <p className="text-[11px] text-outline mt-0.5">Total consumption across bills</p>
        </div>

        <div className="bg-surface-container-lowest border border-[#E1E3D5] rounded-2xl p-5 ambient-card">
          <div className="text-[12px] font-label font-bold text-secondary uppercase tracking-wider">
            Total Expenses Count
          </div>
          <div className="text-[26px] font-headline font-extrabold text-primary mt-1 font-tabular">
            {expenses.length} bills
          </div>
          <p className="text-[11px] text-outline mt-0.5">Stored in shared database</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="p-3.5 bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] rounded-[18px] ambient-card space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Group Filter Dropdown */}
          <div className="flex items-center gap-2 bg-[#FAF9F0] px-3 py-1.5 rounded-xl border border-[#E1E3D5]">
            <span className="material-symbols-outlined text-outline text-[18px]">group</span>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="bg-transparent text-[13px] font-label font-bold text-primary focus:outline-none cursor-pointer"
            >
              <option value="all">All Groups ({groups.length})</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by note, friend, title..."
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-[#E1E3D5] bg-[#FAF9F0] text-[12px] text-on-surface focus:outline-none focus:border-primary-container"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#E1E3D5]/60">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1 rounded-full text-[11px] font-label font-bold transition-all ${
                selectedCategory === c
                  ? 'bg-secondary-container text-primary border border-primary-container/40'
                  : 'bg-[#FAF9F0] text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {c === 'all' ? 'All Categories' : c}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table / List */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-3 border-primary-container border-t-secondary-container rounded-full animate-spin"></div>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <EmptyState
          title="No expenses match your filters"
          description="Try selecting a different group or category."
          actionText="+ Add Expense"
          onAction={onOpenAddExpense}
        />
      ) : (
        <div className="rounded-[20px] bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] ambient-card overflow-hidden">
          <div className="divide-y divide-[#E1E3D5]">
            {filteredExpenses.map((exp) => {
              const myShare = exp.shares?.find((s: any) => s.userId === currentUserId);
              const isPayer = exp.payerId === currentUserId;

              return (
                <div
                  key={exp.id}
                  onClick={() => setSelectedExpense(exp)}
                  className="p-4 hover:bg-[#FAF9F0] cursor-pointer transition-colors flex items-center justify-between gap-4"
                >
                  {/* Left: Icon & Description */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary font-bold flex-shrink-0">
                      <span className="material-symbols-outlined text-[20px]">
                        {exp.category === 'Transport'
                          ? 'directions_car'
                          : exp.category === 'Stay'
                          ? 'hotel'
                          : exp.category === 'Groceries'
                          ? 'shopping_basket'
                          : exp.category === 'Entertainment'
                          ? 'attractions'
                          : exp.category === 'Utilities'
                          ? 'bolt'
                          : 'receipt'}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-[14px] font-headline font-bold text-primary truncate leading-tight">
                        {exp.description}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-on-surface-variant">
                        <span className="font-medium text-primary bg-[#FAF9F0] px-2 py-0.5 rounded border border-[#E1E3D5]">
                          {exp.groupName}
                        </span>
                        <span>•</span>
                        <span>
                          Paid by <strong className="text-primary">{isPayer ? 'You' : exp.payerName}</strong>
                        </span>
                        <span>•</span>
                        <span>{new Date(exp.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amounts & Shares */}
                  <div className="text-right flex-shrink-0 flex items-center gap-4">
                    <div>
                      <div className="text-[15px] font-headline font-bold text-primary font-tabular">
                        ₹{Number(exp.amount).toFixed(2)}
                      </div>
                      <div className="text-[11px] text-on-surface-variant">
                        Your share:{' '}
                        <span className="font-bold text-primary font-tabular">
                          ₹{myShare ? Number(myShare.shareAmount).toFixed(2) : '0.00'}
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-outline text-[18px]">chevron_right</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expense Modal */}
      <ExpenseDetailsModal
        isOpen={!!selectedExpense}
        expense={selectedExpense}
        onClose={() => setSelectedExpense(null)}
        onDeleted={() => {
          setSelectedExpense(null);
          loadData();
        }}
        onUpdated={() => {
          setSelectedExpense(null);
          loadData();
        }}
      />
    </div>
  );
};
