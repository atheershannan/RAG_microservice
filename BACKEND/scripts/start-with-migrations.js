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
    
    // Skip migrations if SKIP_MIGRATIONS is set (for faster deployment)
    if (process.env.SKIP_MIGRATIONS === 'true') {
      log.warn('⚠️  SKIP_MIGRATIONS=true - Skipping database migrations');
      log.warn('⚠️  Make sure to run migrations manually or use db push');
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
        log.info(`Schema path: ${schemaPath}`);
        log.info(`Migrations path: ${migrationsPath}`);
        
        // First, generate Prisma client to ensure it's up to date
        // Generate in BACKEND directory so it's in the right location
        log.info('Generating Prisma client...');
        execSync(`npx prisma generate --schema=${schemaPath}`, {
          stdio: 'inherit',
          env: { ...process.env },
          cwd: backendRoot, // Generate in BACKEND directory
          shell: true,
          timeout: 60000, // 1 minute timeout
        });
        
        // Then deploy migrations
        log.info('Deploying migrations...');
        log.info(`DATABASE_URL: ${process.env.DATABASE_URL ? 'Set (hidden)' : 'NOT SET'}`);
        
        try {
          log.info('Starting migration deploy (this may take a few minutes)...');
          log.info('Note: If this times out, migrations may need to be run manually');
          
          // Use CONCURRENTLY for indexes if possible, but for now just run with longer timeout
          // Migrations are split to avoid timeout - HNSW index is in separate migration
          execSync(`npx prisma migrate deploy --schema=${schemaPath}`, {
            stdio: 'inherit',
            env: { ...process.env },
            cwd: projectRoot,
            shell: true,
            timeout: 600000, // 10 minute timeout for migrations (HNSW can take time)
          });
          log.info('✅ Migrations deployed successfully');
          return;
        } catch (migrateError) {
          log.error('Migration deploy failed:', migrateError.message);
          log.error('Exit code:', migrateError.status || migrateError.code);
          
          // Check if it's a connection issue
          if (migrateError.message && (
            migrateError.message.includes('ECONNREFUSED') ||
            migrateError.message.includes('timeout') ||
            migrateError.message.includes('connection')
          )) {
            log.error('❌ Database connection failed!');
            log.error('💡 Check DATABASE_URL in Railway environment variables');
            log.error('💡 Make sure Supabase service is linked and DATABASE_URL is set');
            throw migrateError; // Re-throw to trigger fallback
          }
          
          throw migrateError; // Re-throw to trigger fallback
        }
      } catch (deployError) {
        log.error('Failed to deploy migrations:', deployError.message);
        log.error('Error details:', deployError);
        
        // Try fallback: db push (for development/testing)
        if (process.env.NODE_ENV !== 'production') {
          log.warn('⚠️  Attempting fallback: db push (development mode)');
          try {
            execSync(`npx prisma db push --schema=${schemaPath} --accept-data-loss`, {
              stdio: 'inherit',
              env: { ...process.env },
              cwd: projectRoot,
              shell: true,
              timeout: 120000,
            });
            log.info('✅ Database schema pushed successfully (fallback)');
            return;
          } catch (pushError) {
            log.error('Fallback db push also failed:', pushError.message);
          }
        }
        
        log.warn('⚠️  Continuing without migrations. Database might not be fully synced.');
        log.warn('💡 To run migrations manually: railway run npm run db:migrate:deploy');
        return;
      }
    } else {
      log.info('No migrations found.');
      
      // In production, we should have migrations
      if (process.env.NODE_ENV === 'production') {
        log.warn('⚠️  No migrations found in production!');
        log.warn('💡 This might indicate a deployment issue.');
      } else {
        // In development, try db push as fallback
        log.info('Attempting db push (development mode)...');
        try {
          execSync(`npx prisma db push --schema=${schemaPath} --accept-data-loss`, {
            stdio: 'inherit',
            env: { ...process.env },
            cwd: projectRoot,
            shell: true,
            timeout: 120000,
          });
          log.info('✅ Database schema pushed successfully');
          return;
        } catch (pushError) {
          log.warn('db push failed:', pushError.message);
          log.warn('💡 To create schema: railway run npx prisma db push --schema=./DATABASE/prisma/schema.prisma');
        }
      }
    }
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

