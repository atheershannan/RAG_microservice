/**
 * Unified Vector Search Service
 * Single source of truth for vector similarity search
 * Used by both test endpoint and production endpoint
 */

import { getPrismaClient } from '../config/database.config.js';
import { logger } from '../utils/logger.util.js';
import { Prisma } from '@prisma/client';

/**
 * Unified vector search function
 * This is the ONLY function that should perform vector searches
 * 
 * @param {number[]} queryEmbedding - Query embedding vector (1536 dimensions)
 * @param {string} tenantId - Tenant identifier (UUID)
 * @param {Object} options - Search options
 * @param {number} options.limit - Maximum number of results (default: 20)
 * @param {number} options.threshold - Minimum similarity threshold (default: 0.25)
 * @param {string} options.contentType - Filter by content type (optional)
 * @param {string} options.contentId - Filter by content ID (optional)
 * @param {string} options.microserviceId - Filter by microservice ID (optional)
 * @returns {Promise<Array>} Array of similar vector embeddings with similarity scores
 */
export async function unifiedVectorSearch(
  queryEmbedding,
  tenantId,
  options = {}
) {
  const { 
    limit = 20, 
    threshold = 0.25, 
    contentType, 
    contentId,
    microserviceId
  } = options;

  try {
    const prisma = await getPrismaClient();


    // Build query using same approach as working vectorSearch.service.js
    // Convert embedding array to PostgreSQL vector format
    const embeddingStr = `[${queryEmbedding.join(',')}]`;
    const escapedEmbeddingStr = embeddingStr.replace(/'/g, "''");
    const vectorLiteral = `'${escapedEmbeddingStr}'::vector`;
    
    // Build WHERE clause with proper SQL parameterization for $queryRawUnsafe
    // NOTE: $queryRawUnsafe uses string interpolation, so we need to escape values properly
    const escapedTenantId = tenantId.replace(/'/g, "''");
    let whereClause = `tenant_id = '${escapedTenantId}'::uuid`;

    if (contentType) {
      const escapedContentType = String(contentType).replace(/'/g, "''");
      whereClause += ` AND content_type = '${escapedContentType}'`;
    }

    if (contentId) {
      const escapedContentId = String(contentId).replace(/'/g, "''");
      whereClause += ` AND content_id = '${escapedContentId}'`;
    }

    if (microserviceId) {
      const escapedMicroserviceId = String(microserviceId).replace(/'/g, "''");
      whereClause += ` AND microservice_id = '${escapedMicroserviceId}'`;
    }

    // Build the complete query - EXACT same structure as vectorSearch.service.js
    const query = `
      SELECT 
        id,
        tenant_id,
        microservice_id,
        content_id,
        content_type,
        content_text,
        chunk_index,
        metadata,
        created_at,
        1 - (embedding <=> ${vectorLiteral}) as similarity
      FROM vector_embeddings
      WHERE ${whereClause}
        AND (1 - (embedding <=> ${vectorLiteral})) >= ${threshold}
      ORDER BY embedding <=> ${vectorLiteral}
      LIMIT ${limit}
    `;

    // Execute query - $queryRawUnsafe uses string interpolation, not parameterized queries
    logger.debug('Executing vector search query', {
      tenantId,
      threshold,
      limit,
      contentType,
      contentId,
      microserviceId,
      queryPreview: query.substring(0, 200),
    });
    
    const results = await prisma.$queryRawUnsafe(query);

    logger.debug('Vector search query executed', {
      tenantId,
      resultsCount: results?.length || 0,
      threshold,
    });

    // Map results to consistent format
    return results.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      microserviceId: row.microservice_id,
      contentId: row.content_id,
      contentType: row.content_type,
      contentText: row.content_text,
      chunkIndex: row.chunk_index,
      metadata: row.metadata || {},
      similarity: parseFloat(row.similarity),
      createdAt: row.created_at,
    }));
  } catch (error) {
    logger.error('Unified vector search error', {
      error: error.message,
      tenantId,
      stack: error.stack,
    });
    
    
    throw new Error(`Unified vector search failed: ${error.message}`);
  }
}

/**
 * Search without threshold (for diagnostics)
 * Returns top N results regardless of similarity
 */
export async function unifiedVectorSearchWithoutThreshold(
  queryEmbedding,
  tenantId,
  limit = 20
) {
  return unifiedVectorSearch(queryEmbedding, tenantId, {
    threshold: 0.0,
    limit: limit,
  });
}

