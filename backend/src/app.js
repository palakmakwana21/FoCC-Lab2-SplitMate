import express from 'express';
import cors from 'cors';
import healthRouter from './routes/health.js';
import dashboardRouter from './routes/dashboard.js';
import groupsRouter from './routes/groups.js';
import expensesRouter from './routes/expenses.js';
import balancesRouter from './routes/balances.js';
import settlementsRouter from './routes/settlements.js';
import insightsRouter from './routes/insights.js';
import { storage } from './services/storageService.js';
import { seedDemoData } from './services/seedService.js';

const app = express();

// Standard middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl !== '/api/health') {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// API Routes
app.use('/api/health', healthRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/balances', balancesRouter);
app.use('/api/settlements', settlementsRouter);
app.use('/api/insights', insightsRouter);

// Users list endpoint
app.get('/api/users', async (req, res) => {
  try {
    const users = await storage.getUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users', message: err.message });
  }
});

// Seed & Reset endpoints
app.post('/api/seed', async (req, res) => {
  try {
    const force = req.body?.force === true;
    await seedDemoData(force);
    res.json({ success: true, message: 'Demo data seeded successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to seed data', message: err.message });
  }
});

app.post('/api/reset', async (req, res) => {
  try {
    await storage.resetData();
    res.json({ success: true, message: 'Database reset successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset data', message: err.message });
  }
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('[Error]', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error'
  });
});

export default app;
