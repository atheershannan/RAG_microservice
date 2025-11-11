/**
 * Database configuration
 * Prisma client setup
 * 
 * Note: Prisma schema is located at ../DATABASE/prisma/schema.prisma
 * Run: npm run db:generate (from BACKEND/) to generate Prisma client
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export { prisma };

