import express from 'express';
import { storage } from '../services/storageService.js';
import { toPaise, fromPaise } from '../services/balanceService.js';

const router = express.Router();

// GET all settlements
router.get('/', async (req, res) => {
  try {
    const settlements = await storage.getSettlements();
    res.json(settlements);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settlements', message: err.message });
  }
});

// GET settlement by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const settlement = await storage.getSettlement(id);
    if (!settlement) {
      return res.status(404).json({ error: 'Settlement not found' });
    }
    res.json(settlement);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settlement', message: err.message });
  }
});

// POST record settlement
router.post('/', async (req, res) => {
  try {
    const { payerId, recipientId, amount, groupId, method = 'UPI', notes, date } = req.body;

    if (!payerId || !recipientId) {
      return res.status(400).json({ error: 'Payer and Recipient are both required' });
    }

    if (payerId === recipientId) {
      return res.status(400).json({ error: 'Payer and Recipient cannot be the same person' });
    }

    const amountPaise = toPaise(amount);
    if (amountPaise <= 0) {
      return res.status(400).json({ error: 'Settlement amount must be greater than zero' });
    }

    const [users, groups] = await Promise.all([storage.getUsers(), storage.getGroups()]);
    const payer = users.find(u => u.id === payerId);
    const recipient = users.find(u => u.id === recipientId);

    if (!payer || !recipient) {
      return res.status(400).json({ error: 'Invalid payer or recipient ID' });
    }

    const group = groupId ? groups.find(g => g.id === groupId) : null;
    const groupName = group ? group.name : 'General Settlement';

    const id = `stl_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newSettlement = {
      id,
      groupId: groupId || null,
      groupName,
      payerId,
      payerName: payer.name,
      recipientId,
      recipientName: recipient.name,
      amount: fromPaise(amountPaise),
      amountPaise,
      method,
      notes: notes || '',
      date: date || new Date().toISOString(),
      status: 'completed',
      createdAt: new Date().toISOString()
    };

    await storage.saveSettlement(newSettlement);
    await storage.addActivity({
      type: 'SETTLEMENT_RECORDED',
      title: 'Settlement Completed',
      description: `${payer.name} paid ₹${newSettlement.amount.toFixed(2)} to ${recipient.name} via ${method}`,
      userId: payerId,
      groupId: groupId || null
    });

    res.status(201).json(newSettlement);
  } catch (err) {
    res.status(400).json({ error: 'Failed to record settlement', message: err.message });
  }
});

export default router;
