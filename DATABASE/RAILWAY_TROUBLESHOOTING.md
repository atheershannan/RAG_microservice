# Railway + Supabase Troubleshooting Guide

## Common Issues and Solutions

### 1. Migration Hangs at "Deploying migrations..."

**Symptoms:**
- Logs show "Deploying migrations..." but nothing happens
- No error message, just hangs

**Possible Causes:**
1. **pgvector extension not enabled** - Most common issue
2. **Connection timeout** - Supabase connection issues
3. **Migration SQL error** - Syntax error in migration

**Solutions:**

#### Solution A: Enable pgvector in Supabase First
1. Go to Supabase Dashboard → SQL Editor
2. Run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Verify:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'vector';
   ```
4. Redeploy on Railway

#### Solution B: Check DATABASE_URL
1. Verify DATABASE_URL format:
   ```
   postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
   ```
2. Make sure it includes `?sslmode=require`
3. Try direct connection (port 5432) if pooler fails

#### Solution C: Run Migrations Manually
1. Connect to Supabase SQL Editor
2. Copy and run migration SQL manually:
   - `DATABASE/prisma/migrations/20250101000000_init/migration.sql`
   - `DATABASE/prisma/migrations/20250101000001_add_pgvector/migration.sql`
3. Mark as applied:
   ```bash
   railway run npx prisma migrate resolve --applied 20250101000000_init --schema=./DATABASE/prisma/schema.prisma
   railway run npx prisma migrate resolve --applied 20250101000001_add_pgvector --schema=./DATABASE/prisma/schema.prisma
   ```

### 2. "extension vector does not exist" Error

**Solution:**
Enable pgvector in Supabase SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3. Connection Timeout

**Symptoms:**
- Error: `ECONNREFUSED` or `timeout`

**Solutions:**
1. Check DATABASE_URL is correct
2. Verify Supabase project is active
3. Try direct connection (port 5432) instead of pooler (6543)
4. Check Supabase dashboard for service status

### 4. "relation already exists" Errors

**Symptoms:**
- Migration fails saying table already exists

**Solution:**
Migrations partially ran. Check status:
```bash
railway run npx prisma migrate status --schema=./DATABASE/prisma/schema.prisma
```

If needed, mark migrations as applied:
```bash
railway run npx prisma migrate resolve --applied 20250101000000_init --schema=./DATABASE/prisma/schema.prisma
railway run npx prisma migrate resolve --applied 20250101000001_add_pgvector --schema=./DATABASE/prisma/schema.prisma
```

### 5. HNSW Index Creation Fails

**Symptoms:**
- Error creating HNSW index on vector_embeddings

**Solution:**
1. Make sure pgvector extension is enabled
2. Check if table exists: `SELECT * FROM vector_embeddings LIMIT 1;`
3. If table doesn't exist, run init migration first
4. Try creating index manually in Supabase SQL Editor:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_vector_embeddings_embedding_hnsw 
   ON vector_embeddings 
   USING hnsw (embedding vector_cosine_ops)
   WITH (m = 16, ef_construction = 64);
   ```

## Quick Diagnostic Commands

### Check Migration Status
```bash
railway run npx prisma migrate status --schema=./DATABASE/prisma/schema.prisma
```

### Test Database Connection
```bash
railway run npx prisma db pull --schema=./DATABASE/prisma/schema.prisma
```

### Check if pgvector is enabled
```bash
railway run npx prisma db execute --schema=./DATABASE/prisma/schema.prisma --stdin <<< "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

### View Current Tables
```bash
railway run npx prisma studio --schema=./DATABASE/prisma/schema.prisma
```

## Step-by-Step Setup for New Supabase Project

1. **Create Supabase Project**
   - Go to supabase.com
   - Create new project
   - Wait for provisioning

2. **Enable pgvector Extension**
   - Go to SQL Editor
   - Run: `CREATE EXTENSION IF NOT EXISTS vector;`
   - Verify: `SELECT * FROM pg_extension WHERE extname = 'vector';`

3. **Get Connection String**
   - Go to Settings → Database
   - Copy "Connection string" → "URI"
   - Format: `postgresql://postgres.[REF]:[PASSWORD]@[HOST]:6543/postgres?sslmode=require`

4. **Set in Railway**
   - Go to Railway project
   - Add environment variable: `DATABASE_URL`
   - Paste connection string

5. **Deploy**
   - Railway will auto-run migrations
   - Check logs for success

## Environment Variables Checklist

Make sure these are set in Railway:

- ✅ `DATABASE_URL` - Supabase connection string (REQUIRED)
- ✅ `NODE_ENV` - Set to `production`
- ⚠️ `OPENAI_API_KEY` - For embeddings (optional but recommended)
- ⚠️ `REDIS_URL` - For caching (optional)
- ⚠️ `FRONTEND_VERCEL_URL` - For CORS (if frontend deployed)

## Still Having Issues?

1. Check Railway logs for full error messages
2. Check Supabase logs in dashboard
3. Try running migrations manually in Supabase SQL Editor
4. Verify DATABASE_URL format is correct
5. Make sure pgvector extension is enabled

