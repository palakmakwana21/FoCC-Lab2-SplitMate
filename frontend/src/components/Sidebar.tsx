import React from 'react';
import { NavLink, Link } from 'react-router-dom';

interface SidebarProps {
  pinnedGroups?: Array<{ id: string; name: string; userBalance: number }>;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ pinnedGroups = [], onCloseMobile }) => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: 'dashboard' },
    { name: 'My Groups', path: '/groups', icon: 'group' },
    { name: 'All Expenses', path: '/expenses', icon: 'receipt_long' },
    { name: 'Balances', path: '/balances', icon: 'account_balance_wallet' },
    { name: 'Settlements', path: '/settlements', icon: 'handshake' },
    { name: 'Insights', path: '/insights', icon: 'analytics' }
  ];

  return (
    <aside className="h-full w-60 z-30 bg-surface-container-lowest border-r border-[#E1E3D5] flex flex-col justify-between p-4 select-none">
      <div className="flex flex-col gap-5">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 pt-2">
          <Link to="/" className="flex items-center gap-3" onClick={onCloseMobile}>
            <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-secondary-fixed shadow-sm">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                payments
              </span>
            </div>
            <div>
              <span className="font-headline font-bold text-[18px] text-primary tracking-tight block leading-tight">
                SplitMate
              </span>
              <span className="font-body text-[12px] text-on-surface-variant block leading-tight">
                Split Bills. Stay Friends.
              </span>
            </div>
          </Link>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 rounded-lg text-outline hover:text-primary hover:bg-[#FAF9F0]"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav aria-label="Main Navigation" className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                isActive
                  ? 'bg-secondary-container text-on-secondary-container font-semibold rounded-xl px-3 py-2 flex items-center gap-3 shadow-xs transition-transform active:scale-[0.98]'
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high font-medium rounded-xl px-3 py-2 flex items-center gap-3 transition-colors active:scale-[0.98]'
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      isActive ? 'text-primary' : 'text-outline'
                    }`}
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >
                    {item.icon}
                  </span>
                  <span className={`text-[14px] font-label ${isActive ? 'font-bold text-primary' : ''}`}>
                    {item.name}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Pinned Groups Snippet */}
        <div className="pt-2 border-t border-[#E1E3D5]/80">
          <div className="text-[11px] font-label font-bold tracking-wider text-outline uppercase px-3 mb-2 flex items-center justify-between">
            <span>Pinned Groups</span>
            <Link to="/groups" className="hover:text-primary transition-colors text-[10px]">
              View All
            </Link>
          </div>
          <div className="space-y-1">
            <Link
              to="/groups/grp_goa"
              onClick={onCloseMobile}
              className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#FAF9F0] text-primary font-medium text-[13px] hover:bg-[#DDEBD8] transition-colors"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                <span className="truncate">Goa Trip 🌴</span>
              </div>
              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-surface-container-high text-primary font-bold">
                +₹1.4k
              </span>
            </Link>
            <Link
              to="/groups/grp_flatmates"
              onClick={onCloseMobile}
              className="flex items-center justify-between px-3 py-1.5 rounded-lg text-on-surface-variant font-medium text-[13px] hover:bg-surface-container-high transition-colors"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-outline-variant"></span>
                <span className="truncate">Flatmates #402 🏠</span>
              </div>
              <span className="text-[11px] text-outline">₹0</span>
            </Link>
            <Link
              to="/groups/grp_weekend"
              onClick={onCloseMobile}
              className="flex items-center justify-between px-3 py-1.5 rounded-lg text-on-surface-variant font-medium text-[13px] hover:bg-surface-container-high transition-colors"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-outline-variant"></span>
                <span className="truncate">Weekend Hangouts ☕</span>
              </div>
              <span className="text-[11px] text-error font-medium">-₹240</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Area: Settings, Help & User Profile Card */}
      <div className="flex flex-col gap-2 pt-3 border-t border-[#E1E3D5]">
        <nav className="flex flex-col gap-1">
          <Link
            to="/settings"
            onClick={onCloseMobile}
            className="text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors font-medium rounded-xl px-3 py-2 flex items-center gap-3 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[20px] text-outline">settings</span>
            <span className="text-[14px] font-label">Settings</span>
          </Link>
        </nav>

        {/* Current User Card (Alex Morgan) */}
        <Link
          to="/settings"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 p-2 bg-[#FAF9F0] rounded-xl border border-[#E1E3D5] hover:border-primary-container transition-all"
        >
          <div className="relative w-9 h-9 rounded-full overflow-hidden bg-primary-container text-on-primary flex items-center justify-center font-bold text-xs ring-2 ring-secondary-container">
            <span className="text-secondary-fixed">AM</span>
          </div>
          <div className="flex flex-col overflow-hidden min-w-0">
            <span className="font-label text-[13px] text-primary font-bold truncate leading-tight">
              Alex Morgan
            </span>
            <span className="font-body text-[11px] text-on-surface-variant truncate">
              alex@splitmate.io
            </span>
          </div>
        </Link>
      </div>
    </aside>
  );
};
