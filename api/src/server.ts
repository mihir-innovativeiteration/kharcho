import { createApp } from './app.js';
import { prisma } from './config/db.js';
import { env } from './config/env.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Kharcho API Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

// Graceful Shutdown
async function shutdown(signal: string) {
  console.log(`\n🛑 Received ${signal}. Gracefully shutting down Kharcho API...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    await prisma.$disconnect();
    console.log('Database connections closed.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
