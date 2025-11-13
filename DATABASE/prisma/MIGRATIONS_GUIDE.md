# Database Migrations Guide

## Overview

This guide explains how to create and manage database migrations for the RAG microservice.

## Prisma Schema Location

The Prisma schema is located at: `DATABASE/prisma/schema.prisma`

## Initial Setup

### 1. Generate Prisma Client

```bash
# From project root
npm run db:generate

# Or from DATABASE/ directory
npx prisma generate --schema=prisma/schema.prisma
```

### 2. Create Initial Migration

```bash
# From project root
npm run db:migrate

# Or manually
npx prisma migrate dev --name init --schema=./DATABASE/prisma/schema.prisma
```

This will:
- Create the `DATABASE/prisma/migrations/` directory
- Generate the initial migration SQL
- Apply the migration to your database

## pgvector Setup

### Enable pgvector Extension

After the initial migration, you need to enable the pgvector extension and create the HNSW index manually.

#### Option 1: Using Prisma Migrate (Recommended)

Create a new migration file manually:

1. Create migration directory:
```bash
mkdir -p DATABASE/prisma/migrations/$(date +%Y%m%d%H%M%S)_add_pgvector_extension
```

2. Create `migration.sql` in that directory:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create HNSW index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_vector_embeddings_embedding_hnsw 
ON vector_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Create GIN indexes for JSONB columns (for better query performance)
CREATE INDEX IF NOT EXISTS idx_kg_nodes_properties_gin 
ON knowledge_graph_nodes 
USING gin (properties);

CREATE INDEX IF NOT EXISTS idx_user_profiles_skill_gaps_gin 
ON user_profiles 
USING gin (skill_gaps);

CREATE INDEX IF NOT EXISTS idx_user_profiles_preferences_gin 
ON user_profiles 
USING gin (preferences);
```

3. Mark migration as applied:
```bash
npx prisma migrate resolve --applied $(date +%Y%m%d%H%M%S)_add_pgvector_extension --schema=./DATABASE/prisma/schema.prisma
```

#### Option 2: Using Raw SQL

Connect to your database and run:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create HNSW index
CREATE INDEX IF NOT EXISTS idx_vector_embeddings_embedding_hnsw 
ON vector_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

## Migration Workflow

### Development

```bash
# Create a new migration
npm run db:migrate

# Or with custom name
npx prisma migrate dev --name description --schema=./DATABASE/prisma/schema.prisma
```

### Production

```bash
# Deploy migrations (does not create new migrations)
npm run db:migrate:deploy
```

### Check Migration Status

```bash
npx prisma migrate status --schema=./DATABASE/prisma/schema.prisma
```

## Database Constraints

The following constraints should be added via SQL (not in Prisma schema):

```sql
-- Queries table
ALTER TABLE queries ADD CONSTRAINT IF NOT EXISTS chk_confidence_score 
  CHECK (confidence_score >= 0 AND confidence_score <= 1);

ALTER TABLE queries ADD CONSTRAINT IF NOT EXISTS chk_processing_time 
  CHECK (processing_time_ms >= 0);

-- Vector embeddings table
ALTER TABLE vector_embeddings ADD CONSTRAINT IF NOT EXISTS chk_chunk_index 
  CHECK (chunk_index >= 0);

-- Knowledge graph edges table
ALTER TABLE knowledge_graph_edges ADD CONSTRAINT IF NOT EXISTS chk_weight 
  CHECK (weight IS NULL OR (weight >= 0 AND weight <= 1));
```

Add these constraints manually or create a migration for them.

## Seed Database

After migrations are applied:

```bash
# From project root
npm run db:seed

# Or manually
node DATABASE/prisma/seed.js
```

## Troubleshooting

### Migration Conflicts

If you have migration conflicts:

```bash
# Reset migrations (⚠️ DANGER: Deletes all data in development)
npx prisma migrate reset --schema=./DATABASE/prisma/schema.prisma

# Or resolve manually
npx prisma migrate resolve --applied migration_name --schema=./DATABASE/prisma/schema.prisma
```

### Vector Type Issues

If you get errors about the `vector` type:
1. Make sure pgvector extension is installed in PostgreSQL
2. Enable the extension: `CREATE EXTENSION IF NOT EXISTS vector;`
3. The `Unsupported("vector(1536)")` in Prisma schema is intentional

### Connection Issues

Make sure `DATABASE_URL` is set in your `.env` file:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/rag_db
```

## Next Steps

1. ✅ Run initial migration
2. ✅ Enable pgvector extension
3. ✅ Create HNSW index
4. ✅ Add database constraints
5. ✅ Seed database
6. ✅ Verify all tables are created

