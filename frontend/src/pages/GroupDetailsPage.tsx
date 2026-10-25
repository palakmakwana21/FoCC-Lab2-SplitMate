import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { EmptyState } from '../components/EmptyState';
import { ExpenseDetailsModal } from '../components/ExpenseDetailsModal';

interface GroupDetailsPageProps {
  onOpenAddExpenseWithGroup: (groupId: string) => void;
  onOpenSettleUpWithGroup: (groupId: string, recipientId?: string) => void;
}

export const GroupDetailsPage: React.FC<GroupDetailsPageProps> = ({
  onOpenAddExpenseWithGroup,
  onOpenSettleUpWithGroup
}) => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);

  const loadGroupDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.getGroup(id);
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load group details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroupDetails();
  }, [id]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-primary-container border-t-secondary-container rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !data?.group) {
    return (
      <div className="p-6">
        <EmptyState
          icon="group_off"
          title="Group not found"
          description={error || 'The requested group could not be located.'}
          actionText="Back to Groups"
          onAction={() => window.location.assign('/groups')}
        />
      </div>
    );
  }

  const { group, members = [], expenses = [], settlements = [], simplifiedTransfers = [] } = data;
  const userNet = group.userBalance || 0;
  const isCredit = userNet > 0;
  const isDebt = userNet < 0;

  return (
    <div className="space-y-6">
      {/* 1. Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-[12px] font-label text-outline">
        <Link to="/groups" className="hover:text-primary transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">group</span>
          <span>Groups</span>
        </Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-primary font-bold">{group.name}</span>
        <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container-high text-primary">
          Active Circle
        </span>
      </nav>

      {/* 2. Group Header Card */}
      <section className="bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] rounded-[20px] p-6 ambient-card relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[26px] font-headline font-bold text-primary tracking-tight">{group.name}</h1>
              <span className="px-3 py-0.5 rounded-full text-[11px] font-label font-bold bg-secondary-container/70 text-primary border border-secondary-fixed">
                {group.category}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-label bg-surface-container-high text-primary font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">group</span>
                <span>{members.length} Members</span>
              </span>
            </div>
            <p className="text-[13px] font-body text-on-surface-variant max-w-2xl leading-relaxed">
              {group.description || 'All shared trip meals, stays, rides, and group expenses.'}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onOpenSettleUpWithGroup(group.id)}
              className="butter-button font-label text-[13px] px-5 py-2.5 rounded-[14px] flex items-center gap-2 shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">payments</span>
              <span>Settle Up</span>
            </button>
            <button
              onClick={() => onOpenAddExpenseWithGroup(group.id)}
              className="primary-button text-[13px] px-5 py-2.5 rounded-[14px] flex items-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>+ Add Expense</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. 4 Highlight Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Group Expenses */}
        <div className="bg-surface-container-lowest rounded-[20px] p-5 border-[1.5px] border-[#E1E3D5] ambient-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline mb-2">
            <span className="text-[11px] font-label uppercase font-bold tracking-wider">Total Group Spending</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-low text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">receipt</span>
            </div>
          </div>
          <div>
            <div className="text-[24px] font-headline font-bold text-primary font-tabular">
              ₹{Number(group.totalSpent || 0).toFixed(2)}
            </div>
            <p className="text-[11px] text-outline mt-0.5">Recorded pool amount</p>
          </div>
        </div>

        {/* Card 2: Expense Count */}
        <div className="bg-surface-container-lowest rounded-[20px] p-5 border-[1.5px] border-[#E1E3D5] ambient-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline mb-2">
            <span className="text-[11px] font-label uppercase font-bold tracking-wider">Recorded Expenses</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-low text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
            </div>
          </div>
          <div>
            <div className="text-[24px] font-headline font-bold text-primary">{expenses.length} bills</div>
            <p className="text-[11px] text-outline mt-0.5">Live balanced records</p>
          </div>
        </div>

        {/* Card 3: Your Net Position */}
        <div
          className={`rounded-[20px] p-5 border-[1.5px] ambient-card flex flex-col justify-between ${
            isCredit ? 'bg-[#DDEBD8]/60 border-primary-container/40' : isDebt ? 'bg-error-container/40 border-error/40' : 'bg-surface-container-lowest border-[#E1E3D5]'
          }`}
        >
          <div className="flex items-center justify-between text-primary mb-2">
            <span className="text-[11px] font-label uppercase font-bold tracking-wider">Your Position</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-lowest text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">
                {isCredit ? 'arrow_outward' : isDebt ? 'call_made' : 'done'}
              </span>
            </div>
          </div>
          <div>
            <div
              className={`text-[24px] font-headline font-bold font-tabular ${
                isCredit ? 'text-[#14532D]' : isDebt ? 'text-error' : 'text-primary'
              }`}
            >
              {isCredit ? `+₹${userNet.toFixed(2)}` : isDebt ? `-₹${Math.abs(userNet).toFixed(2)}` : '₹0.00'}
            </div>
            <p className="text-[11px] font-bold mt-0.5 text-primary">
              {isCredit ? `You are owed ₹${userNet.toFixed(2)}` : isDebt ? `You owe ₹${Math.abs(userNet).toFixed(2)}` : 'All settled'}
            </p>
          </div>
        </div>

        {/* Card 4: Settlements Count */}
        <div className="bg-surface-container-lowest rounded-[20px] p-5 border-[1.5px] border-[#E1E3D5] ambient-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline mb-2">
            <span className="text-[11px] font-label uppercase font-bold tracking-wider">Settlements</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-low text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">handshake</span>
            </div>
          </div>
          <div>
            <div className="text-[24px] font-headline font-bold text-primary">{settlements.length} payments</div>
            <p className="text-[11px] text-outline mt-0.5">Recorded settlements</p>
          </div>
        </div>
      </section>

      {/* 4. Split 2-Columns: Expenses List (Left 7/12) & Member Balances (Right 5/12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Expenses List */}
        <section className="lg:col-span-7 rounded-[20px] bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] ambient-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E1E3D5]">
            <div>
              <h2 className="text-[16px] font-headline font-bold text-primary">Expenses in this Group</h2>
              <p className="text-[11px] text-on-surface-variant">Click any expense to see participant breakdown</p>
            </div>
            <button
              onClick={() => onOpenAddExpenseWithGroup(group.id)}
              className="text-[12px] font-label font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>+ Add Bill</span>
            </button>
          </div>

          {expenses.length === 0 ? (
            <EmptyState
              title="No expenses logged for this group"
              description="Add the first expense to calculate individual shares."
              actionText="+ Add Expense"
              onAction={() => onOpenAddExpenseWithGroup(group.id)}
            />
          ) : (
            <div className="space-y-2.5">
              {expenses.map((exp: any) => (
                <div
                  key={exp.id}
                  onClick={() => setSelectedExpense(exp)}
                  className="p-3.5 rounded-xl bg-[#FAF9F0] border border-[#E1E3D5] hover:border-primary-container cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary font-bold flex-shrink-0">
                      <span className="material-symbols-outlined text-[20px]">receipt</span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[13px] font-headline font-bold text-primary truncate leading-tight">
                        {exp.description}
                      </h4>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        Paid by <strong className="text-primary font-medium">{exp.payerName}</strong> on{' '}
                        {new Date(exp.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 pl-3">
                    <div className="text-[14px] font-headline font-bold text-primary font-tabular">
                      ₹{Number(exp.amount).toFixed(2)}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container border border-[#E1E3D5] text-primary font-bold uppercase">
                      {exp.splitMethod}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Members & Balances Right Column */}
        <div className="lg:col-span-5 space-y-5">
          {/* Members Balances */}
          <section className="rounded-[20px] bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] ambient-card p-5 space-y-3">
            <h2 className="text-[16px] font-headline font-bold text-primary pb-2 border-b border-[#E1E3D5]">
              Members Ledger
            </h2>
            <div className="space-y-2">
              {members.map((m: any) => {
                const bal = m.balance || 0;
                const isOwed = bal > 0;
                const owes = bal < 0;

                return (
                  <div
                    key={m.id}
                    className="p-2.5 rounded-xl bg-[#FAF9F0] border border-[#E1E3D5] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center font-bold text-primary text-xs">
                        {m.initials || m.name?.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[13px] font-bold text-primary truncate block leading-tight">
                          {m.name} {m.id === 'usr_alex' ? '(You)' : ''}
                        </span>
                        <span className="text-[10px] text-on-surface-variant font-tabular">
                          Paid: ₹{(m.totalPaid || 0).toFixed(0)} | Share: ₹{(m.totalShare || 0).toFixed(0)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-[13px] font-headline font-bold font-tabular ${
                          isOwed ? 'text-[#14532D]' : owes ? 'text-error' : 'text-outline'
                        }`}
                      >
                        {isOwed ? `+₹${bal.toFixed(2)}` : owes ? `-₹${Math.abs(bal).toFixed(2)}` : '₹0.00'}
                      </div>
                      <span className="text-[10px] text-on-surface-variant">
                        {isOwed ? 'gets back' : owes ? 'owes' : 'settled'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Simplified Transfers for this group */}
          {simplifiedTransfers.length > 0 && (
            <section className="rounded-[20px] bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] ambient-card p-5 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#E1E3D5]">
                <span className="material-symbols-outlined text-secondary text-lg">auto_awesome</span>
                <h3 className="text-[14px] font-headline font-bold text-primary">Suggested Settlement Plan</h3>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Graph algorithm reduced cross-transfers to {simplifiedTransfers.length} clean payment(s):
              </p>
              <div className="space-y-2">
                {simplifiedTransfers.map((t: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#FAF9F0] border border-[#E1E3D5] flex items-center justify-between text-[12px]"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-primary">
                      <span>{t.fromUserName}</span>
                      <span className="material-symbols-outlined text-error text-[15px]">arrow_right_alt</span>
                      <span>{t.toUserName}</span>
                    </div>
                    <span className="font-headline font-bold text-primary font-tabular">
                      ₹{Number(t.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Expense Details & Deletion Modal */}
      <ExpenseDetailsModal
        isOpen={!!selectedExpense}
        expense={selectedExpense}
        onClose={() => setSelectedExpense(null)}
        onDeleted={() => {
          setSelectedExpense(null);
          loadGroupDetails();
        }}
        onUpdated={() => {
          setSelectedExpense(null);
          loadGroupDetails();
        }}
      />
    </div>
  );
};
