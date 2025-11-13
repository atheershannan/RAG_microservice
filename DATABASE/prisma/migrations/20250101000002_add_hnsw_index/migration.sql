-- Create HNSW index for vector similarity search
-- This index is critical for fast vector similarity queries
-- Created in separate migration to avoid timeout during initial migration
-- Note: This can take a few minutes on large tables, but should be fast on empty table

-- Only create if table exists and index doesn't exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'vector_embeddings'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_vector_embeddings_embedding_hnsw'
  ) THEN
    CREATE INDEX idx_vector_embeddings_embedding_hnsw 
    ON vector_embeddings 
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
  END IF;
END $$;

