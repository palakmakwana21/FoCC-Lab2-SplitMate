import React from 'react';
import { useLocation, Link } from 'react-router-dom';

interface TopNavBarProps {
  onOpenAddExpense: () => void;
  onToggleMobileMenu: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  onOpenAddExpense,
  onToggleMobileMenu,
  searchQuery = '',
  onSearchChange
}) => {
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/groups/')) return 'Group Details';
    if (path === '/groups') return 'My Groups';
    if (path === '/expenses') return 'All Expenses';
    if (path === '/balances') return 'Balances';
    if (path === '/settlements') return 'Settlements';
    if (path === '/insights') return 'Insights';
    if (path === '/settings') return 'Settings';
    return 'SplitMate';
  };

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-60 h-16 bg-surface-container-lowest border-b border-[#E1E3D5] shadow-xs z-20 flex items-center justify-between px-4 sm:px-6">
      {/* Left Area: Mobile Menu Trigger + Breadcrumb + Search */}
      <div className="flex items-center gap-3 sm:gap-6 flex-1 max-w-2xl">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-on-surface-variant hover:bg-[#FAF9F0] transition-colors"
          aria-label="Open navigation menu"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>

        <div className="hidden md:flex items-center gap-1.5 text-[13px] font-label text-on-surface-variant">
          <span className="text-outline">Pages</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-bold">{getPageTitle()}</span>
        </div>

        {/* Global Live Search Input */}
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Search groups, expenses, or friends..."
            className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-[#E1E3D5] bg-[#FAF9F0] text-[13px] font-body text-on-surface placeholder:text-outline focus:border-primary-container focus:ring-2 focus:ring-secondary-container focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Right Controls: Notification, + Add Expense CTA, User Avatar */}
      <div className="flex items-center gap-3">
        {/* Notification Icon */}
        <button
          aria-label="Notifications"
          className="relative p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error ring-2 ring-surface-container-lowest"></span>
        </button>

        {/* Primary "+ Add Expense" CTA */}
        <button
          onClick={onOpenAddExpense}
          className="butter-button font-label text-[13px] px-3.5 sm:px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs"
        >
          <span className="material-symbols-outlined text-[18px] font-bold">add</span>
          <span className="whitespace-nowrap font-bold">+ Add Expense</span>
        </button>

        {/* User Profile Avatar */}
        <Link to="/settings" className="flex items-center pl-1 sm:pl-2 border-l border-[#E1E3D5]">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-xs font-bold ring-2 ring-[#FFE83D]">
            <span className="text-secondary-fixed">AM</span>
          </div>
        </Link>
      </div>
    </header>
  );
};
