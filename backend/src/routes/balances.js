import express from 'express';
import { storage } from '../services/storageService.js';
import {
  calculateBalances,
  calculateBilateralBalances,
  simplifyDebts,
  fromPaise
} from '../services/balanceService.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const currentUserId = req.query.userId || 'usr_alex';
    const { groupId } = req.query;

    const [users, allExpenses, allSettlements] = await Promise.all([
      storage.getUsers(),
      storage.getExpenses(),
      storage.getSettlements()
    ]);

    const expenses = groupId ? allExpenses.filter(e => e.groupId === groupId) : allExpenses;
    const settlements = groupId ? allSettlements.filter(s => s.groupId === groupId) : allSettlements;

    const currentUser = users.find(u => u.id === currentUserId) || users[0] || { id: currentUserId, name: 'Alex Morgan' };

    // 1. Overall calculated user balances (where sum across users == 0)
    const userBalances = calculateBalances(users, expenses, settlements, groupId || null);

    // 2. Bilateral breakdown between currentUser and each friend
    const bilateralFriends = calculateBilateralBalances(users, expenses, settlements, currentUser.id);

    // 3. User maps for simplified debt algorithm
    const userMap = {};
    for (const u of users) userMap[u.id] = u;

    // 4. Run Graph Theory Min-Cash-Flow Simplification Algorithm
    const simplifiedTransfers = simplifyDebts(userBalances, userMap);

    // Calculate aggregated metrics for current user
    let totalOwedToYouPaise = 0;
    let totalYouOwePaise = 0;

    for (const f of bilateralFriends) {
      if (f.netPaise > 0) {
        totalOwedToYouPaise += f.netPaise;
      } else if (f.netPaise < 0) {
        totalYouOwePaise += Math.abs(f.netPaise);
      }
    }

    const currentNetPaise = userBalances[currentUser.id]?.netBalancePaise || 0;

    res.json({
      currentUser,
      metrics: {
        netBalance: fromPaise(currentNetPaise),
        netBalancePaise: currentNetPaise,
        totalOwedToYou: fromPaise(totalOwedToYouPaise),
        totalOwedToYouPaise,
        totalYouOwe: fromPaise(totalYouOwePaise),
        totalYouOwePaise
      },
      bilateralFriends,
      simplifiedTransfers,
      allUserBalances: Object.values(userBalances)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate balances', message: err.message });
  }
});

export default router;
