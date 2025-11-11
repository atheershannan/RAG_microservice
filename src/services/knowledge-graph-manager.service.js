import { logger as defaultLogger } from '../utils/logger.util.js';

let defaultPrismaPromise = null;
let defaultKafkaProducerPromise = null;

async function resolveDefaultPrisma() {
  if (!defaultPrismaPromise) {
    const module = await import('../config/database.config.js');
    defaultPrismaPromise = Promise.resolve(module.prisma);
  }

  return defaultPrismaPromise;
}

async function resolveDefaultKafkaProducer() {
  if (!defaultKafkaProducerPromise) {
    try {
      const module = await import('../services/kafka-producer.service.js');
      defaultKafkaProducerPromise = Promise.resolve(module.kafkaProducerService);
    } catch (error) {
      defaultKafkaProducerPromise = Promise.resolve(null);
    }
  }

  return defaultKafkaProducerPromise;
}

class KnowledgeGraphManagerService {
  constructor({
    prismaClient = undefined,
    kafkaProducer = undefined,
    logger = defaultLogger,
  } = {}) {
    const hasCustomPrisma = prismaClient !== undefined;
    const hasCustomKafka = kafkaProducer !== undefined;

    this.prismaProvider = hasCustomPrisma
      ? () => Promise.resolve(prismaClient)
      : () => resolveDefaultPrisma();
    this.kafkaProducerProvider = hasCustomKafka
      ? () => Promise.resolve(kafkaProducer)
      : () => resolveDefaultKafkaProducer();

    this.logger = logger;
    this.versionCache = new Map();
  }

  async updateGraph({ tenantId, nodes = [], edges = [] }) {
    const prisma = await this.prismaProvider();

    try {
      for (const node of nodes) {
        const { nodeId, nodeType = 'concept', properties = {} } = node;
        if (!nodeId) {
          continue;
        }

        await prisma.knowledgeGraphNode.upsert({
          where: { nodeId },
          create: {
            tenantId,
            nodeId,
            nodeType,
            properties,
          },
          update: {
            nodeType,
            properties,
          },
        });
      }

      for (const edge of edges) {
        const {
          edgeId,
          sourceNodeId,
          targetNodeId,
          edgeType = 'related_to',
          weight = null,
          properties = {},
        } = edge;

        if (!sourceNodeId || !targetNodeId) {
          continue;
        }

        const id = edgeId || `${sourceNodeId}::${targetNodeId}::${edgeType}`;

        await prisma.knowledgeGraphEdge.upsert({
          where: { id },
          create: {
            tenantId,
            id,
            sourceNodeId,
            targetNodeId,
            edgeType,
            weight,
            properties,
          },
          update: {
            edgeType,
            weight,
            properties,
          },
        });
      }
    } catch (error) {
      this.logger.error('Knowledge graph update failed', {
        tenantId,
        error: error.message,
      });
      throw new Error('GRAPH_UPDATE_FAILED');
    }
  }

  async enrichContext({ tenantId, nodeIds = [], maxNodes = 10 }) {
    const prisma = await this.prismaProvider();

    const nodeQuery = {
      where: { tenantId },
      take: maxNodes,
    };

    if (nodeIds.length > 0) {
      nodeQuery.where.nodeId = { in: nodeIds };
    }

    const [nodes, edges] = await Promise.all([
      prisma.knowledgeGraphNode.findMany(nodeQuery),
      prisma.knowledgeGraphEdge.findMany({
        where: {
          tenantId,
          OR: [
            { sourceNodeId: { in: nodeIds } },
            { targetNodeId: { in: nodeIds } },
          ],
        },
      }),
    ]);

    return {
      nodes,
      edges,
    };
  }

  async syncGraph({ tenantId, nodes = [], edges = [], version = null, timestamp = null }) {
    await this.updateGraph({ tenantId, nodes, edges });

    const metadata = {
      version: version ?? `v-${Date.now()}`,
      timestamp: timestamp ?? new Date().toISOString(),
    };

    this.versionCache.set(tenantId, metadata);

    return metadata;
  }

  async handleKafkaEvent(event) {
    if (!event || !event.type) {
      return;
    }

    const { type, tenantId, payload = {} } = event;

    switch (type) {
      case 'graph.sync':
        await this.syncGraph({
          tenantId,
          nodes: payload.nodes ?? [],
          edges: payload.edges ?? [],
          version: payload.version,
          timestamp: payload.timestamp,
        });
        break;
      case 'graph.update':
        await this.updateGraph({
          tenantId,
          nodes: payload.nodes ?? [],
          edges: payload.edges ?? [],
        });
        break;
      default:
        this.logger.warn('Unknown graph event type received', {
          tenantId,
          type,
        });
        break;
    }
  }

  getGraphVersion({ tenantId }) {
    return this.versionCache.get(tenantId) ?? null;
  }

  verifySyncTime({ tenantId, maxAgeMs = 5 * 60 * 1000 }) {
    const metadata = this.versionCache.get(tenantId);
    if (!metadata?.timestamp) {
      return false;
    }

    const lastSync = new Date(metadata.timestamp).getTime();
    const now = Date.now();

    return now - lastSync <= maxAgeMs;
  }
}

const knowledgeGraphManagerService = new KnowledgeGraphManagerService();

export { KnowledgeGraphManagerService, knowledgeGraphManagerService };
