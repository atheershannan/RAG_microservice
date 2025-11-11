import { PrismaClient } from '@prisma/client';

const testDatabaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

const prismaTestClient = new PrismaClient(
  testDatabaseUrl
    ? {
        datasources: {
          db: {
            url: testDatabaseUrl,
          },
        },
      }
    : undefined
);

async function cleanupDatabase() {
  if (!testDatabaseUrl) {
    return;
  }

  await prismaTestClient.$transaction([
    prismaTestClient.queryRecommendation.deleteMany(),
    prismaTestClient.querySource.deleteMany(),
    prismaTestClient.query.deleteMany(),
    prismaTestClient.vectorEmbedding.deleteMany(),
    prismaTestClient.knowledgeGraphEdge.deleteMany(),
    prismaTestClient.knowledgeGraphNode.deleteMany(),
    prismaTestClient.accessControlRule.deleteMany(),
    prismaTestClient.userProfile.deleteMany(),
    prismaTestClient.auditLog.deleteMany(),
    prismaTestClient.cacheEntry.deleteMany(),
  ]);

  await prismaTestClient.tenant.deleteMany();
}

async function seedTestData() {
  if (!testDatabaseUrl) {
    return;
  }

  const tenant = await prismaTestClient.tenant.upsert({
    where: { domain: 'test.local' },
    update: {},
    create: {
      name: 'Test Tenant',
      domain: 'test.local',
      settings: {
        queryRetentionDays: 90,
        enableAuditLogs: true,
        enablePersonalization: true,
      },
    },
  });

  await prismaTestClient.accessControlRule.createMany({
    data: [
      {
        tenantId: tenant.id,
        ruleType: 'RBAC',
        subjectType: 'role',
        subjectId: 'learner',
        resourceType: 'course',
        permission: 'read',
      },
      {
        tenantId: tenant.id,
        ruleType: 'RBAC',
        subjectType: 'role',
        subjectId: 'trainer',
        resourceType: 'course',
        permission: 'write',
      },
      {
        tenantId: tenant.id,
        ruleType: 'RBAC',
        subjectType: 'role',
        subjectId: 'hr',
        resourceType: 'report',
        permission: 'read',
      },
    ],
    skipDuplicates: true,
  });

  await prismaTestClient.userProfile.createMany({
    data: [
      {
        tenantId: tenant.id,
        userId: 'learner-001',
        role: 'learner',
        department: 'Engineering',
        region: 'US',
        skillGaps: ['JavaScript', 'React'],
        learningProgress: {
          completedCourses: 5,
          inProgressCourses: 2,
        },
        preferences: {
          preferredLanguage: 'en',
          notificationEnabled: true,
        },
      },
      {
        tenantId: tenant.id,
        userId: 'trainer-001',
        role: 'trainer',
        department: 'Education',
        region: 'US',
        skillGaps: [],
        learningProgress: {},
        preferences: {
          preferredLanguage: 'en',
        },
      },
    ],
    skipDuplicates: true,
  });
}

async function disconnectTestDatabase() {
  await prismaTestClient.$disconnect();
}

export { prismaTestClient, cleanupDatabase, seedTestData, disconnectTestDatabase };

