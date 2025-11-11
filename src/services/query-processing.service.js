import { createHash } from 'crypto';

import { logger as defaultLogger } from '../utils/logger.util.js';
import { retry as defaultRetry } from '../utils/retry.util.js';

let defaultOpenAIClientPromise = null;
let defaultVectorRetrievalPromise = null;
let defaultKnowledgeGraphPromise = null;
let defaultRedisPromise = null;

async function resolveDefaultOpenAI() {
  if (!defaultOpenAIClientPromise) {
    const module = await import('../config/openai.config.js');
    defaultOpenAIClientPromise = Promise.resolve(module.openai);
  }

  return defaultOpenAIClientPromise;
}

async function resolveDefaultVectorRetrieval() {
  if (!defaultVectorRetrievalPromise) {
    const module = await import('./vector-retrieval.service.js');
    defaultVectorRetrievalPromise = Promise.resolve(module.vectorRetrievalService);
  }

  return defaultVectorRetrievalPromise;
}

async function resolveDefaultKnowledgeGraph() {
  if (!defaultKnowledgeGraphPromise) {
    try {
      const module = await import('./knowledge-graph-manager.service.js');
      defaultKnowledgeGraphPromise = Promise.resolve(module.knowledgeGraphManagerService);
    } catch (error) {
      defaultKnowledgeGraphPromise = Promise.resolve(null);
    }
  }

  return defaultKnowledgeGraphPromise;
}

async function resolveDefaultRedis() {
  if (!defaultRedisPromise) {
    const module = await import('../config/redis.config.js');
    defaultRedisPromise = Promise.resolve(module.redis);
  }

  return defaultRedisPromise;
}

class QueryProcessingService {
  constructor({
    openAIClient = null,
    vectorRetrievalService = null,
    knowledgeGraphService = null,
    redisClient = null,
    retryFn = defaultRetry,
    logger = defaultLogger,
    cacheTTLSeconds = 300,
  } = {}) {
    this.openAIProvider = openAIClient
      ? () => Promise.resolve(openAIClient)
      : () => resolveDefaultOpenAI();
    this.vectorRetrievalProvider = vectorRetrievalService
      ? () => Promise.resolve(vectorRetrievalService)
      : () => resolveDefaultVectorRetrieval();
    this.knowledgeGraphProvider = knowledgeGraphService
      ? () => Promise.resolve(knowledgeGraphService)
      : () => resolveDefaultKnowledgeGraph();
    this.redisProvider = redisClient
      ? () => Promise.resolve(redisClient)
      : () => resolveDefaultRedis();

    this.logger = logger;
    this.retryFn = retryFn;
    this.cacheTTLSeconds = cacheTTLSeconds;
  }

  preprocessQuery(query) {
    if (typeof query !== 'string') {
      return '';
    }

    return query.trim().replace(/\s+/g, ' ');
  }

  createCacheKey({ tenantId, query, userId = null, sessionId = null }) {
    const hash = createHash('sha256')
      .update(JSON.stringify({ tenantId, query, userId, sessionId }))
      .digest('hex');

    return `qp:${tenantId}:${hash}`;
  }

  async getCachedResponse(cacheKey) {
    try {
      const redis = await this.redisProvider();
      if (!redis || typeof redis.get !== 'function') {
        return null;
      }

      const cached = await redis.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      this.logger.warn('Query cache read failed', {
        cacheKey,
        error: error.message,
      });
      return null;
    }
  }

  async cacheResponse(cacheKey, payload) {
    try {
      const redis = await this.redisProvider();
      if (!redis || typeof redis.setex !== 'function') {
        return false;
      }

      await redis.setex(cacheKey, this.cacheTTLSeconds, JSON.stringify(payload));
      return true;
    } catch (error) {
      this.logger.warn('Query cache write failed', {
        cacheKey,
        error: error.message,
      });
      return false;
    }
  }

  async generateEmbedding(queryText) {
    const openAI = await this.openAIProvider();

    const response = await openAI.embeddings.create({
      model: 'text-embedding-3-large',
      input: queryText,
    });

    return response?.data?.[0]?.embedding ?? [];
  }

  buildPrompt({ queryText, vectorContext = [], knowledgeContext = null }) {
    const sourcesSection = vectorContext
      .map((item, index) => `${index + 1}. (${item.contentType}) ${item.contentText}`)
      .join('\n');

    const knowledgeSection = knowledgeContext?.relatedConcepts?.length
      ? `\nRelated Concepts: ${knowledgeContext.relatedConcepts.join(', ')}`
      : '';

    return `Answer the user query using the provided context.\n\nQuery: ${queryText}\n\nContext:\n${sourcesSection}${knowledgeSection}`;
  }

  formatResponse({ answer, sources, metadata }) {
    return {
      answer,
      sources,
      metadata,
    };
  }

  async generateAnswer({ prompt, temperature = 0.2, maxTokens = 800 }) {
    const openAI = await this.openAIProvider();

    const completion = await openAI.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: 'You are Educore Query Assistant. Be concise and cite sources when possible.' },
        { role: 'user', content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
    });

    return completion?.choices?.[0]?.message?.content ?? '';
  }

  async getKnowledgeContext({ tenantId, queryText }) {
    try {
      const knowledgeGraph = await this.knowledgeGraphProvider();
      if (!knowledgeGraph || typeof knowledgeGraph.getContext !== 'function') {
        return null;
      }

      return knowledgeGraph.getContext({ tenantId, query: queryText });
    } catch (error) {
      this.logger.warn('Knowledge graph context unavailable', {
        tenantId,
        error: error.message,
      });
      return null;
    }
  }

  async processQuery({
    tenantId,
    userId = null,
    sessionId = null,
    query,
    userRoles = [],
    attributes = {},
    topK = 5,
    useCache = true,
  }) {
    if (!tenantId) {
      throw new Error('tenantId is required');
    }

    const processedQuery = this.preprocessQuery(query);
    if (!processedQuery) {
      throw new Error('query is required');
    }

    const cacheKey = this.createCacheKey({ tenantId, query: processedQuery, userId, sessionId });

    if (useCache) {
      const cached = await this.getCachedResponse(cacheKey);
      if (cached) {
        return {
          ...cached,
          metadata: {
            ...cached.metadata,
            cached: true,
          },
        };
      }
    }

    try {
      const [embedding, vectorRetrievalService, knowledgeContext] = await Promise.all([
        this.generateEmbedding(processedQuery),
        this.vectorRetrievalProvider(),
        this.getKnowledgeContext({ tenantId, queryText: processedQuery }),
      ]);

      const similarContent = vectorRetrievalService
        ? await vectorRetrievalService.getSimilarContent({
            tenantId,
            embedding,
            topK,
            userRoles,
            attributes,
          })
        : [];

      const prompt = this.buildPrompt({
        queryText: processedQuery,
        vectorContext: similarContent,
        knowledgeContext,
      });

      const answer = await this.retryFn(() => this.generateAnswer({ prompt }));

      const response = this.formatResponse({
        answer,
        sources: similarContent,
        metadata: {
          tenantId,
          userId,
          sessionId,
          cached: false,
          topK,
          sourcesCount: similarContent.length,
        },
      });

      if (useCache) {
        await this.cacheResponse(cacheKey, response);
      }

      return response;
    } catch (error) {
      this.logger.error('Query processing failed', {
        tenantId,
        error: error.message,
      });
      throw error;
    }
  }
}

const queryProcessingService = new QueryProcessingService();

export { QueryProcessingService, queryProcessingService };
