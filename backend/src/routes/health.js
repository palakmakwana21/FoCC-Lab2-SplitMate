import express from 'express';
import { storage } from '../services/storageService.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const status = storage.getStatus();
    const uptimeSec = Math.floor(process.uptime());

    res.status(200).json({
      status: 'healthy',
      service: 'splitmate-backend',
      timestamp: new Date().toISOString(),
      uptime: `${uptimeSec}s`,
      storage: status.storageEngine,
      isRedisConnected: status.isRedisConnected,
      counts: status.counts,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (err) {
    res.status(500).json({
      status: 'unhealthy',
      error: err.message
    });
  }
});

export default router;
