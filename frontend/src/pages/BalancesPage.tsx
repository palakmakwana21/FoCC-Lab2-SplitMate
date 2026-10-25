import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { EmptyState } from '../components/EmptyState';

interface BalancesPageProps {
  onOpenSettleUp: (friendId?: string, amount?: number) => void;
  onShowToast: (msg: string) => void;
}

export const BalancesPage: React.FC<BalancesPageProps> = ({ onOpenSettleUp, onShowToast }) => {
  const [data, setData] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'you_owe' | 'owes_you' | 'settled'>('all');
  const [searchFriend, setSearchFriend] = useState('');
  const [simplificationEnabled, setSimplificationEnabled] = useState(true);

  const loadBalances = async () => {
    try {
      setLoading(true);
      const [balRes, grpRes] = await Promise.all([
        api.getBalances(selectedGroup === 'all' ? undefined : selectedGroup),
        api.getGroups()
      ]);
      setData(balRes);
      setGroups(grpRes);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load balances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBalances();
  }, [selectedGroup]);

  const { metrics, bilateralFriends = [], simplifiedTransfers = [] } = data || {};

  const filteredFriends = bilateralFriends.filter((f: any) => {
    const matchesSearch = f.name.toLowerCase().includes(searchFriend.toLowerCase());
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[26px] font-headline font-bold text-primary tracking-tight">Balances</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-label text-[12px] font-bold border border-[#E1E3D5]">
              Live Ledger
            </span>
          </div>
          <p className="text-[13px] font-body text-on-surface-variant mt-1 max-w-2xl">
            See what you owe and what others owe you across all your shared groups. Settled automatically through smart debt resolution.
          </p>
        </div>

        <button
          onClick={() => onOpenSettleUp()}
          className="butter-button font-label text-[13px] px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs w-fit"
        >
          <span className="material-symbols-outlined text-[18px]">payments</span>
          <span>Record Settlement</span>
        </button>
      </div>

      {/* 3 Summary Metric Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: NET BALANCE */}
        <div className="rounded-[20px] bg-[#FFFBE6] border-[1.5px] border-[#E1E3D5] ambient-card p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-label font-bold text-secondary tracking-wider uppercase">
              NET BALANCE
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFE83D] text-[#103D27] text-[11px] font-label font-bold shadow-xs">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
              <span>{(metrics?.netBalance || 0) >= 0 ? 'You are owed overall' : 'You owe overall'}</span>
            </span>
          </div>
          <div className="my-4">
            <div className="text-[32px] font-headline font-extrabold text-primary font-tabular">
              {(metrics?.netBalance || 0) >= 0 ? '+' : ''}₹{Math.abs(metrics?.netBalance || 0).toFixed(2)}
            </div>
            <p className="text-[12px] text-[#14532D] mt-1 flex items-center gap-1.5 font-medium">
              <span className="material-symbols-outlined text-[16px] text-[#21864A]">check_circle</span>
              <span>Calculated across all shared transactions</span>
            </p>
          </div>
          <div className="pt-3 border-t border-[#E1E3D5]/80 flex items-center justify-between text-[12px] text-on-surface-variant">
            <span>Calculation Mode:</span>
            <span className="font-bold text-primary">Direct Bilateral Matrix</span>
          </div>
        </div>

        {/* Card 2: TOTAL YOU OWE */}
        <div className="rounded-[20px] bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] ambient-card p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-label font-bold text-error tracking-wider uppercase">
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
            <p className="text-[12px] text-on-surface-variant mt-1">Outstanding debt across friends</p>
          </div>
          <div className="pt-3 border-t border-[#E1E3D5] flex items-center justify-between text-[12px] text-on-surface-variant">
            <span>Status:</span>
            <span className="font-bold text-error">Unsettled</span>
          </div>
        </div>

        {/* Card 3: TOTAL OWED TO YOU */}
        <div className="rounded-[20px] bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] ambient-card p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-label font-bold text-[#21864A] tracking-wider uppercase">
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
            <p className="text-[12px] text-on-surface-variant mt-1">Incoming cash to collect</p>
          </div>
          <div className="pt-3 border-t border-[#E1E3D5] flex items-center justify-between text-[12px] text-on-surface-variant">
            <span>Status:</span>
            <span className="font-bold text-[#21864A]">Pending</span>
          </div>
        </div>
      </section>

      {/* Filter & Search Toolbar */}
      <section className="rounded-[18px] bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] p-3.5 ambient-card flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Group Filter */}
          <div className="flex items-center gap-2 bg-[#FAF9F0] px-3.5 py-1.5 rounded-xl border border-[#E1E3D5]">
            <span className="material-symbols-outlined text-[18px] text-outline">group</span>
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

          {/* Status Switches */}
          <div className="flex items-center gap-1 bg-[#FAF9F0] p-1 rounded-xl border border-[#E1E3D5]">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-[12px] font-label font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              All ({bilateralFriends.length})
            </button>
            <button
              onClick={() => setStatusFilter('you_owe')}
              className={`px-3 py-1 rounded-lg text-[12px] font-label font-bold transition-all ${
                statusFilter === 'you_owe'
                  ? 'bg-surface-container-lowest text-error shadow-xs'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              You Owe ({bilateralFriends.filter((f: any) => f.status === 'you_owe').length})
            </button>
            <button
              onClick={() => setStatusFilter('owes_you')}
              className={`px-3 py-1 rounded-lg text-[12px] font-label font-bold transition-all ${
                statusFilter === 'owes_you'
                  ? 'bg-surface-container-lowest text-[#21864A] shadow-xs'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Owes You ({bilateralFriends.filter((f: any) => f.status === 'owes_you').length})
            </button>
            <button
              onClick={() => setStatusFilter('settled')}
              className={`px-3 py-1 rounded-lg text-[12px] font-label font-bold transition-all ${
                statusFilter === 'settled'
                  ? 'bg-surface-container-lowest text-outline shadow-xs'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Settled ({bilateralFriends.filter((f: any) => f.status === 'settled').length})
            </button>
          </div>
        </div>

        {/* Friend Search */}
        <div className="relative min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            person_search
          </span>
          <input
            type="text"
            value={searchFriend}
            onChange={(e) => setSearchFriend(e.target.value)}
            placeholder="Search friend..."
            className="w-full h-9 pl-9 pr-3 bg-[#FAF9F0] border border-[#E1E3D5] rounded-xl text-[12px] text-on-surface focus:outline-none"
          />
        </div>
      </section>

      {/* 2-Column Main Ledger & Sidebar Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7/12: Friend Balances Breakdown */}
        <section className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[18px] font-headline font-bold text-primary">Friend Balances Breakdown</h2>
            <span className="text-[12px] text-on-surface-variant">
              Showing {filteredFriends.length} friend relationship(s)
            </span>
          </div>

          {filteredFriends.length === 0 ? (
            <EmptyState
              title="No balances found"
              description="All debts match this filter or everyone is fully settled up."
            />
          ) : (
            filteredFriends.map((f: any) => {
              const owesYou = f.status === 'owes_you';
              const youOwe = f.status === 'you_owe';
              const settled = f.status === 'settled';

              return (
                <div
                  key={f.friendId}
                  className={`rounded-[20px] bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] ambient-card p-5 transition-all hover:border-primary-container/40 ${
                    settled ? 'opacity-70 border-dashed' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Friend Identity */}
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base border flex-shrink-0 ${
                          youOwe
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : owesYou
                            ? 'bg-[#DDEBD8] text-[#14532D] border-[#C0C9BE]'
                            : 'bg-surface-container text-on-surface-variant border-outline-variant'
                        }`}
                      >
                        {f.name.substring(0, 2).toUpperCase()}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-[16px] font-headline font-bold text-on-surface">{f.name}</h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-label font-bold ${
                              youOwe
                                ? 'bg-[#FFF7BF] text-[#6A5F00]'
                                : owesYou
                                ? 'bg-[#DDEBD8] text-[#14532D]'
                                : 'bg-surface-container-high text-outline'
                            }`}
                          >
                            {youOwe ? 'You Owe' : owesYou ? 'Owes You' : 'All Settled'}
                          </span>
                        </div>
                        <div className="text-[12px] text-on-surface-variant mt-0.5">
                          {f.groups?.length > 0 ? f.groups.join(', ') : 'Shared Expenses'}
                        </div>
                      </div>
                    </div>

                    {/* Amount & Actions */}
                    <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-0 border-[#E1E3D5]">
                      <div className="text-right">
                        <span
                          className={`text-[11px] font-medium ${
                            youOwe ? 'text-error' : owesYou ? 'text-[#21864A]' : 'text-outline'
                          }`}
                        >
                          {youOwe ? `You owe ${f.name}` : owesYou ? `${f.name} owes you` : 'Net balance'}
                        </span>
                        <div
                          className={`text-[20px] font-headline font-extrabold font-tabular leading-tight ${
                            youOwe ? 'text-error' : owesYou ? 'text-[#14532D]' : 'text-outline'
                          }`}
                        >
                          ₹{f.netAmount?.toFixed(2) || '0.00'}
                        </div>
                      </div>

                      {!settled && (
                        <div className="flex items-center gap-2">
                          {owesYou && (
                            <button
                              onClick={() => onShowToast(`Reminder notification sent to ${f.name}!`)}
                              className="px-3 py-1.5 rounded-xl border border-[#E1E3D5] text-primary font-label text-[12px] font-semibold hover:bg-surface-container-high transition-colors flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[15px]">notification_important</span>
                              <span>Remind</span>
                            </button>
                          )}
                          <button
                            onClick={() => onOpenSettleUp(f.friendId, f.netAmount)}
                            className="butter-button px-4 py-1.5 rounded-xl text-[12px] font-label font-bold flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[15px]">payments</span>
                            <span>Settle Up</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* Right 5/12: Smart Debt Simplification Engine */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-[20px] bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] ambient-card p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E1E3D5]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary-container text-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                </div>
                <div>
                  <h3 className="text-[15px] font-headline font-bold text-primary">Debt Simplification</h3>
                  <p className="text-[11px] text-on-surface-variant">Graph theory algorithm</p>
                </div>
              </div>

              {/* Active Toggle */}
              <button
                type="button"
                onClick={() => setSimplificationEnabled(!simplificationEnabled)}
                className={`w-11 h-6 rounded-full relative p-0.5 transition-colors focus:outline-none ${
                  simplificationEnabled ? 'bg-primary-container' : 'bg-[#E1E3D5]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-secondary-container transform transition-transform ${
                    simplificationEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Savings Callout */}
            <div className="my-4 p-3.5 rounded-xl bg-[#FFFBE6] border border-[#FFE83D]/60 flex items-start gap-3">
              <span className="material-symbols-outlined text-[#6A5F00] text-[20px] flex-shrink-0 mt-0.5">
                savings
              </span>
              <p className="text-[12px] font-body text-[#103D27] leading-relaxed">
                We reduced multiple bilateral cross-transactions down to{' '}
                <strong>{simplifiedTransfers.length} direct transfers</strong>, preserving exact net balances!
              </p>
            </div>

            {/* Suggested Settlement Flowchart */}
            <div className="space-y-2.5 pt-1">
              <p className="text-[11px] font-label font-bold text-outline uppercase tracking-wider">
                Suggested Settlement Route
              </p>

              {simplifiedTransfers.length === 0 ? (
                <p className="text-[12px] text-on-surface-variant italic">No pending settlements needed.</p>
              ) : (
                simplifiedTransfers.map((t: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#FAF9F0] border border-[#E1E3D5] flex items-center justify-between text-[13px]"
                  >
                    <div className="flex items-center gap-2 min-w-0 font-medium">
                      <span className="font-bold text-primary truncate">{t.fromUserName}</span>
                      <span className="material-symbols-outlined text-error text-[16px]">arrow_right_alt</span>
                      <span className="font-bold text-primary truncate">{t.toUserName}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 font-tabular">
                      <span className="font-headline font-bold text-primary">₹{Number(t.amount).toFixed(2)}</span>
                      <span className="material-symbols-outlined text-[16px] text-[#21864A]">verified</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => onOpenSettleUp()}
              className="w-full mt-4 py-2.5 rounded-xl bg-primary-container text-on-primary font-label text-[13px] font-bold hover:bg-primary-action transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">hub</span>
              <span>Execute Simplified Settle</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
