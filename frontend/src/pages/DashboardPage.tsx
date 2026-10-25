import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { EmptyState } from '../components/EmptyState';

interface DashboardPageProps {
  onOpenAddExpense: () => void;
  onOpenCreateGroup: () => void;
  onOpenSettleUp: (friendId?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenAddExpense,
  onOpenCreateGroup,
  onOpenSettleUp
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboard('usr_alex');
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-container border-t-secondary-container rounded-full animate-spin"></div>
          <span className="text-[13px] font-label font-bold text-primary">Loading live ledger...</span>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6">
        <div className="p-4 rounded-2xl bg-error-container text-error text-[13px] font-medium flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadData} className="px-3 py-1 rounded-xl bg-error text-white font-bold text-xs">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { metrics, recentExpenses = [], groupSummaries = [], activities = [] } = data || {};
  const isPositive = (metrics?.netBalancePaise || 0) > 0;
  const isNegative = (metrics?.netBalancePaise || 0) < 0;

  return (
    <div className="space-y-6">
      {/* 1. Welcome Header */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[26px] sm:text-[28px] font-headline font-extrabold text-primary tracking-tight flex items-center gap-2">
            <span>Hey, Alex!</span>
            <span className="hover:rotate-12 transition-transform duration-200 cursor-default">👋</span>
          </h1>
          <p className="text-[13px] font-body text-on-surface-variant mt-0.5">
            Here's your shared money situation across all friend groups.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenCreateGroup}
            className="px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-[#E1E3D5] text-[13px] font-label font-bold text-primary hover:bg-surface-container-high transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">group_add</span>
            <span>New Group</span>
          </button>
          <button
            onClick={() => onOpenSettleUp()}
            className="px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-[#E1E3D5] text-[13px] font-label font-bold text-primary hover:bg-surface-container-high transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">payments</span>
            <span>Settle Up</span>
          </button>
          <button
            onClick={onOpenAddExpense}
            className="butter-button text-[13px] px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px] font-bold">add</span>
            <span>+ Add Expense</span>
          </button>
        </div>
      </section>

      {/* 2. Three Prominent Balance Metric Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: NET BALANCE */}
        <div className="rounded-[20px] bg-[#FFFBE6] border-[1.5px] border-[#E1E3D5] ambient-card p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-label uppercase font-bold tracking-wider text-secondary">
              NET BALANCE
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-label font-bold shadow-xs ${
                isPositive
                  ? 'bg-[#FFE83D] text-[#103D27]'
                  : isNegative
                  ? 'bg-error-container text-error'
                  : 'bg-surface-container-high text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {isPositive ? 'arrow_upward' : isNegative ? 'arrow_downward' : 'check'}
              </span>
              <span>
                {isPositive ? 'You are owed overall' : isNegative ? 'You owe overall' : 'All Settled'}
              </span>
            </span>
          </div>

          <div className="my-4">
            <div
              className={`text-[32px] font-headline font-extrabold tracking-tight font-tabular ${
                isPositive ? 'text-[#14532D]' : isNegative ? 'text-error' : 'text-primary'
              }`}
            >
              {isPositive ? '+' : ''}₹{Math.abs(metrics?.netBalance || 0).toFixed(2)}
            </div>
            <p className="text-[12px] font-body text-primary mt-1 flex items-center gap-1.5 font-medium">
              <span className="material-symbols-outlined text-[16px] text-[#21864A]">verified</span>
              <span>Across {metrics?.activeGroupsCount || 0} active friend groups</span>
            </p>
          </div>

          <div className="pt-3 border-t border-[#E1E3D5]/80 flex items-center justify-between text-[12px] text-on-surface-variant">
            <span>Total You Paid:</span>
            <span className="font-bold text-primary font-tabular">₹{(metrics?.totalPaid || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Card 2: TOTAL YOU OWE */}
        <div className="rounded-[20px] bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] ambient-card p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-label uppercase font-bold tracking-wider text-error">
              TOTAL YOU OWE
            </span>
            <div className="w-8 h-8 rounded-full bg-error-container/60 text-error flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">call_made</span>
            </div>
          </div>

          <div className="my-4">
            <div className="text-[32px] font-headline font-extrabold text-error font-tabular">
              ₹{(metrics?.totalYouOwe || 0).toFixed(2)}
            </div>
            <p className="text-[12px] text-on-surface-variant mt-1">
              Outstanding debt to friends awaiting settlement
            </p>
          </div>

          <div className="pt-3 border-t border-[#E1E3D5] flex items-center justify-between text-[12px]">
            <span className="text-on-surface-variant">Quick action:</span>
            <Link to="/balances" className="font-bold text-primary hover:underline flex items-center gap-0.5">
              <span>View debts</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Card 3: TOTAL OWED TO YOU */}
        <div className="rounded-[20px] bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] ambient-card p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-label uppercase font-bold tracking-wider text-[#21864A]">
              TOTAL OWED TO YOU
            </span>
            <div className="w-8 h-8 rounded-full bg-[#DDEBD8] text-[#14532D] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">call_received</span>
            </div>
          </div>

          <div className="my-4">
            <div className="text-[32px] font-headline font-extrabold text-[#14532D] font-tabular">
              ₹{(metrics?.totalOwedToYou || 0).toFixed(2)}
            </div>
            <p className="text-[12px] text-on-surface-variant mt-1">
              Expected incoming cash from shared expenses
            </p>
          </div>

          <div className="pt-3 border-t border-[#E1E3D5] flex items-center justify-between text-[12px]">
            <span className="text-on-surface-variant">Resolution mode:</span>
            <span className="font-bold text-primary">Direct Matrix</span>
          </div>
        </div>
      </section>

      {/* 3. Groups Overview Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-[18px] font-headline font-bold text-primary">Active Groups</h2>
            <p className="text-[12px] text-on-surface-variant">Your current balance status in each circle.</p>
          </div>
          <Link to="/groups" className="text-[12px] font-label font-bold text-primary hover:underline">
            View All ({groupSummaries.length}) →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {groupSummaries.map((g: any) => {
            const hasCredit = g.userNetBalance > 0;
            const hasDebt = g.userNetBalance < 0;

            return (
              <Link
                key={g.id}
                to={`/groups/${g.id}`}
                className="group p-4 rounded-[20px] bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] ambient-card hover:border-primary-container/60 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container font-bold text-primary">
                      {g.category}
                    </span>
                    <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">group</span>
                      {g.memberCount}
                    </span>
                  </div>
                  <h3 className="text-[15px] font-headline font-bold text-primary group-hover:text-primary-action transition-colors truncate">
                    {g.name}
                  </h3>
                  <p className="text-[11px] text-on-surface-variant line-clamp-1 mt-0.5">
                    {g.description || 'Shared expense pool'}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-[#E1E3D5] flex items-center justify-between">
                  <span className="text-[11px] text-on-surface-variant font-medium">Your balance:</span>
                  <span
                    className={`text-[13px] font-headline font-bold font-tabular ${
                      hasCredit ? 'text-[#14532D]' : hasDebt ? 'text-error' : 'text-outline'
                    }`}
                  >
                    {hasCredit ? `+₹${g.userNetBalance.toFixed(2)}` : hasDebt ? `-₹${Math.abs(g.userNetBalance).toFixed(2)}` : '₹0.00'}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. Split 2-Column: Recent Expenses (Left 7/12) & Recent Activity (Right 5/12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Recent Expenses Ledger */}
        <section className="lg:col-span-7 rounded-[20px] bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] ambient-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E1E3D5]">
            <div>
              <h2 className="text-[16px] font-headline font-bold text-primary">Recent Shared Expenses</h2>
              <p className="text-[11px] text-on-surface-variant">Latest transactions recorded in your groups</p>
            </div>
            <Link to="/expenses" className="text-[12px] font-label font-bold text-primary hover:underline">
              View All →
            </Link>
          </div>

          {recentExpenses.length === 0 ? (
            <EmptyState
              title="No expenses logged yet"
              description="Click Add Expense above to split your first bill with friends."
              actionText="+ Add Expense"
              onAction={onOpenAddExpense}
            />
          ) : (
            <div className="space-y-2.5">
              {recentExpenses.map((exp: any) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#FAF9F0] border border-[#E1E3D5] hover:border-primary-container/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary font-bold flex-shrink-0">
                      <span className="material-symbols-outlined text-[20px]">receipt</span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[13px] font-headline font-bold text-primary truncate leading-tight">
                        {exp.description}
                      </h4>
                      <p className="text-[11px] text-on-surface-variant truncate mt-0.5">
                        {exp.payerName} paid in <span className="font-medium text-primary">{exp.groupName}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 pl-3">
                    <div className="text-[14px] font-headline font-bold text-primary font-tabular">
                      ₹{Number(exp.amount).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-on-surface-variant">
                      Your share: <span className="font-bold text-primary font-tabular">₹{Number(exp.userShare).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Live Activity & Settlement Feed */}
        <section className="lg:col-span-5 rounded-[20px] bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] ambient-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E1E3D5]">
            <h2 className="text-[16px] font-headline font-bold text-primary">Recent Activity Feed</h2>
            <span className="w-2 h-2 rounded-full bg-[#21864A]"></span>
          </div>

          <div className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-[12px] text-on-surface-variant italic">No recent activity recorded.</p>
            ) : (
              activities.map((act: any) => (
                <div key={act.id} className="flex items-start gap-3 text-[12px]">
                  <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-primary font-bold flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[15px]">
                      {act.type === 'SETTLEMENT_RECORDED' ? 'handshake' : 'receipt_long'}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-primary leading-snug">{act.description}</p>
                    <span className="text-[10px] text-outline">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-[#E1E3D5]">
            <Link
              to="/settlements"
              className="w-full py-2 rounded-xl bg-surface-container-high text-primary font-label text-[12px] font-bold flex items-center justify-center gap-1.5 hover:bg-surface-container transition-colors"
            >
              <span>View Settlement History</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};
