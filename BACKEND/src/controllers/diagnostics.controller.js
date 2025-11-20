/**
 * Diagnostics Controller
 * Provides diagnostic endpoints for debugging RAG system
 */

import { getPrismaClient } from '../config/database.config.js';
import { logger } from '../utils/logger.util.js';
import { Prisma } from '@prisma/client';
import { getOrCreateTenant } from '../services/tenant.service.js';

/**
 * GET /api/debug/embeddings-status
 * Check embeddings status in database
 */
export async function getEmbeddingsStatus(req, res, next) {
  try {
    const tenantDomain = req.query.tenant_id || 'default.local';
    const tenant = await getOrCreateTenant(tenantDomain);
    const tenantId = tenant.id;

    const prisma = await getPrismaClient();

    // Check if pgvector extension is enabled
    const extensionCheck = await prisma.$queryRaw(
      Prisma.sql`SELECT * FROM pg_extension WHERE extname = 'vector'`
    ).catch(() => []);

    // Check if HNSW index exists
    const indexCheck = await prisma.$queryRaw(
      Prisma.sql`
        SELECT 
          indexname, 
          indexdef 
        FROM pg_indexes 
        WHERE tablename = 'vector_embeddings' 
          AND indexdef LIKE '%hnsw%'
      `
    ).catch(() => []);

    // Get total count of embeddings
    const totalCount = await prisma.$queryRaw(
      Prisma.sql`SELECT COUNT(*)::int as count FROM vector_embeddings`
    ).catch(() => [{ count: 0 }]);

    // Get count by tenant
    const tenantCount = await prisma.$queryRaw(
      Prisma.sql`SELECT COUNT(*)::int as count FROM vector_embeddings WHERE tenant_id = ${tenantId}`
    ).catch(() => [{ count: 0 }]);

    // Get count by content type
    const contentTypeCount = await prisma.$queryRaw(
      Prisma.sql`
        SELECT 
          content_type, 
          COUNT(*)::int as count 
        FROM vector_embeddings 
        WHERE tenant_id = ${tenantId}
        GROUP BY content_type
        ORDER BY count DESC
      `
    ).catch(() => []);

    // Get sample embeddings to check dimensions
    const sampleEmbeddings = await prisma.$queryRaw(
      Prisma.sql`
        SELECT 
          content_id,
          content_type,
          (SELECT array_length(string_to_array(embedding::text, ','), 1)) as embedding_dimensions
        FROM vector_embeddings
        WHERE tenant_id = ${tenantId}
        LIMIT 5
      `
    ).catch(() => []);

    // Get all tenant IDs that have embeddings
    const allTenants = await prisma.$queryRaw(
      Prisma.sql`
        SELECT 
          t.id,
          t.domain,
          COUNT(ve.id)::int as embedding_count
        FROM tenants t
        LEFT JOIN vector_embeddings ve ON t.id = ve.tenant_id
        GROUP BY t.id, t.domain
        ORDER BY embedding_count DESC
      `
    ).catch(() => []);

    // Check for "Eden Levi" specifically
    const edenLeviCheck = await prisma.$queryRaw(
      Prisma.sql`
        SELECT 
          tenant_id,
          content_id,
          content_type,
          content_text,
          metadata->>'fullName' as name,
          metadata->>'role' as role
        FROM vector_embeddings
        WHERE content_id = ${'user:manager-001'}
        LIMIT 5
      `
    ).catch(() => []);

    const response = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      tenant: {
        domain: tenantDomain,
        id: tenantId,
      },
      pgvector: {
        extension_enabled: extensionCheck.length > 0,
        extension_info: extensionCheck[0] || null,
      },
      indexes: {
        hnsw_index_exists: indexCheck.length > 0,
        indexes: indexCheck,
      },
      embeddings: {
        total_in_database: totalCount[0]?.count || 0,
        total_for_tenant: tenantCount[0]?.count || 0,
        by_content_type: contentTypeCount,
        sample_embeddings: sampleEmbeddings,
      },
      tenants: {
        all_tenants_with_embeddings: allTenants,
      },
      eden_levi_check: {
        found: edenLeviCheck.length > 0,
        records: edenLeviCheck,
      },
      recommendations: {
        check_tenant_id: 'Make sure queries use the correct tenant_id. Current tenant: ' + tenantId,
        check_embeddings: tenantCount[0]?.count === 0 
          ? 'No embeddings found for this tenant. Run the embeddings script.' 
          : `${tenantCount[0]?.count} embeddings found for this tenant.`,
        check_threshold: 'Current default threshold is 0.5. Lower thresholds may return more results.',
      },
    };

    logger.info('Embeddings status checked', {
      tenantId,
      totalEmbeddings: totalCount[0]?.count || 0,
      tenantEmbeddings: tenantCount[0]?.count || 0,
    });

    res.json(response);
  } catch (error) {
    logger.error('Diagnostics error', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * GET /api/debug/test-vector-search
 * Test vector search with a sample query
 * 
 * NOTE: This endpoint does NOT apply RBAC filtering for debugging purposes.
 * It shows raw vector search results to help diagnose issues.
 * The production endpoint (/api/v1/query) applies RBAC filtering.
 */
export async function testVectorSearch(req, res, next) {
  try {
    const { query: testQuery, tenant_id, threshold = 0.3 } = req.query;
    
    if (!testQuery) {
      return res.status(400).json({
        error: 'Missing query parameter',
        message: 'Provide a query parameter to test vector search',
      });
    }

    const tenantDomain = tenant_id || 'default.local';
    const tenant = await getOrCreateTenant(tenantDomain);
    const tenantId = tenant.id;

    // Import OpenAI config
    const { openai } = await import('../config/openai.config.js');
    const { searchSimilarVectors } = await import('../services/vectorSearch.service.js');

    // Create embedding for test query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: testQuery,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Perform vector search
    // NOTE: This test endpoint does NOT apply RBAC filtering - it shows all results
    // Production endpoint applies RBAC to filter user_profile content based on user role
    const results = await searchSimilarVectors(queryEmbedding, tenantId, {
      limit: 10,
      threshold: parseFloat(threshold),
    });

    // Also try without threshold to see all similarities
    const allResults = await searchSimilarVectors(queryEmbedding, tenantId, {
      limit: 20,
      threshold: 0.0, // No threshold
    });

    const response = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      test_query: testQuery,
      tenant: {
        domain: tenantDomain,
        id: tenantId,
      },
      embedding: {
        dimensions: queryEmbedding.length,
        preview: queryEmbedding.slice(0, 5),
      },
      search_results: {
        with_threshold: {
          threshold: parseFloat(threshold),
          count: results.length,
          results: results.map(r => ({
            contentId: r.contentId,
            contentType: r.contentType,
            similarity: r.similarity,
            contentTextPreview: r.contentText.substring(0, 100),
          })),
        },
        without_threshold: {
          count: allResults.length,
          top_10: allResults.slice(0, 10).map(r => ({
            contentId: r.contentId,
            contentType: r.contentType,
            similarity: r.similarity,
            contentTextPreview: r.contentText.substring(0, 100),
          })),
        },
      },
    };

    logger.info('Vector search test completed', {
      testQuery,
      tenantId,
      resultsCount: results.length,
      allResultsCount: allResults.length,
    });

    res.json(response);
  } catch (error) {
    logger.error('Vector search test error', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

