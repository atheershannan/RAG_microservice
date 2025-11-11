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

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



