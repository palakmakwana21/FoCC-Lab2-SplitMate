import express from 'express';
import { storage } from '../services/storageService.js';
import {
  toPaise,
  fromPaise,
  calculateEqualSplit,
  validateAndCalculateExactSplit,
  calculatePercentageSplit
} from '../services/balanceService.js';

const router = express.Router();

// GET all expenses with query filters
router.get('/', async (req, res) => {
  try {
    const { groupId, category, search, limit } = req.query;
    const expenses = await storage.getExpenses({ groupId, category, search });
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    const result = parsedLimit ? expenses.slice(0, parsedLimit) : expenses;
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expenses', message: err.message });
  }
});

// GET single expense by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await storage.getExpense(id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expense', message: err.message });
  }
});

// POST create new expense
router.post('/', async (req, res) => {
  try {
    const {
      description,
      amount,
      groupId,
      payerId,
      date,
      category,
      splitMethod = 'equal',
      participantIds,
      customShares,
      percentageShares,
      notes,
      receiptUrl
    } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Expense description is required' });
    }

    const amountPaise = toPaise(amount);
    if (amountPaise <= 0) {
      return res.status(400).json({ error: 'Expense amount must be greater than zero' });
    }

    if (!payerId) {
      return res.status(400).json({ error: 'Payer must be specified' });
    }

    // Lookup payer and group details
    const [users, groups] = await Promise.all([storage.getUsers(), storage.getGroups()]);
    const payer = users.find(u => u.id === payerId);
    if (!payer) {
      return res.status(400).json({ error: 'Invalid payer ID' });
    }

    const group = groupId ? groups.find(g => g.id === groupId) : null;
    const groupName = group ? group.name : 'Non-group Expense';

    // Calculate shares according to split method
    let calculatedShares = [];

    if (splitMethod === 'equal') {
      const pIds = participantIds && participantIds.length > 0
        ? participantIds
        : (group ? group.memberIds : [payerId]);

      calculatedShares = calculateEqualSplit(amountPaise, pIds);
    } else if (splitMethod === 'exact') {
      calculatedShares = validateAndCalculateExactSplit(amountPaise, customShares || []);
    } else if (splitMethod === 'percentage') {
      calculatedShares = calculatePercentageSplit(amountPaise, percentageShares || []);
    } else {
      return res.status(400).json({ error: `Unsupported split method: ${splitMethod}` });
    }

    // Attach user display amounts to shares
    const finalShares = calculatedShares.map(s => ({
      ...s,
      shareAmount: fromPaise(s.sharePaise)
    }));

    const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newExpense = {
      id,
      description: description.trim(),
      amount: fromPaise(amountPaise),
      amountPaise,
      groupId: groupId || null,
      groupName,
      payerId,
      payerName: payer.name,
      category: category || 'Other',
      splitMethod,
      date: date || new Date().toISOString(),
      notes: notes || '',
      receiptUrl: receiptUrl || null,
      shares: finalShares,
      createdAt: new Date().toISOString()
    };

    await storage.saveExpense(newExpense);
    await storage.addActivity({
      type: 'EXPENSE_ADDED',
      title: 'New Expense Added',
      description: `${payer.name} added "${newExpense.description}" (₹${newExpense.amount.toFixed(2)}) in ${groupName}`,
      userId: payerId,
      groupId: groupId || null
    });

    res.status(201).json(newExpense);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create expense', message: err.message });
  }
});

// PATCH update expense
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await storage.getExpense(id);
    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const {
      description,
      amount,
      groupId,
      payerId,
      date,
      category,
      splitMethod,
      participantIds,
      customShares,
      percentageShares,
      notes
    } = req.body;

    const amountPaise = amount !== undefined ? toPaise(amount) : existing.amountPaise;
    const activePayerId = payerId || existing.payerId;
    const activeSplitMethod = splitMethod || existing.splitMethod;
    const activeGroupId = groupId !== undefined ? groupId : existing.groupId;

    const [users, groups] = await Promise.all([storage.getUsers(), storage.getGroups()]);
    const payer = users.find(u => u.id === activePayerId) || { name: existing.payerName };
    const group = activeGroupId ? groups.find(g => g.id === activeGroupId) : null;

    let finalShares = existing.shares;

    // Recalculate shares if amount or split parameters changed
    if (
      amount !== undefined ||
      splitMethod !== undefined ||
      participantIds !== undefined ||
      customShares !== undefined ||
      percentageShares !== undefined
    ) {
      let calculatedShares = [];
      if (activeSplitMethod === 'equal') {
        const pIds = participantIds || existing.shares.map(s => s.userId);
        calculatedShares = calculateEqualSplit(amountPaise, pIds);
      } else if (activeSplitMethod === 'exact') {
        calculatedShares = validateAndCalculateExactSplit(amountPaise, customShares || []);
      } else if (activeSplitMethod === 'percentage') {
        calculatedShares = calculatePercentageSplit(amountPaise, percentageShares || []);
      }
      finalShares = calculatedShares.map(s => ({
        ...s,
        shareAmount: fromPaise(s.sharePaise)
      }));
    }

    const updatedExpense = {
      ...existing,
      description: description !== undefined ? description.trim() : existing.description,
      amount: fromPaise(amountPaise),
      amountPaise,
      groupId: activeGroupId,
      groupName: group ? group.name : existing.groupName,
      payerId: activePayerId,
      payerName: payer.name,
      category: category !== undefined ? category : existing.category,
      splitMethod: activeSplitMethod,
      date: date !== undefined ? date : existing.date,
      notes: notes !== undefined ? notes : existing.notes,
      shares: finalShares,
      updatedAt: new Date().toISOString()
    };

    await storage.saveExpense(updatedExpense);
    await storage.addActivity({
      type: 'EXPENSE_UPDATED',
      title: 'Expense Updated',
      description: `Updated "${updatedExpense.description}"`,
      userId: activePayerId,
      groupId: activeGroupId
    });

    res.json(updatedExpense);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update expense', message: err.message });
  }
});

// DELETE expense
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await storage.getExpense(id);
    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await storage.deleteExpense(id);
    await storage.addActivity({
      type: 'EXPENSE_DELETED',
      title: 'Expense Deleted',
      description: `Removed "${existing.description}" (₹${existing.amount.toFixed(2)})`,
      groupId: existing.groupId
    });

    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete expense', message: err.message });
  }
});

export default router;
