import app from './app.js';
import { seedDemoData } from './services/seedService.js';

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    // Automatically seed demo data if database is empty
    await seedDemoData(false);

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`===============================================`);
      console.log(`  SplitMate Backend API listening on port ${PORT}`);
      console.log(`  Health Check: http://localhost:${PORT}/api/health`);
      console.log(`  Dashboard:    http://localhost:${PORT}/api/dashboard`);
      console.log(`===============================================`);
    });

    // Graceful shutdown handling
    const handleShutdown = () => {
      console.log('\n[Server] Graceful shutdown initiated...');
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', handleShutdown);
    process.on('SIGINT', handleShutdown);
  } catch (err) {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
  }
}

start();
