import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { EmptyState } from '../components/EmptyState';

export const InsightsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInsights = async () => {
      try {
        setLoading(true);
        const res = await api.getInsights();
        setData(res);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load insights');
      } finally {
        setLoading(false);
      }
    };
    loadInsights();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-primary-container border-t-secondary-container rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !data?.hasData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[26px] font-headline font-bold text-primary tracking-tight">Insights & Analytics</h1>
          <p className="text-[13px] font-body text-on-surface-variant mt-1">
            Visual trends and category breakdowns of your group spending.
          </p>
        </div>
        <EmptyState
          icon="analytics"
          title="No financial history yet"
          description="Log a few expenses to generate category distributions and spending trends."
        />
      </div>
    );
  }

  const {
    totalSpent = 0,
    totalExpenses = 0,
    averageExpense = 0,
    byCategory = [],
    byGroup = [],
    monthlyTrend = [],
    largestExpenses = []
  } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[26px] font-headline font-bold text-primary tracking-tight">Spending Insights</h1>
        <p className="text-[13px] font-body text-on-surface-variant mt-1">
          Visual trends, category breakdowns, and top shared expenses.
        </p>
      </div>

      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-[#E1E3D5] rounded-2xl p-5 ambient-card">
          <span className="text-[11px] font-label font-bold text-on-surface-variant uppercase tracking-wider">
            Total Recorded Pool
          </span>
          <div className="text-[26px] font-headline font-extrabold text-primary mt-1 font-tabular">
            ₹{Number(totalSpent).toFixed(2)}
          </div>
          <p className="text-[11px] text-outline mt-0.5">Across {totalExpenses} recorded bills</p>
        </div>

        <div className="bg-surface-container-lowest border border-[#E1E3D5] rounded-2xl p-5 ambient-card">
          <span className="text-[11px] font-label font-bold text-[#21864A] uppercase tracking-wider">
            Average Expense Amount
          </span>
          <div className="text-[26px] font-headline font-extrabold text-primary mt-1 font-tabular">
            ₹{Number(averageExpense).toFixed(2)}
          </div>
          <p className="text-[11px] text-outline mt-0.5">Per shared activity</p>
        </div>

        <div className="bg-surface-container-lowest border border-[#E1E3D5] rounded-2xl p-5 ambient-card">
          <span className="text-[11px] font-label font-bold text-secondary uppercase tracking-wider">
            Active Categories
          </span>
          <div className="text-[26px] font-headline font-extrabold text-primary mt-1">
            {byCategory.length} Types
          </div>
          <p className="text-[11px] text-outline mt-0.5">Diverse shared lifestyles</p>
        </div>
      </div>

      {/* 2 Columns: Category Breakdown & Spending by Group */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Category Breakdown (7/12) */}
        <section className="lg:col-span-7 rounded-[20px] bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] ambient-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E1E3D5]">
            <h2 className="text-[16px] font-headline font-bold text-primary">Spending by Category</h2>
            <span className="text-[11px] text-on-surface-variant font-bold">100% of Total</span>
          </div>

          <div className="space-y-3.5">
            {byCategory.map((c: any) => (
              <div key={c.category} className="space-y-1">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-bold text-primary">{c.category}</span>
                  <div className="font-tabular">
                    <span className="font-bold text-primary">₹{Number(c.amount).toFixed(2)}</span>
                    <span className="text-outline text-[11px] ml-1.5">({c.percentage}%)</span>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full h-2.5 rounded-full bg-surface-container overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(c.percentage, 100)}%`,
                      backgroundColor: c.color || '#21864A'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Spending by Group (5/12) */}
        <section className="lg:col-span-5 rounded-[20px] bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] ambient-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E1E3D5]">
            <h2 className="text-[16px] font-headline font-bold text-primary">Spending by Circle</h2>
            <span className="text-[11px] text-on-surface-variant font-medium">{byGroup.length} Groups</span>
          </div>

          <div className="space-y-3">
            {byGroup.map((g: any) => (
              <div
                key={g.groupName}
                className="p-3 rounded-xl bg-[#FAF9F0] border border-[#E1E3D5] flex items-center justify-between"
              >
                <div>
                  <h4 className="text-[13px] font-headline font-bold text-primary">{g.groupName}</h4>
                  <p className="text-[10px] text-on-surface-variant">{g.count} expenses logged</p>
                </div>
                <div className="text-right font-tabular">
                  <div className="text-[14px] font-bold text-primary">₹{Number(g.amount).toFixed(2)}</div>
                  <span className="text-[10px] text-outline">{g.percentage}% of total</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Largest Expenses & Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Largest Expenses (7/12) */}
        <section className="lg:col-span-7 rounded-[20px] bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] ambient-card p-6 space-y-4">
          <h2 className="text-[16px] font-headline font-bold text-primary pb-2 border-b border-[#E1E3D5]">
            Largest Recorded Bills
          </h2>

          <div className="divide-y divide-[#E1E3D5]">
            {largestExpenses.map((exp: any, idx: number) => (
              <div key={exp.id || idx} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-secondary-container text-primary font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-[13px] font-headline font-bold text-primary truncate leading-tight">
                      {exp.description}
                    </h4>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      {exp.payerName} in {exp.groupName}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 font-tabular">
                  <div className="text-[15px] font-headline font-bold text-primary">
                    ₹{Number(exp.amount).toFixed(2)}
                  </div>
                  <span className="text-[10px] text-outline">
                    {new Date(exp.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Monthly Trend (5/12) */}
        <section className="lg:col-span-5 rounded-[20px] bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] ambient-card p-6 space-y-4">
          <h2 className="text-[16px] font-headline font-bold text-primary pb-2 border-b border-[#E1E3D5]">
            Monthly Velocity
          </h2>

          <div className="space-y-2.5">
            {monthlyTrend.map((m: any) => (
              <div
                key={m.month}
                className="p-3 rounded-xl bg-[#FAF9F0] border border-[#E1E3D5] flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-outline text-[18px]">calendar_month</span>
                  <span className="text-[13px] font-bold text-primary">{m.month}</span>
                </div>
                <div className="text-right font-tabular">
                  <div className="text-[14px] font-bold text-primary">₹{Number(m.amount).toFixed(2)}</div>
                  <span className="text-[10px] text-outline">{m.count} bills</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
