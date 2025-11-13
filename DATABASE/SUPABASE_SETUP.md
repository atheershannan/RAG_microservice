# Supabase Setup Guide for Railway

## Prerequisites

1. **Supabase Project** - Create a new Supabase project
2. **Enable pgvector Extension** - Supabase supports pgvector, but it needs to be enabled

## Environment Variables in Railway

Make sure these are set in Railway:

### Required:
- `DATABASE_URL` - Connection string from Supabase
  - Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require`
  - Get it from: Supabase Dashboard → Settings → Database → Connection String → URI

### Optional:
- `NODE_ENV` - Set to `production` for production deployments
- `LOG_LEVEL` - Logging level (default: `info`)
- `OPENAI_API_KEY` - OpenAI API key for embeddings
- `REDIS_URL` - Redis connection (optional)
- `REDIS_ENABLED` - Set to `false` to disable Redis
- `FRONTEND_VERCEL_URL` - Frontend URL for CORS

## Enabling pgvector in Supabase

Supabase supports pgvector, but you need to enable it:

1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Run this SQL:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Or use the Supabase CLI:
```bash
supabase db execute "CREATE EXTENSION IF NOT EXISTS vector;"
```

## Verifying Connection

To test the connection, run in Railway:

```bash
railway run npx prisma db pull --schema=./DATABASE/prisma/schema.prisma
```

## Troubleshooting

### Migration Fails with "extension vector does not exist"
- **Solution**: Enable pgvector extension in Supabase SQL Editor first
- Run: `CREATE EXTENSION IF NOT EXISTS vector;`

### Connection Timeout
- **Solution**: Check DATABASE_URL format
- Make sure it includes `?sslmode=require` for Supabase
- Verify Supabase project is active

### Migration Hangs
- **Solution**: Increase timeout in `start-with-migrations.js`
- Or run migrations manually: `railway run npm run db:migrate:deploy`

### "relation already exists" errors
- **Solution**: Migrations might have partially run
- Check migration status: `railway run npx prisma migrate status --schema=./DATABASE/prisma/schema.prisma`
- Reset if needed (⚠️ DANGER: deletes data): `railway run npx prisma migrate reset --schema=./DATABASE/prisma/schema.prisma`

## Manual Migration Steps

If automatic migrations fail:

1. Connect to Supabase SQL Editor
2. Run the migration SQL manually:
   - Copy from `DATABASE/prisma/migrations/20250101000000_init/migration.sql`
   - Run in Supabase SQL Editor
   - Then run `DATABASE/prisma/migrations/20250101000001_add_pgvector/migration.sql`
3. Mark migrations as applied:
   ```bash
   railway run npx prisma migrate resolve --applied 20250101000000_init --schema=./DATABASE/prisma/schema.prisma
   railway run npx prisma migrate resolve --applied 20250101000001_add_pgvector --schema=./DATABASE/prisma/schema.prisma
   ```

## Connection String Format

For Supabase, the DATABASE_URL should look like:

```
postgresql://postgres.xxxxxxxxxxxxx:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
```

Or for direct connection (port 5432):
```
postgresql://postgres.xxxxxxxxxxxxx:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require
```

**Important**: 
- Use **pooler** connection for better performance
- Port **6543** for connection pooling
- Port **5432** for direct connection
- Always include `?sslmode=require` for Supabase

