import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { EmptyState } from '../components/EmptyState';

interface GroupsPageProps {
  onOpenCreateGroup: () => void;
  onOpenAddExpense: () => void;
}

export const GroupsPage: React.FC<GroupsPageProps> = ({ onOpenCreateGroup, onOpenAddExpense }) => {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const loadGroups = async () => {
    try {
      setLoading(true);
      const res = await api.getGroups();
      setGroups(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const categories = ['All', 'Trip', 'Living', 'Social', 'Event'];

  const filteredGroups = groups.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || g.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[26px] font-headline font-bold text-primary tracking-tight">My Groups</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-label text-[12px] font-bold border border-[#E1E3D5]">
              {groups.length} Active
            </span>
          </div>
          <p className="text-[13px] font-body text-on-surface-variant mt-1">
            Organize shared expenses across roommates, vacations, events, and outings.
          </p>
        </div>

        <button
          onClick={onOpenCreateGroup}
          className="butter-button font-label text-[13px] px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs w-fit"
        >
          <span className="material-symbols-outlined text-[18px] font-bold">add</span>
          <span>+ Create Group</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] rounded-[18px] ambient-card flex flex-wrap items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-[12px] font-label font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-secondary-container text-primary border border-primary-container/40 shadow-xs'
                  : 'bg-[#FAF9F0] text-on-surface-variant border border-[#E1E3D5] hover:bg-surface-container-high'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Live Filter Input */}
        <div className="relative min-w-[220px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter groups..."
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-[#E1E3D5] bg-[#FAF9F0] text-[12px] text-on-surface focus:outline-none focus:border-primary-container"
          />
        </div>
      </div>

      {/* Loading & Empty States */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-3 border-primary-container border-t-secondary-container rounded-full animate-spin"></div>
        </div>
      ) : filteredGroups.length === 0 ? (
        <EmptyState
          title="No groups found"
          description={search ? 'No groups match your current search query.' : 'Create your first group to start splitting bills.'}
          actionText="+ Create Group"
          onAction={onOpenCreateGroup}
        />
      ) : (
        /* Group Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGroups.map((g) => {
            const hasCredit = g.userNetBalance > 0;
            const hasDebt = g.userNetBalance < 0;

            return (
              <div
                key={g.id}
                className="rounded-[20px] bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] ambient-card overflow-hidden hover:border-primary-container/60 transition-all flex flex-col justify-between"
              >
                {/* Card Top Header */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-secondary-container/70 border border-secondary-fixed text-primary font-bold">
                      {g.category}
                    </span>
                    <span className="text-[11px] text-on-surface-variant font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      <span>{new Date(g.createdAt || Date.now()).toLocaleDateString([], { month: 'short', year: 'numeric' })}</span>
                    </span>
                  </div>

                  <div>
                    <Link
                      to={`/groups/${g.id}`}
                      className="text-[18px] font-headline font-bold text-primary hover:text-primary-action transition-colors line-clamp-1"
                    >
                      {g.name}
                    </Link>
                    <p className="text-[12px] font-body text-on-surface-variant line-clamp-2 mt-1 leading-relaxed">
                      {g.description || 'Shared bills and payments tracking pool.'}
                    </p>
                  </div>

                  {/* Members Avatars Stack */}
                  <div className="pt-2 flex items-center justify-between">
                    <div className="flex items-center -space-x-2">
                      {(g.members || []).slice(0, 5).map((m: any, idx: number) => (
                        <div
                          key={idx}
                          title={m.name}
                          className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-surface-container flex items-center justify-center font-bold text-[11px] text-primary shadow-xs"
                        >
                          {m.initials || m.name?.substring(0, 2).toUpperCase()}
                        </div>
                      ))}
                      {(g.members || []).length > 5 && (
                        <div className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-primary-container text-secondary-fixed flex items-center justify-center font-bold text-[10px]">
                          +{(g.members || []).length - 5}
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] text-outline font-medium">
                      {g.totalExpenses || 0} expenses
                    </span>
                  </div>
                </div>

                {/* Card Footer Balance Summary */}
                <div className="px-5 py-3.5 bg-[#FAF9F0] border-t border-[#E1E3D5] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-on-surface-variant block uppercase tracking-wider font-semibold">
                      Your Position
                    </span>
                    <span
                      className={`text-[14px] font-headline font-bold font-tabular ${
                        hasCredit ? 'text-[#14532D]' : hasDebt ? 'text-error' : 'text-outline'
                      }`}
                    >
                      {hasCredit
                        ? `You are owed ₹${g.userNetBalance.toFixed(2)}`
                        : hasDebt
                        ? `You owe ₹${Math.abs(g.userNetBalance).toFixed(2)}`
                        : 'Settled up'}
                    </span>
                  </div>

                  <Link
                    to={`/groups/${g.id}`}
                    className="px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-[#E1E3D5] text-[12px] font-bold text-primary hover:bg-[#DDEBD8] transition-colors flex items-center gap-1"
                  >
                    <span>View Group</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
