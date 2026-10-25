import express from 'express';
import { storage } from '../services/storageService.js';
import { calculateBalances, calculateBilateralBalances, fromPaise } from '../services/balanceService.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const currentUserId = req.query.userId || 'usr_alex';
    const [users, groups, expenses, settlements, activities] = await Promise.all([
      storage.getUsers(),
      storage.getGroups(),
      storage.getExpenses(),
      storage.getSettlements(),
      storage.getActivities(10)
    ]);

    const currentUser = users.find(u => u.id === currentUserId) || users[0] || {
      id: currentUserId,
      name: 'Alex Morgan',
      email: 'alex@splitmate.io'
    };

    // Calculate global balances across all records
    const allBalances = calculateBalances(users, expenses, settlements);
    const userGlobal = allBalances[currentUser.id] || {
      netBalancePaise: 0,
      totalPaidPaise: 0,
      totalSharePaise: 0,
      netBalance: 0,
      totalPaid: 0,
      totalShare: 0
    };

    // Calculate bilateral relationships to find total owed to you and total you owe
    const bilateral = calculateBilateralBalances(users, expenses, settlements, currentUser.id);

    let totalOwedToYouPaise = 0;
    let totalYouOwePaise = 0;

    for (const b of bilateral) {
      if (b.netPaise > 0) {
        totalOwedToYouPaise += b.netPaise;
      } else if (b.netPaise < 0) {
        totalYouOwePaise += Math.abs(b.netPaise);
      }
    }

    // Determine state
    let balanceState = 'settled';
    if (userGlobal.netBalancePaise > 0) balanceState = 'owed';
    else if (userGlobal.netBalancePaise < 0) balanceState = 'owing';

    // Group summaries with current user position
    const groupSummaries = groups.map(g => {
      const groupExpenses = expenses.filter(e => e.groupId === g.id);
      const groupSettlements = settlements.filter(s => s.groupId === g.id);
      const totalGroupSpentPaise = groupExpenses.reduce((sum, e) => sum + e.amountPaise, 0);

      const groupBalances = calculateBalances(users, groupExpenses, groupSettlements, g.id);
      const userGroupBal = groupBalances[currentUser.id] || { netBalancePaise: 0 };

      return {
        id: g.id,
        name: g.name,
        category: g.category,
        description: g.description,
        coverImage: g.coverImage,
        memberCount: (g.memberIds || []).length,
        totalExpenses: groupExpenses.length,
        totalSpent: fromPaise(totalGroupSpentPaise),
        userNetBalance: fromPaise(userGroupBal.netBalancePaise),
        userNetBalancePaise: userGroupBal.netBalancePaise
      };
    });

    // Recent expenses with formatted preview
    const recentExpenses = expenses.slice(0, 5).map(e => ({
      id: e.id,
      description: e.description,
      amount: e.amount,
      date: e.date,
      category: e.category,
      groupName: e.groupName,
      payerName: e.payerName,
      isCurrentUserPayer: e.payerId === currentUser.id,
      userShare: fromPaise(e.shares?.find(s => s.userId === currentUser.id)?.sharePaise || 0)
    }));

    // Category breakdown
    const categoryTotals = {};
    for (const exp of expenses) {
      const cat = exp.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + exp.amount;
    }

    res.json({
      currentUser,
      metrics: {
        netBalance: userGlobal.netBalance,
        netBalancePaise: userGlobal.netBalancePaise,
        totalOwedToYou: fromPaise(totalOwedToYouPaise),
        totalOwedToYouPaise,
        totalYouOwe: fromPaise(totalYouOwePaise),
        totalYouOwePaise,
        totalPaid: userGlobal.totalPaid,
        totalPaidPaise: userGlobal.totalPaidPaise,
        activeGroupsCount: groups.length,
        totalExpensesCount: expenses.length,
        balanceState // 'owed' | 'owing' | 'settled'
      },
      recentExpenses,
      recentSettlements: settlements.slice(0, 5),
      groupSummaries,
      activities,
      categoryTotals
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard data', message: err.message });
  }
});

export default router;
