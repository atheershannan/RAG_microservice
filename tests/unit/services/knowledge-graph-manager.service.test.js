import { jest } from '@jest/globals';

import { KnowledgeGraphManagerService } from '../../../src/services/knowledge-graph-manager.service.js';

describe('KnowledgeGraphManagerService', () => {
  const tenantId = 'tenant-123';

  let prismaMock;
  let kafkaProducerMock;
  let loggerMock;
  let service;

  beforeEach(() => {
    prismaMock = {
      knowledgeGraphNode: {
        upsert: jest.fn(),
        findMany: jest.fn(),
      },
      knowledgeGraphEdge: {
        upsert: jest.fn(),
        findMany: jest.fn(),
      },
    };

    kafkaProducerMock = {
      send: jest.fn(),
    };

    loggerMock = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    service = new KnowledgeGraphManagerService({
      prismaClient: prismaMock,
      kafkaProducer: kafkaProducerMock,
      logger: loggerMock,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateGraph', () => {
    it('upserts nodes and edges', async () => {
      await service.updateGraph({
        tenantId,
        nodes: [
          {
            nodeId: 'concept-1',
            nodeType: 'concept',
            properties: { title: 'REST' },
          },
        ],
        edges: [
          {
            edgeId: 'edge-1',
            sourceNodeId: 'concept-1',
            targetNodeId: 'concept-2',
            edgeType: 'related_to',
            weight: 0.8,
          },
        ],
      });

      expect(prismaMock.knowledgeGraphNode.upsert).toHaveBeenCalledWith({
        where: { nodeId: 'concept-1' },
        create: {
          tenantId,
          nodeId: 'concept-1',
          nodeType: 'concept',
          properties: { title: 'REST' },
        },
        update: {
          nodeType: 'concept',
          properties: { title: 'REST' },
        },
      });

      expect(prismaMock.knowledgeGraphEdge.upsert).toHaveBeenCalledWith({
        where: { id: 'edge-1' },
        create: {
          tenantId,
          id: 'edge-1',
          sourceNodeId: 'concept-1',
          targetNodeId: 'concept-2',
          edgeType: 'related_to',
          weight: 0.8,
          properties: {},
        },
        update: {
          edgeType: 'related_to',
          weight: 0.8,
          properties: {},
        },
      });
    });

    it('logs error when prisma upsert fails', async () => {
      prismaMock.knowledgeGraphNode.upsert.mockRejectedValueOnce(new Error('db error'));

      await expect(
        service.updateGraph({ tenantId, nodes: [{ nodeId: 'n1' }], edges: [] })
      ).rejects.toThrow('GRAPH_UPDATE_FAILED');

      expect(loggerMock.error).toHaveBeenCalledWith('Knowledge graph update failed', {
        tenantId,
        error: 'db error',
      });
    });
  });

  describe('enrichContext', () => {
    it('returns graph context with nodes and edges', async () => {
      prismaMock.knowledgeGraphNode.findMany.mockResolvedValue([
        {
          nodeId: 'concept-1',
          nodeType: 'concept',
          properties: { title: 'REST' },
        },
      ]);
      prismaMock.knowledgeGraphEdge.findMany.mockResolvedValue([
        {
          id: 'edge-1',
          sourceNodeId: 'concept-1',
          targetNodeId: 'concept-2',
          edgeType: 'related_to',
          weight: 0.7,
        },
      ]);

      const context = await service.enrichContext({
        tenantId,
        nodeIds: ['concept-1'],
        maxNodes: 3,
      });

      expect(prismaMock.knowledgeGraphNode.findMany).toHaveBeenCalled();
      expect(prismaMock.knowledgeGraphEdge.findMany).toHaveBeenCalled();
      expect(context).toEqual({
        nodes: [
          {
            nodeId: 'concept-1',
            nodeType: 'concept',
            properties: { title: 'REST' },
          },
        ],
        edges: [
          expect.objectContaining({ edgeType: 'related_to' }),
        ],
      });
    });
  });

  describe('syncGraph', () => {
    it('updates graph and records version metadata', async () => {
      const updateSpy = jest.spyOn(service, 'updateGraph').mockResolvedValue();

      await service.syncGraph({
        tenantId,
        nodes: [],
        edges: [],
        version: 'v2',
        timestamp: '2025-11-11T10:00:00Z',
      });

      expect(updateSpy).toHaveBeenCalledWith({ tenantId, nodes: [], edges: [] });

      const versionInfo = service.getGraphVersion({ tenantId });
      expect(versionInfo).toEqual({ version: 'v2', timestamp: '2025-11-11T10:00:00Z' });
    });
  });

  describe('handleKafkaEvent', () => {
    it('routes sync events to syncGraph', async () => {
      const syncSpy = jest.spyOn(service, 'syncGraph').mockResolvedValue();

      await service.handleKafkaEvent({
        type: 'graph.sync',
        tenantId,
        payload: { nodes: [], edges: [] },
      });

      expect(syncSpy).toHaveBeenCalledWith({ tenantId, nodes: [], edges: [] });
    });

    it('warns on unknown event type', async () => {
      await service.handleKafkaEvent({ type: 'unknown', tenantId });
      expect(loggerMock.warn).toHaveBeenCalledWith('Unknown graph event type received', {
        tenantId,
        type: 'unknown',
      });
    });
  });

  describe('verifySyncTime', () => {
    it('returns true when last sync within threshold', () => {
      service.versionCache.set(tenantId, {
        version: 'v1',
        timestamp: new Date().toISOString(),
      });

      expect(service.verifySyncTime({ tenantId, maxAgeMs: 5 * 60 * 1000 })).toBe(true);
    });

    it('returns false when sync timestamp too old', () => {
      service.versionCache.set(tenantId, {
        version: 'v1',
        timestamp: '2020-01-01T00:00:00Z',
      });

      expect(service.verifySyncTime({ tenantId, maxAgeMs: 5 * 60 * 1000 })).toBe(false);
    });
  });
});
