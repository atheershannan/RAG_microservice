/**
 * Migration and Start Script
 * Runs Prisma migrations before starting the server
 */

import { execSync } from 'child_process';
import { logger } from '../src/utils/logger.util.js';

async function runMigrations() {
  try {
    logger.info('Running database migrations...');
    
    // First, try to deploy existing migrations
    try {
      execSync('npx prisma migrate deploy --schema=./prisma/schema.prisma', {
        stdio: 'inherit',
        env: process.env,
      });
      logger.info('Migrations deployed successfully');
    } catch (deployError) {
      // If no migrations exist, try db push (for initial setup)
      logger.warn('No migrations found or deploy failed, trying db push...');
      execSync('npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss', {
        stdio: 'inherit',
        env: process.env,
      });
      logger.info('Database schema pushed successfully');
    }
  } catch (error) {
    logger.error('Migration failed:', error.message);
    // Don't exit - let the server start anyway (migrations might already be applied)
    logger.warn('Continuing with server start despite migration error');
  }
}

async function startServer() {
  try {
    logger.info('Starting server...');
    // Import and start the server
    await import('../src/index.js');
  } catch (error) {
    logger.error('Server start failed:', error.message);
    process.exit(1);
  }
}

// Run migrations first, then start server
runMigrations()
  .then(() => startServer())
  .catch((error) => {
    logger.error('Startup failed:', error);
    process.exit(1);
  });

