/**
 * Verify Supabase Connection Script
 * 
 * This script helps verify that DATABASE_URL is correctly configured
 * and that the connection to Supabase works.
 * 
 * Usage:
 *   node DATABASE/VERIFY_SUPABASE_CONNECTION.js
 * 
 * Or from Railway:
 *   railway run node DATABASE/VERIFY_SUPABASE_CONNECTION.js
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const backendRoot = join(projectRoot, 'BACKEND');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function checkDatabaseUrl() {
  logSection('1. Checking DATABASE_URL');
  
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    log('❌ DATABASE_URL is not set!', 'red');
    log('💡 Set DATABASE_URL in Railway environment variables', 'yellow');
    return false;
  }
  
  log('✅ DATABASE_URL is set', 'green');
  
  // Check if it's a Supabase URL
  const isSupabase = dbUrl.includes('supabase.com') || dbUrl.includes('supabase.co');
  if (isSupabase) {
    log('✅ Detected Supabase database URL', 'green');
  }
  
  // Check for sslmode
  if (!dbUrl.includes('sslmode=')) {
    log('⚠️  DATABASE_URL is missing sslmode parameter!', 'yellow');
    log('💡 Supabase REQUIRES: ?sslmode=require at the end', 'yellow');
    log('💡 Current URL (first 100 chars):', 'yellow');
    console.log('   ' + dbUrl.substring(0, 100) + '...');
    return false;
  } else {
    log('✅ DATABASE_URL includes sslmode parameter', 'green');
  }
  
  // Check connection type
  if (dbUrl.includes(':6543')) {
    log('✅ Using Supabase connection pooler (port 6543) - RECOMMENDED', 'green');
  } else if (dbUrl.includes(':5432')) {
    log('⚠️  Using Supabase direct connection (port 5432)', 'yellow');
    log('💡 Direct connections may require IP allowlist', 'yellow');
    log('💡 Consider using pooler URL (port 6543) instead', 'yellow');
  }
  
  // Check for pooler vs direct
  if (dbUrl.includes('pooler.supabase.com')) {
    log('✅ Using pooler URL (recommended for Railway)', 'green');
  } else if (dbUrl.includes('db.') && dbUrl.includes('.supabase.co')) {
    log('⚠️  Using direct connection URL', 'yellow');
    log('💡 This may not be accessible from Railway', 'yellow');
    log('💡 Try using pooler URL: ...pooler.supabase.com:6543/...', 'yellow');
  }
  
  return true;
}

async function testConnection() {
  logSection('2. Testing Database Connection');
  
  try {
    // Import Prisma Client directly
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
    
    log('Attempting to connect...', 'blue');
    
    // Try a simple query
    await prisma.$connect();
    log('✅ Successfully connected to database!', 'green');
    
    // Test query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    log('✅ Database query test successful', 'green');
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    log('❌ Connection failed!', 'red');
    log(`Error: ${error.message}`, 'red');
    
    if (error.message.includes('Can\'t reach database server')) {
      log('\n💡 Possible solutions:', 'yellow');
      log('   1. Check if DATABASE_URL uses pooler URL (port 6543)', 'yellow');
      log('   2. Verify Supabase project is active', 'yellow');
      log('   3. Check if IP allowlist is blocking Railway', 'yellow');
      log('   4. Try using Session Mode Pooler URL', 'yellow');
    } else if (error.message.includes('authentication')) {
      log('\n💡 Possible solutions:', 'yellow');
      log('   1. Check if password in DATABASE_URL is correct', 'yellow');
      log('   2. Get fresh connection string from Supabase Dashboard', 'yellow');
    } else if (error.message.includes('SSL')) {
      log('\n💡 Possible solutions:', 'yellow');
      log('   1. Add ?sslmode=require to DATABASE_URL', 'yellow');
    }
    
    return false;
  }
}

async function checkPgVectorExtension() {
  logSection('3. Checking pgvector Extension');
  
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
    
    await prisma.$connect();
    
    // Check if vector extension exists
    const result = await prisma.$queryRaw`
      SELECT * FROM pg_extension WHERE extname = 'vector'
    `;
    
    if (result && result.length > 0) {
      log('✅ pgvector extension is enabled', 'green');
      await prisma.$disconnect();
      return true;
    } else {
      log('❌ pgvector extension is NOT enabled', 'red');
      log('💡 Run this in Supabase SQL Editor:', 'yellow');
      log('   CREATE EXTENSION IF NOT EXISTS vector;', 'yellow');
      await prisma.$disconnect();
      return false;
    }
  } catch (error) {
    log('⚠️  Could not check pgvector extension', 'yellow');
    log(`   Error: ${error.message}`, 'yellow');
    return false;
  }
}

async function checkMigrations() {
  logSection('4. Checking Migration Status');
  
  try {
    const { execSync } = await import('child_process');
    const schemaPath = join(projectRoot, 'DATABASE', 'prisma', 'schema.prisma');
    
    log('Checking migration status...', 'blue');
    
    const output = execSync(
      `npx prisma migrate status --schema=${schemaPath}`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    
    console.log(output);
    
    if (output.includes('Database schema is up to date')) {
      log('✅ Migrations are up to date', 'green');
      return true;
    } else if (output.includes('following migration')) {
      log('⚠️  There are pending migrations', 'yellow');
      log('💡 Run: railway run cd BACKEND && npm run db:migrate:deploy', 'yellow');
      return false;
    } else {
      log('⚠️  Migration status unclear', 'yellow');
      return false;
    }
  } catch (error) {
    log('⚠️  Could not check migration status', 'yellow');
    log(`   Error: ${error.message}`, 'yellow');
    return false;
  }
}

async function checkTables() {
  logSection('5. Checking Database Tables');
  
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
    
    await prisma.$connect();
    
    // Check for key tables
    const tables = [
      'tenants',
      'queries',
      'vector_embeddings',
      'microservices',
    ];
    
    let allTablesExist = true;
    
    for (const table of tables) {
      try {
        const result = await prisma.$queryRawUnsafe(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )`,
          table
        );
        
        const exists = result[0]?.exists;
        if (exists) {
          log(`✅ Table '${table}' exists`, 'green');
        } else {
          log(`❌ Table '${table}' does NOT exist`, 'red');
          allTablesExist = false;
        }
      } catch (err) {
        log(`⚠️  Could not check table '${table}'`, 'yellow');
        allTablesExist = false;
      }
    }
    
    await prisma.$disconnect();
    return allTablesExist;
  } catch (error) {
    log('❌ Could not check tables', 'red');
    log(`   Error: ${error.message}`, 'red');
    return false;
  }
}

async function checkHNSWIndex() {
  logSection('6. Checking HNSW Index');
  
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
    
    await prisma.$connect();
    
    // Check if HNSW index exists
    const result = await prisma.$queryRaw`
      SELECT 
        indexname, 
        indexdef 
      FROM pg_indexes 
      WHERE tablename = 'vector_embeddings' 
        AND indexdef LIKE '%hnsw%'
    `;
    
    if (result && result.length > 0) {
      log('✅ HNSW index exists', 'green');
      log(`   Index name: ${result[0].indexname}`, 'blue');
      await prisma.$disconnect();
      return true;
    } else {
      log('❌ HNSW index does NOT exist', 'red');
      log('💡 This is critical for vector search performance!', 'yellow');
      log('💡 Run: CREATE INDEX idx_vector_embeddings_embedding_hnsw ON vector_embeddings USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);', 'yellow');
      log('💡 Or see: DATABASE/HNSW_INDEX_SETUP.md', 'yellow');
      await prisma.$disconnect();
      return false;
    }
  } catch (error) {
    // If table doesn't exist yet, that's okay
    if (error.message && error.message.includes('does not exist')) {
      log('⚠️  vector_embeddings table does not exist yet', 'yellow');
      log('💡 HNSW index will be created after migrations run', 'yellow');
      return true; // Not a failure - table just doesn't exist yet
    }
    
    log('⚠️  Could not check HNSW index', 'yellow');
    log(`   Error: ${error.message}`, 'yellow');
    return false;
  }
}

async function main() {
  console.log('\n');
  log('🔍 Supabase Connection Verification', 'cyan');
  log('====================================\n', 'cyan');
  
  const results = {
    databaseUrl: false,
    connection: false,
    pgvector: false,
    migrations: false,
    tables: false,
    hnsw: false,
  };
  
  // Step 1: Check DATABASE_URL
  results.databaseUrl = await checkDatabaseUrl();
  
  if (!results.databaseUrl) {
    log('\n❌ DATABASE_URL check failed. Please fix it first.', 'red');
    process.exit(1);
  }
  
  // Step 2: Test connection
  results.connection = await testConnection();
  
  if (!results.connection) {
    log('\n❌ Connection test failed. Please fix DATABASE_URL.', 'red');
    process.exit(1);
  }
  
  // Step 3: Check pgvector
  results.pgvector = await checkPgVectorExtension();
  
  // Step 4: Check migrations
  results.migrations = await checkMigrations();
  
  // Step 5: Check tables
  results.tables = await checkTables();
  
  // Step 6: Check HNSW index (only if tables exist)
  if (results.tables) {
    results.hnsw = await checkHNSWIndex();
  } else {
    log('\n⚠️  Skipping HNSW check (tables do not exist yet)', 'yellow');
    results.hnsw = true; // Not a failure if tables don't exist
  }
  
  // Summary
  logSection('Summary');
  
  const allPassed = Object.values(results).every(r => r);
  
  console.log('Results:');
  console.log(`  DATABASE_URL:     ${results.databaseUrl ? '✅' : '❌'}`);
  console.log(`  Connection:       ${results.connection ? '✅' : '❌'}`);
  console.log(`  pgvector:         ${results.pgvector ? '✅' : '❌'}`);
  console.log(`  Migrations:       ${results.migrations ? '✅' : '❌'}`);
  console.log(`  Tables:           ${results.tables ? '✅' : '❌'}`);
  console.log(`  HNSW Index:       ${results.hnsw ? '✅' : '❌'}`);
  
  if (allPassed) {
    log('\n✅ All checks passed! Your database is ready.', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some checks failed. Please review the issues above.', 'yellow');
    process.exit(1);
  }
}

main().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

