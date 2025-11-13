-- Add Microservice Management Support
-- This migration adds support for tracking content from multiple microservices (9-10 services)

-- CreateTable: microservices
CREATE TABLE IF NOT EXISTS "microservices" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "api_endpoint" TEXT,
    "version" TEXT DEFAULT '1.0.0',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB DEFAULT '{}',
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "microservices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: microservices
CREATE UNIQUE INDEX IF NOT EXISTS "microservices_service_id_key" ON "microservices"("service_id");
CREATE UNIQUE INDEX IF NOT EXISTS "microservices_tenant_id_name_key" ON "microservices"("tenant_id", "name");
CREATE INDEX IF NOT EXISTS "microservices_tenant_id_idx" ON "microservices"("tenant_id");
CREATE INDEX IF NOT EXISTS "microservices_service_id_idx" ON "microservices"("service_id");
CREATE INDEX IF NOT EXISTS "microservices_name_idx" ON "microservices"("name");
CREATE INDEX IF NOT EXISTS "microservices_is_active_idx" ON "microservices"("is_active");

-- AddForeignKey: microservices -> tenants
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'microservices_tenant_id_fkey'
    ) THEN
        ALTER TABLE "microservices" 
        ADD CONSTRAINT "microservices_tenant_id_fkey" 
        FOREIGN KEY ("tenant_id") 
        REFERENCES "tenants"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
    END IF;
END $$;

-- AlterTable: vector_embeddings - Add microservice_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vector_embeddings' 
        AND column_name = 'microservice_id'
    ) THEN
        ALTER TABLE "vector_embeddings" 
        ADD COLUMN "microservice_id" TEXT;
    END IF;
END $$;

-- CreateIndex: vector_embeddings - microservice indexes
CREATE INDEX IF NOT EXISTS "vector_embeddings_microservice_id_idx" 
ON "vector_embeddings"("microservice_id");

CREATE INDEX IF NOT EXISTS "vector_embeddings_content_type_idx" 
ON "vector_embeddings"("content_type");

CREATE INDEX IF NOT EXISTS "vector_embeddings_tenant_id_microservice_id_idx" 
ON "vector_embeddings"("tenant_id", "microservice_id");

CREATE INDEX IF NOT EXISTS "vector_embeddings_tenant_id_content_type_microservice_id_idx" 
ON "vector_embeddings"("tenant_id", "content_type", "microservice_id");

-- AddForeignKey: vector_embeddings -> microservices
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'vector_embeddings_microservice_id_fkey'
    ) THEN
        ALTER TABLE "vector_embeddings" 
        ADD CONSTRAINT "vector_embeddings_microservice_id_fkey" 
        FOREIGN KEY ("microservice_id") 
        REFERENCES "microservices"("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
    END IF;
END $$;

-- AlterTable: query_sources - Add source_microservice
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'query_sources' 
        AND column_name = 'source_microservice'
    ) THEN
        ALTER TABLE "query_sources" 
        ADD COLUMN "source_microservice" TEXT;
    END IF;
END $$;

-- CreateIndex: query_sources - microservice indexes
CREATE INDEX IF NOT EXISTS "query_sources_source_microservice_idx" 
ON "query_sources"("source_microservice");

CREATE INDEX IF NOT EXISTS "query_sources_source_type_source_microservice_idx" 
ON "query_sources"("source_type", "source_microservice");

-- Add comments for documentation
COMMENT ON TABLE "microservices" IS 'Manages microservices that provide content to the RAG system (9-10 services)';
COMMENT ON COLUMN "microservices"."service_id" IS 'Unique identifier across all tenants (e.g., "assessment", "devlab", "content")';
COMMENT ON COLUMN "vector_embeddings"."microservice_id" IS 'Which microservice this content came from';
COMMENT ON COLUMN "query_sources"."source_microservice" IS 'Which microservice provided this source';

