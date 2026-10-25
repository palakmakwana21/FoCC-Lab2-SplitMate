import express from 'express';
import { storage } from '../services/storageService.js';
import { fromPaise } from '../services/balanceService.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const expenses = await storage.getExpenses();
    const groups = await storage.getGroups();

    if (expenses.length === 0) {
      return res.json({
        hasData: false,
        totalExpenses: 0,
        totalSpent: 0,
        byCategory: [],
        byGroup: [],
        monthlyTrend: [],
        largestExpenses: []
      });
    }

    const totalSpentPaise = expenses.reduce((sum, e) => sum + e.amountPaise, 0);

    // 1. Spending by Category
    const categoryMap = {};
    const categoryColors = {
      'Food & Dining': '#F59E0B',
      'Stay': '#3B82F6',
      'Transport': '#10B981',
      'Groceries': '#8B5CF6',
      'Utilities': '#EC4899',
      'Entertainment': '#EF4444',
      'Other': '#6B7280'
    };

    for (const e of expenses) {
      const cat = e.category || 'Other';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { category: cat, totalPaise: 0, count: 0 };
      }
      categoryMap[cat].totalPaise += e.amountPaise;
      categoryMap[cat].count += 1;
    }

    const byCategory = Object.values(categoryMap).map(c => ({
      category: c.category,
      amount: fromPaise(c.totalPaise),
      amountPaise: c.totalPaise,
      count: c.count,
      percentage: Number(((c.totalPaise / totalSpentPaise) * 100).toFixed(1)),
      color: categoryColors[c.category] || '#21864A'
    })).sort((a, b) => b.amountPaise - a.amountPaise);

    // 2. Spending by Group
    const groupMap = {};
    for (const e of expenses) {
      const gName = e.groupName || 'Non-group';
      if (!groupMap[gName]) {
        groupMap[gName] = { groupName: gName, totalPaise: 0, count: 0 };
      }
      groupMap[gName].totalPaise += e.amountPaise;
      groupMap[gName].count += 1;
    }

    const byGroup = Object.values(groupMap).map(g => ({
      groupName: g.groupName,
      amount: fromPaise(g.totalPaise),
      amountPaise: g.totalPaise,
      count: g.count,
      percentage: Number(((g.totalPaise / totalSpentPaise) * 100).toFixed(1))
    })).sort((a, b) => b.amountPaise - a.amountPaise);

    // 3. Monthly Spending Trend
    const monthMap = {};
    for (const e of expenses) {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!monthMap[key]) {
        monthMap[key] = { key, monthLabel, totalPaise: 0, count: 0 };
      }
      monthMap[key].totalPaise += e.amountPaise;
      monthMap[key].count += 1;
    }

    const monthlyTrend = Object.values(monthMap)
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(m => ({
        month: m.monthLabel,
        amount: fromPaise(m.totalPaise),
        amountPaise: m.totalPaise,
        count: m.count
      }));

    // 4. Largest Expenses
    const largestExpenses = [...expenses]
      .sort((a, b) => b.amountPaise - a.amountPaise)
      .slice(0, 5)
      .map(e => ({
        id: e.id,
        description: e.description,
        amount: e.amount,
        category: e.category,
        groupName: e.groupName,
        date: e.date,
        payerName: e.payerName
      }));

    res.json({
      hasData: true,
      totalExpenses: expenses.length,
      totalSpent: fromPaise(totalSpentPaise),
      totalSpentPaise,
      averageExpense: fromPaise(Math.round(totalSpentPaise / expenses.length)),
      byCategory,
      byGroup,
      monthlyTrend,
      largestExpenses
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate insights', message: err.message });
  }
});

export default router;
