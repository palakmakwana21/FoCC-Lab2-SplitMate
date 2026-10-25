import express from 'express';
import { storage } from '../services/storageService.js';
import { calculateBalances, simplifyDebts, fromPaise } from '../services/balanceService.js';

const router = express.Router();

// GET all groups
router.get('/', async (req, res) => {
  try {
    const currentUserId = req.query.userId || 'usr_alex';
    const [groups, expenses, settlements, users] = await Promise.all([
      storage.getGroups(),
      storage.getExpenses(),
      storage.getSettlements(),
      storage.getUsers()
    ]);

    const result = groups.map(g => {
      const gExpenses = expenses.filter(e => e.groupId === g.id);
      const gSettlements = settlements.filter(s => s.groupId === g.id);
      const totalSpentPaise = gExpenses.reduce((sum, e) => sum + e.amountPaise, 0);

      const balances = calculateBalances(users, gExpenses, gSettlements, g.id);
      const userBal = balances[currentUserId] || { netBalancePaise: 0, netBalance: 0 };

      const memberDetails = (g.memberIds || []).map(id => {
        const u = users.find(user => user.id === id);
        return u || { id, name: 'Friend', initials: 'FR' };
      });

      return {
        ...g,
        members: memberDetails,
        totalExpenses: gExpenses.length,
        totalSpent: fromPaise(totalSpentPaise),
        totalSpentPaise,
        userNetBalance: userBal.netBalance,
        userNetBalancePaise: userBal.netBalancePaise
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch groups', message: err.message });
  }
});

// GET group by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.query.userId || 'usr_alex';
    const [group, allUsers, expenses, settlements] = await Promise.all([
      storage.getGroup(id),
      storage.getUsers(),
      storage.getExpenses({ groupId: id }),
      storage.getSettlements()
    ]);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const groupSettlements = settlements.filter(s => s.groupId === id);
    const memberUsers = allUsers.filter(u => (group.memberIds || []).includes(u.id));

    // Calculate balances for this group
    const balances = calculateBalances(memberUsers, expenses, groupSettlements, id);
    const userMap = {};
    for (const u of memberUsers) userMap[u.id] = u;

    // Run simplification algorithm for this specific group
    const simplifiedTransfers = simplifyDebts(balances, userMap);

    const totalSpentPaise = expenses.reduce((sum, e) => sum + e.amountPaise, 0);
    const userBalance = balances[currentUserId] || { netBalancePaise: 0, netBalance: 0 };

    res.json({
      group: {
        ...group,
        members: memberUsers,
        totalSpent: fromPaise(totalSpentPaise),
        totalSpentPaise,
        expenseCount: expenses.length,
        userBalance: userBalance.netBalance,
        userBalancePaise: userBalance.netBalancePaise
      },
      members: memberUsers.map(m => ({
        ...m,
        balance: balances[m.id]?.netBalance || 0,
        balancePaise: balances[m.id]?.netBalancePaise || 0,
        totalPaid: balances[m.id]?.totalPaid || 0,
        totalShare: balances[m.id]?.totalShare || 0
      })),
      expenses,
      settlements: groupSettlements,
      simplifiedTransfers
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch group details', message: err.message });
  }
});

// POST create group
router.post('/', async (req, res) => {
  try {
    const { name, category, description, memberIds, coverImage, currency } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const id = `grp_${Date.now()}`;
    const newGroup = {
      id,
      name: name.trim(),
      category: category || 'Social',
      description: description || '',
      coverImage: coverImage || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
      currency: currency || 'INR',
      memberIds: memberIds && memberIds.length > 0 ? memberIds : ['usr_alex'],
      createdAt: new Date().toISOString()
    };

    await storage.saveGroup(newGroup);
    await storage.addActivity({
      type: 'GROUP_CREATED',
      title: 'New Group Created',
      description: `Created group "${newGroup.name}"`,
      groupId: id
    });

    res.status(201).json(newGroup);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create group', message: err.message });
  }
});

// PATCH update group
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await storage.getGroup(id);
    if (!existing) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const updated = {
      ...existing,
      ...req.body,
      id // preserve ID
    };

    await storage.saveGroup(updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update group', message: err.message });
  }
});

// DELETE group
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await storage.getGroup(id);
    if (!existing) {
      return res.status(404).json({ error: 'Group not found' });
    }

    await storage.deleteGroup(id);
    await storage.addActivity({
      type: 'GROUP_DELETED',
      title: 'Group Removed',
      description: `Removed group "${existing.name}"`
    });

    res.json({ success: true, message: 'Group deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete group', message: err.message });
  }
});

export default router;
