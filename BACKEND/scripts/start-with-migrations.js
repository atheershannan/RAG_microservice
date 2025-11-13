/**
 * Start Server with Migrations
 * Runs Prisma migrations before starting the server
 * Used by Railway deployment
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const backendRoot = join(__dirname, '..');
const projectRoot = join(backendRoot, '..');

// Simple console logger
const log = {
  info: (msg, ...args) => console.log(`[INFO] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[WARN] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR] ${msg}`, ...args),
};

async function runMigrations() {
  try {
    log.info('Running database migrations...');
    
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      log.warn('DATABASE_URL environment variable is not set!');
      log.warn('Migrations will be skipped. Make sure DATABASE_URL is configured.');
      return;
    }
    
    const schemaPath = join(projectRoot, 'DATABASE', 'prisma', 'schema.prisma');
    const migrationsPath = join(projectRoot, 'DATABASE', 'prisma', 'migrations');
    log.info(`Using schema: ${schemaPath}`);
    
    // Check if migrations directory exists and has migrations
    const fs = await import('fs');
    let hasMigrations = false;
    try {
      if (fs.existsSync(migrationsPath)) {
        const files = fs.readdirSync(migrationsPath);
        hasMigrations = files.some(file => 
          file !== '.gitkeep' && 
          fs.statSync(join(migrationsPath, file)).isDirectory()
        );
      }
    } catch (err) {
      log.warn('Could not check migrations directory:', err.message);
    }
    
    if (hasMigrations) {
      // If migrations exist, try to deploy them
      try {
        log.info('Found migrations, attempting to deploy...');
        execSync(`npx prisma migrate deploy --schema=${schemaPath}`, {
          stdio: 'inherit',
          env: { ...process.env },
          cwd: projectRoot,
          shell: true,
          timeout: 120000, // 2 minute timeout for migrations
        });
        log.info('✅ Migrations deployed successfully');
        return;
      } catch (deployError) {
        log.error('Failed to deploy migrations:', deployError.message);
        log.warn('Falling back to db push...');
      }
    } else {
      log.info('No migrations found, using db push for initial setup...');
    }
    
    // Fallback: Use db push if no migrations or deploy failed
    // For Railway, we'll skip the timeout and let it run, but start server anyway
    log.info('Pushing database schema (running in background)...');
    log.info('⚠️  Note: db push may take 5-10 minutes. Server will start regardless.');
    
    // Run db push asynchronously - don't wait for it
    const { spawn } = await import('child_process');
    const pushProcess = spawn('npx', [
      'prisma',
      'db',
      'push',
      '--schema=' + schemaPath,
      '--accept-data-loss',
      '--skip-generate'
    ], {
      stdio: 'inherit',
      env: { ...process.env },
      cwd: projectRoot,
      shell: true,
      detached: true,
    });
    
    pushProcess.on('error', (error) => {
      log.error('Failed to start schema push:', error.message);
    });
    
    pushProcess.on('exit', (code) => {
      if (code === 0) {
        log.info('✅ Database schema pushed successfully (completed in background)');
      } else {
        log.warn(`⚠️  Schema push exited with code ${code}. Server is already running.`);
      }
    });
    
    // Unref so parent process can exit
    pushProcess.unref();
    
    // Don't wait - start server immediately
    log.info('⏩ Starting server while schema push runs in background...');
  } catch (error) {
    log.error('Migration failed:', error.message);
    log.error('Stack:', error.stack);
    // Don't exit - let the server start anyway (migrations might already be applied)
    log.warn('⚠️  Continuing with server start despite migration error');
    log.warn('⚠️  Database might not be fully synced. Check logs above for details.');
  }
}

async function startServer() {
  try {
    log.info('Starting server...');
    const serverPath = join(backendRoot, 'src', 'index.js');
    await import(serverPath);
  } catch (error) {
    log.error('Server start failed:', error.message);
    log.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run migrations first, then start server
runMigrations()
  .then(() => startServer())
  .catch((error) => {
    log.error('Startup failed:', error);
    log.error('Stack:', error.stack);
    process.exit(1);
  });

