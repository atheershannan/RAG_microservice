/**
 * Prisma seed script
 * Populates database with initial test data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create default tenant
  const tenant = await prisma.tenant.upsert({
    where: { domain: 'dev.educore.local' },
    update: {},
    create: {
      name: 'Development Tenant',
      domain: 'dev.educore.local',
      settings: {
        queryRetentionDays: 90,
        enableAuditLogs: true,
        enablePersonalization: true,
      },
    },
  });

  console.log('✅ Created tenant:', tenant.domain);

  // 2. Create sample access control rules
  const rbacRules = [
    {
      ruleType: 'RBAC',
      subjectType: 'role',
      subjectId: 'learner',
      resourceType: 'course',
      resourceId: null,
      permission: 'read',
      isActive: true,
    },
    {
      ruleType: 'RBAC',
      subjectType: 'role',
      subjectId: 'trainer',
      resourceType: 'course',
      resourceId: null,
      permission: 'write',
      isActive: true,
    },
    {
      ruleType: 'RBAC',
      subjectType: 'role',
      subjectId: 'hr',
      resourceType: 'report',
      resourceId: null,
      permission: 'read',
      isActive: true,
    },
  ];

  for (const rule of rbacRules) {
    await prisma.accessControlRule.create({
      data: {
        ...rule,
        tenantId: tenant.id,
      },
    });
  }

  console.log('✅ Created access control rules');

  // 3. Create sample user profiles
  const users = [
    {
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
  ];

  for (const user of users) {
    await prisma.userProfile.upsert({
      where: { userId: user.userId },
      update: {},
      create: {
        ...user,
        tenantId: tenant.id,
      },
    });
  }

  console.log('✅ Created user profiles');

  // 4. Create sample knowledge graph nodes
  const courseNode = await prisma.knowledgeGraphNode.upsert({
    where: { nodeId: 'course:js-basics-101' },
    update: {},
    create: {
      tenantId: tenant.id,
      nodeId: 'course:js-basics-101',
      nodeType: 'course',
      properties: {
        title: 'JavaScript Basics 101',
        description: 'Introduction to JavaScript programming',
        duration: 3600,
        level: 'beginner',
        tags: ['javascript', 'programming', 'basics'],
      },
    },
  });

  const skillNode = await prisma.knowledgeGraphNode.upsert({
    where: { nodeId: 'skill:javascript' },
    update: {},
    create: {
      tenantId: tenant.id,
      nodeId: 'skill:javascript',
      nodeType: 'skill',
      properties: {
        name: 'JavaScript',
        category: 'programming',
        difficulty: 'intermediate',
      },
    },
  });

  const userNode = await prisma.knowledgeGraphNode.upsert({
    where: { nodeId: 'user:learner-001' },
    update: {},
    create: {
      tenantId: tenant.id,
      nodeId: 'user:learner-001',
      nodeType: 'user',
      properties: {
        name: 'John Doe',
        role: 'learner',
        department: 'Engineering',
      },
    },
  });

  console.log('✅ Created knowledge graph nodes');

  // 5. Create sample knowledge graph edges
  await prisma.knowledgeGraphEdge.createMany({
    data: [
      {
        tenantId: tenant.id,
        sourceNodeId: courseNode.nodeId,
        targetNodeId: skillNode.nodeId,
        edgeType: 'teaches',
        weight: 0.9,
        properties: {
          confidence: 0.95,
        },
      },
      {
        tenantId: tenant.id,
        sourceNodeId: userNode.nodeId,
        targetNodeId: courseNode.nodeId,
        edgeType: 'enrolled_in',
        weight: 1.0,
        properties: {
          enrolledAt: new Date().toISOString(),
          status: 'in_progress',
        },
      },
      {
        tenantId: tenant.id,
        sourceNodeId: userNode.nodeId,
        targetNodeId: skillNode.nodeId,
        edgeType: 'learning',
        weight: 0.5,
        properties: {
          progress: 0.3,
        },
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Created knowledge graph edges');

  // 6. Create sample queries
  const sampleQuery = await prisma.query.create({
    data: {
      tenantId: tenant.id,
      userId: 'learner-001',
      sessionId: 'session-001',
      queryText: 'How do I start learning JavaScript?',
      answer: 'JavaScript is a versatile programming language. Start with the basics: variables, functions, and control flow. Then move on to DOM manipulation and async programming.',
      confidenceScore: 0.85,
      processingTimeMs: 450,
      modelVersion: 'gpt-4.1-mini',
      isPersonalized: true,
      isCached: false,
      metadata: {
        sourcesCount: 3,
        topK: 5,
      },
      sources: {
        create: [
          {
            sourceId: 'course:js-basics-101',
            sourceType: 'course',
            title: 'JavaScript Basics 101',
            contentSnippet: 'Introduction to JavaScript programming...',
            sourceUrl: '/courses/js-basics-101',
            relevanceScore: 0.92,
            metadata: {
              section: 'getting-started',
            },
          },
        ],
      },
      recommendations: {
        create: [
          {
            recommendationType: 'course',
            recommendationId: 'course:js-advanced-201',
            title: 'JavaScript Advanced 201',
            description: 'Advanced JavaScript concepts and patterns',
            reason: 'Build on your JavaScript basics',
            priority: 1,
            metadata: {
              estimatedTime: 4800,
            },
          },
        ],
      },
    },
  });

  console.log('✅ Created sample query with sources and recommendations');

  // 7. Note about vector embeddings
  console.log('');
  console.log('⚠️  Note: Vector embeddings must be created separately');
  console.log('   Vector embeddings require raw SQL or the vector storage service');
  console.log('   because Prisma does not support pgvector type directly.');
  console.log('   Example SQL:');
  console.log('   INSERT INTO vector_embeddings (...) VALUES (...);');

  console.log('');
  console.log('✅ Seeding complete!');
  console.log(`✅ Created tenant: ${tenant.domain} (${tenant.id})`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




