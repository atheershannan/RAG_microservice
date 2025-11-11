import { jest } from '@jest/globals';

import { QueryProcessingService } from '../../../src/services/query-processing.service.js';

describe('QueryProcessingService', () => {
  const tenantId = 'tenant-123';
  const userId = 'user-999';
  const query = 'Explain microservices?';

  let openAIClient;
  let vectorRetrievalService;
  let knowledgeGraphService;
  let redisClient;
  let retryFn;
  let loggerMock;
  let service;

  beforeEach(() => {
    openAIClient = {
      embeddings: {
        create: jest.fn().mockResolvedValue({
          data: [{ embedding: [0.1, 0.2, 0.3] }],
        }),
      },
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: 'Microservices are distributed systems.',
                },
              },
            ],
          }),
        },
      },
    };

    vectorRetrievalService = {
      getSimilarContent: jest.fn().mockResolvedValue([
        {
          id: 'vec-1',
          contentId: 'doc-1',
          contentType: 'course',
          contentText: 'Course on microservices',
          metadata: { score: 0.9 },
        },
      ]),
    };

    knowledgeGraphService = {
      getContext: jest.fn().mockResolvedValue({
        relatedConcepts: ['distributed systems'],
      }),
    };

    redisClient = {
      get: jest.fn().mockResolvedValue(null),
      setex: jest.fn().mockResolvedValue('OK'),
    };

    retryFn = jest.fn(async (fn) => fn());

    loggerMock = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    service = new QueryProcessingService({
      openAIClient,
      vectorRetrievalService,
      knowledgeGraphService,
      redisClient,
      retryFn,
      logger: loggerMock,
      cacheTTLSeconds: 120,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('preprocessQuery', () => {
    it('trims and normalises whitespace', () => {
      expect(service.preprocessQuery('  Hello   World  ')).toBe('Hello World');
    });
  });

  describe('generateEmbedding', () => {
    it('calls OpenAI embeddings API', async () => {
      const embedding = await service.generateEmbedding('Test query');

      expect(openAIClient.embeddings.create).toHaveBeenCalledWith({
        input: 'Test query',
        model: 'text-embedding-3-large',
      });
      expect(embedding).toEqual([0.1, 0.2, 0.3]);
    });
  });

  describe('processQuery', () => {
    it('returns cached response when available', async () => {
      const cachedResponse = {
        answer: 'Cached answer',
        sources: [],
        metadata: { cache: true },
      };
      redisClient.get.mockResolvedValueOnce(JSON.stringify(cachedResponse));

      const result = await service.processQuery({
        tenantId,
        userId,
        query,
      });

      expect(result).toEqual({
        ...cachedResponse,
        metadata: {
          ...cachedResponse.metadata,
          cached: true,
        },
      });
      expect(openAIClient.embeddings.create).not.toHaveBeenCalled();
      expect(vectorRetrievalService.getSimilarContent).not.toHaveBeenCalled();
      expect(redisClient.setex).not.toHaveBeenCalled();
    });

    it('fetches context, calls OpenAI, formats, and caches result on cache miss', async () => {
      const result = await service.processQuery({
        tenantId,
        userId,
        query,
        userRoles: ['learner'],
        attributes: { department: 'Engineering' },
        topK: 2,
      });

      expect(openAIClient.embeddings.create).toHaveBeenCalled();
      expect(vectorRetrievalService.getSimilarContent).toHaveBeenCalledWith({
        tenantId,
        embedding: [0.1, 0.2, 0.3],
        topK: 2,
        userRoles: ['learner'],
        attributes: { department: 'Engineering' },
      });
      expect(knowledgeGraphService.getContext).toHaveBeenCalledWith({
        tenantId,
        query: 'Explain microservices?',
      });
      expect(openAIClient.chat.completions.create).toHaveBeenCalled();
      expect(redisClient.setex).toHaveBeenCalledWith(
        expect.stringContaining(`qp:${tenantId}`),
        120,
        JSON.stringify(result)
      );
      expect(result).toEqual({
        answer: 'Microservices are distributed systems.',
        sources: [
          expect.objectContaining({ id: 'vec-1' }),
        ],
        metadata: expect.objectContaining({
          cached: false,
          tenantId,
        }),
      });
    });

    it('falls back gracefully when knowledge graph is unavailable', async () => {
      const localService = new QueryProcessingService({
        openAIClient,
        vectorRetrievalService,
        knowledgeGraphService: null,
        redisClient,
        retryFn,
        logger: loggerMock,
      });

      await localService.processQuery({ tenantId, userId, query });

      expect(vectorRetrievalService.getSimilarContent).toHaveBeenCalled();
      expect(openAIClient.chat.completions.create).toHaveBeenCalled();
    });

    it('logs and rethrows errors from OpenAI chat', async () => {
      openAIClient.chat.completions.create.mockRejectedValueOnce(new Error('rate limited'));

      await expect(service.processQuery({ tenantId, userId, query })).rejects.toThrow('rate limited');

      expect(loggerMock.error).toHaveBeenCalledWith('Query processing failed', {
        tenantId,
        error: 'rate limited',
      });
      expect(redisClient.setex).not.toHaveBeenCalled();
    });
  });
});
