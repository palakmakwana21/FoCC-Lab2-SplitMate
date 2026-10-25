import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { EmptyState } from '../components/EmptyState';

interface SettlementsPageProps {
  onOpenSettleUp: () => void;
}

export const SettlementsPage: React.FC<SettlementsPageProps> = ({ onOpenSettleUp }) => {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettlements = async () => {
    try {
      setLoading(true);
      const res = await api.getSettlements();
      setSettlements(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load settlements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettlements();
  }, []);

  const totalSettledAmount = settlements.reduce((sum, s) => sum + (s.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[26px] font-headline font-bold text-primary tracking-tight">Settlements</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-label text-[12px] font-bold border border-[#E1E3D5]">
              {settlements.length} Completed
            </span>
          </div>
          <p className="text-[13px] font-body text-on-surface-variant mt-1">
            History of all cleared balances, UPI transfers, and peer payments.
          </p>
        </div>

        <button
          onClick={onOpenSettleUp}
          className="butter-button font-label text-[13px] px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs w-fit"
        >
          <span className="material-symbols-outlined text-[18px]">payments</span>
          <span>Record Settlement</span>
        </button>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-[#E1E3D5] rounded-2xl p-5 ambient-card">
          <span className="text-[11px] font-label font-bold text-on-surface-variant uppercase tracking-wider">
            Total Settled Volume
          </span>
          <div className="text-[26px] font-headline font-extrabold text-primary mt-1 font-tabular">
            ₹{totalSettledAmount.toFixed(2)}
          </div>
          <p className="text-[11px] text-outline mt-0.5">Cleared through direct transfers</p>
        </div>

        <div className="bg-surface-container-lowest border border-[#E1E3D5] rounded-2xl p-5 ambient-card">
          <span className="text-[11px] font-label font-bold text-[#21864A] uppercase tracking-wider">
            Settlement Status
          </span>
          <div className="text-[26px] font-headline font-extrabold text-[#21864A] mt-1">
            100% Verified
          </div>
          <p className="text-[11px] text-outline mt-0.5">Synchronized with balance matrices</p>
        </div>

        <div className="bg-surface-container-lowest border border-[#E1E3D5] rounded-2xl p-5 ambient-card">
          <span className="text-[11px] font-label font-bold text-secondary uppercase tracking-wider">
            Primary Method
          </span>
          <div className="text-[26px] font-headline font-extrabold text-primary mt-1">
            UPI / Instant
          </div>
          <p className="text-[11px] text-outline mt-0.5">Zero transaction friction</p>
        </div>
      </div>

      {/* Settlements Ledger */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-3 border-primary-container border-t-secondary-container rounded-full animate-spin"></div>
        </div>
      ) : settlements.length === 0 ? (
        <EmptyState
          icon="handshake"
          title="No settlements recorded yet"
          description="When friends pay each other to settle group debts, record them here to update your ledger."
          actionText="Record First Settlement"
          onAction={onOpenSettleUp}
        />
      ) : (
        <div className="rounded-[20px] bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] ambient-card overflow-hidden">
          <div className="p-4 border-b border-[#E1E3D5] flex items-center justify-between">
            <h2 className="text-[16px] font-headline font-bold text-primary">Settlement Ledger</h2>
            <span className="text-[12px] text-on-surface-variant font-medium">Sorted by latest first</span>
          </div>

          <div className="divide-y divide-[#E1E3D5]">
            {settlements.map((s) => (
              <div key={s.id} className="p-4 flex items-center justify-between gap-4 hover:bg-[#FAF9F0] transition-colors">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#DDEBD8] flex items-center justify-center text-primary font-bold flex-shrink-0">
                    <span className="material-symbols-outlined text-[20px] text-[#21864A]">verified</span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-bold text-[14px] text-primary">
                      <span>{s.payerName}</span>
                      <span className="material-symbols-outlined text-outline text-[16px]">arrow_forward</span>
                      <span>{s.recipientName}</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#DDEBD8] text-[#14532D] font-bold">
                        {s.method || 'UPI'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-on-surface-variant">
                      <span>{s.groupName || 'General Settlement'}</span>
                      <span>•</span>
                      <span>{new Date(s.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      {s.notes && (
                        <>
                          <span>•</span>
                          <span className="italic">{s.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-[16px] font-headline font-bold text-[#14532D] font-tabular">
                    ₹{Number(s.amount).toFixed(2)}
                  </div>
                  <span className="text-[10px] text-[#21864A] font-bold uppercase">Settled</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
