-- Enable pgvector extension
-- Note: In Supabase, this should be enabled via SQL Editor first
-- Run: CREATE EXTENSION IF NOT EXISTS vector;
-- This migration assumes pgvector is already enabled
-- If not enabled, this will fail gracefully and can be enabled manually
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'vector'
  ) THEN
    -- Try to create extension, but don't fail if it requires superuser
    BEGIN
      CREATE EXTENSION vector;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'pgvector extension could not be created. Please enable it manually in Supabase SQL Editor: CREATE EXTENSION IF NOT EXISTS vector;';
    END;
  END IF;
END $$;

-- Note: HNSW index creation is deferred to avoid timeout
-- Create it manually after migration or in a separate migration
-- CREATE INDEX IF NOT EXISTS idx_vector_embeddings_embedding_hnsw 
-- ON vector_embeddings 
-- USING hnsw (embedding vector_cosine_ops)
-- WITH (m = 16, ef_construction = 64);

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

-- Add database constraints (if not already added)
-- Queries table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_confidence_score'
  ) THEN
    ALTER TABLE queries ADD CONSTRAINT chk_confidence_score 
      CHECK (confidence_score >= 0 AND confidence_score <= 1);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_processing_time'
  ) THEN
    ALTER TABLE queries ADD CONSTRAINT chk_processing_time 
      CHECK (processing_time_ms >= 0);
  END IF;
END $$;

-- Vector embeddings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_chunk_index'
  ) THEN
    ALTER TABLE vector_embeddings ADD CONSTRAINT chk_chunk_index 
      CHECK (chunk_index >= 0);
  END IF;
END $$;

-- Knowledge graph edges table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_weight'
  ) THEN
    ALTER TABLE knowledge_graph_edges ADD CONSTRAINT chk_weight 
      CHECK (weight IS NULL OR (weight >= 0 AND weight <= 1));
  END IF;
END $$;

