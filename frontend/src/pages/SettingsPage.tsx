import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

interface SettingsPageProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onRefreshAll: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onShowToast, onRefreshAll }) => {
  const [currency, setCurrency] = useState('INR');
  const [health, setHealth] = useState<any>(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const fetchHealth = async () => {
    try {
      setLoadingHealth(true);
      const res = await api.getHealth();
      setHealth(res);
    } catch {
      setHealth({ status: 'offline', isRedisConnected: false });
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to clear all data? This cannot be undone.')) return;
    setIsResetting(true);
    try {
      await api.resetData();
      onShowToast('Database reset successfully. Starting fresh!', 'info');
      onRefreshAll();
      fetchHealth();
    } catch (err: any) {
      onShowToast(err.message || 'Reset failed', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleReSeed = async () => {
    setIsSeeding(true);
    try {
      await api.seedData(true);
      onShowToast('Demo data re-seeded successfully with Goa Trip, Flatmates, and Reunion expenses!', 'success');
      onRefreshAll();
      fetchHealth();
    } catch (err: any) {
      onShowToast(err.message || 'Seeding failed', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-[26px] font-headline font-bold text-primary tracking-tight">Settings & Preferences</h1>
        <p className="text-[13px] font-body text-on-surface-variant mt-1">
          Manage your demo profile, currency display, and shared Redis backend storage.
        </p>
      </div>

      {/* 1. Demo User Profile Card */}
      <section className="rounded-[20px] bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] ambient-card p-6 space-y-4">
        <h2 className="text-[16px] font-headline font-bold text-primary pb-2 border-b border-[#E1E3D5]">
          Demo Profile
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="relative w-16 h-16 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-xl ring-4 ring-secondary-container">
            <span className="text-secondary-fixed">AM</span>
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[18px] font-headline font-bold text-primary">Alex Morgan</h3>
              <span className="px-2 py-0.5 rounded-full bg-secondary-container text-primary text-[10px] font-bold">
                Active Demo User
              </span>
            </div>
            <p className="text-[13px] font-body text-on-surface-variant">alex@splitmate.io</p>
            <p className="text-[11px] text-outline">
              Primary organizer for Goa Trip 🌴, Flatmates #402 🏠, and Weekend Hangouts ☕
            </p>
          </div>
        </div>
      </section>

      {/* 2. Preferences & Currency */}
      <section className="rounded-[20px] bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] ambient-card p-6 space-y-4">
        <h2 className="text-[16px] font-headline font-bold text-primary pb-2 border-b border-[#E1E3D5]">
          Currency & Locale Display
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { code: 'INR', symbol: '₹', label: 'Indian Rupee (Default)' },
            { code: 'USD', symbol: '$', label: 'US Dollar' },
            { code: 'EUR', symbol: '€', label: 'Euro' }
          ].map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                setCurrency(c.code);
                onShowToast(`Currency preference set to ${c.code}`, 'info');
              }}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                currency === c.code
                  ? 'bg-secondary-container border-primary-container shadow-xs text-primary'
                  : 'bg-[#FAF9F0] border-[#E1E3D5] text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <div className="text-[18px] font-headline font-bold text-primary">{c.symbol} {c.code}</div>
              <div className="text-[11px] mt-0.5 font-medium">{c.label}</div>
            </button>
          ))}
        </div>
      </section>

      {/* 3. Infrastructure & Storage Status */}
      <section className="rounded-[20px] bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] ambient-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#E1E3D5]">
          <h2 className="text-[16px] font-headline font-bold text-primary">
            Backend & Storage Architecture
          </h2>
          <button
            onClick={fetchHealth}
            className="text-[12px] font-bold text-primary hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[15px]">refresh</span>
            <span>Check Status</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
          <div className="p-3.5 rounded-xl bg-[#FAF9F0] border border-[#E1E3D5] space-y-1">
            <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider block">
              Active Storage Engine
            </span>
            <div className="font-headline font-bold text-primary flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#21864A]"></span>
              <span>{health?.storage || 'File-backed Persistent Store'}</span>
            </div>
            <p className="text-[11px] text-outline">
              {health?.isRedisConnected ? 'Redis is connected and shared across replicas.' : 'Using persistent atomic file store with auto-recovery.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF9F0] border border-[#E1E3D5] space-y-1">
            <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider block">
              Service Health
            </span>
            <div className="font-headline font-bold text-[#21864A] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>{health?.status === 'healthy' ? 'Healthy & Online' : 'Checking...'}</span>
            </div>
            <p className="text-[11px] text-outline">Uptime: {health?.uptime || 'N/A'}</p>
          </div>
        </div>
      </section>

      {/* 4. Demo Data Management */}
      <section className="rounded-[20px] bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] ambient-card p-6 space-y-4">
        <h2 className="text-[16px] font-headline font-bold text-primary pb-2 border-b border-[#E1E3D5]">
          Demo Data Management
        </h2>
        <p className="text-[12px] text-on-surface-variant leading-relaxed">
          Reset demo data to initial Stitch prototype state (Alex, Maya, Rahul, Goa Trip with zero-sum balances) or purge all records to test an empty database.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleReSeed}
            disabled={isSeeding}
            className="butter-button font-label text-[13px] px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">restart_alt</span>
            <span>{isSeeding ? 'Seeding...' : 'Reset & Re-seed Demo Data'}</span>
          </button>

          <button
            onClick={handleReset}
            disabled={isResetting}
            className="px-4 py-2.5 rounded-xl border border-error/40 text-error hover:bg-error-container text-[13px] font-bold transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
            <span>{isResetting ? 'Purging...' : 'Clear All Data (Empty DB)'}</span>
          </button>
        </div>
      </section>
    </div>
  );
};
