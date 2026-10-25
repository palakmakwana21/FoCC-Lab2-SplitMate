import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TopNavBar } from './components/TopNavBar';
import { AddExpenseModal } from './components/AddExpenseModal';
import { CreateGroupModal } from './components/CreateGroupModal';
import { SettleUpModal } from './components/SettleUpModal';
import { Toast } from './components/Toast';

import { DashboardPage } from './pages/DashboardPage';
import { GroupsPage } from './pages/GroupsPage';
import { GroupDetailsPage } from './pages/GroupDetailsPage';
import { AllExpensesPage } from './pages/AllExpensesPage';
import { BalancesPage } from './pages/BalancesPage';
import { SettlementsPage } from './pages/SettlementsPage';
import { InsightsPage } from './pages/InsightsPage';
import { SettingsPage } from './pages/SettingsPage';

import { api } from './api/client';

export const App: React.FC = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [addExpenseGroupId, setAddExpenseGroupId] = useState<string | undefined>();

  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);
  const [settleUpRecipientId, setSettleUpRecipientId] = useState<string | undefined>();
  const [settleUpAmount, setSettleUpAmount] = useState<number | undefined>();
  const [settleUpGroupId, setSettleUpGroupId] = useState<string | undefined>();

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Refresh trigger for global data
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((prev) => prev + 1);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    const loadCommon = async () => {
      try {
        const [grpList, usrList] = await Promise.all([api.getGroups(), api.getUsers()]);
        setGroups(grpList);
        setUsers(usrList);
      } catch (err) {
        console.warn('Initial load error:', err);
      }
    };
    loadCommon();
  }, [refreshKey]);

  const handleOpenAddExpense = (groupId?: string) => {
    setAddExpenseGroupId(groupId);
    setIsAddExpenseOpen(true);
  };

  const handleOpenSettleUp = (recipientId?: string, amount?: number, groupId?: string) => {
    setSettleUpRecipientId(recipientId);
    setSettleUpAmount(amount);
    setSettleUpGroupId(groupId);
    setIsSettleUpOpen(true);
  };

  return (
    <BrowserRouter>
      <div className="flex h-screen w-screen overflow-hidden bg-[#FAF9F0] text-on-surface select-none">
        {/* Desktop Sidebar (Fixed 240px) */}
        <div className="hidden lg:block fixed top-0 left-0 bottom-0 w-60 z-30">
          <Sidebar />
        </div>

        {/* Mobile Collapsible Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-[#003b1b]/40 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-64 max-w-[80vw] h-full z-10">
              <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Application Container */}
        <div className="flex-1 lg:ml-60 flex flex-col h-screen overflow-hidden">
          {/* Top App Bar */}
          <TopNavBar
            onOpenAddExpense={() => handleOpenAddExpense()}
            onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          />

          {/* Page Viewport */}
          <main className="flex-1 pt-20 px-4 sm:px-6 md:px-8 pb-12 overflow-y-auto max-w-[1380px] w-full mx-auto">
            <Routes>
              <Route
                path="/"
                element={
                  <DashboardPage
                    key={refreshKey}
                    onOpenAddExpense={() => handleOpenAddExpense()}
                    onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
                    onOpenSettleUp={(fId) => handleOpenSettleUp(fId)}
                  />
                }
              />
              <Route
                path="/groups"
                element={
                  <GroupsPage
                    key={refreshKey}
                    onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
                    onOpenAddExpense={() => handleOpenAddExpense()}
                  />
                }
              />
              <Route
                path="/groups/:id"
                element={
                  <GroupDetailsPage
                    key={refreshKey}
                    onOpenAddExpenseWithGroup={(gId) => handleOpenAddExpense(gId)}
                    onOpenSettleUpWithGroup={(gId, rId) => handleOpenSettleUp(rId, undefined, gId)}
                  />
                }
              />
              <Route
                path="/expenses"
                element={<AllExpensesPage key={refreshKey} onOpenAddExpense={() => handleOpenAddExpense()} />}
              />
              <Route
                path="/balances"
                element={
                  <BalancesPage
                    key={refreshKey}
                    onOpenSettleUp={(fId, amt) => handleOpenSettleUp(fId, amt)}
                    onShowToast={showToast}
                  />
                }
              />
              <Route
                path="/settlements"
                element={<SettlementsPage key={refreshKey} onOpenSettleUp={() => handleOpenSettleUp()} />}
              />
              <Route path="/insights" element={<InsightsPage key={refreshKey} />} />
              <Route
                path="/settings"
                element={<SettingsPage onShowToast={showToast} onRefreshAll={triggerRefresh} />}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>

        {/* Global Modals */}
        <AddExpenseModal
          isOpen={isAddExpenseOpen}
          initialGroupId={addExpenseGroupId}
          groups={groups}
          users={users}
          onClose={() => setIsAddExpenseOpen(false)}
          onSuccess={(newExp) => {
            showToast(`Added "${newExp.description}" (₹${Number(newExp.amount).toFixed(2)})!`, 'success');
            triggerRefresh();
          }}
        />

        <CreateGroupModal
          isOpen={isCreateGroupOpen}
          users={users}
          onClose={() => setIsCreateGroupOpen(false)}
          onSuccess={(newGrp) => {
            showToast(`Created group "${newGrp.name}"!`, 'success');
            triggerRefresh();
          }}
        />

        <SettleUpModal
          isOpen={isSettleUpOpen}
          initialRecipientId={settleUpRecipientId}
          initialAmount={settleUpAmount}
          initialGroupId={settleUpGroupId}
          users={users}
          groups={groups}
          onClose={() => setIsSettleUpOpen(false)}
          onSuccess={(stl) => {
            showToast(`Recorded settlement of ₹${Number(stl.amount).toFixed(2)} to ${stl.recipientName}!`, 'success');
            triggerRefresh();
          }}
        />

        {/* Floating Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </BrowserRouter>
  );
};

export default App;
