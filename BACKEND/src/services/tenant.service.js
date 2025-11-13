/**
 * Tenant Service
 * Handles tenant management and retrieval
 */

import { getPrismaClient } from '../config/database.config.js';
import { logger } from '../utils/logger.util.js';

/**
 * Get or create tenant by domain
 * @param {string} domain - Tenant domain
 * @returns {Promise<Object>} Tenant object
 */
export async function getOrCreateTenant(domain) {
  try {
    const prisma = await getPrismaClient();

    // Try to find existing tenant
    let tenant = await prisma.tenant.findUnique({
      where: { domain },
    });

    // If not found, create default tenant
    if (!tenant) {
      logger.info('Creating new tenant', { domain });
      tenant = await prisma.tenant.create({
        data: {
          name: domain,
          domain,
          settings: {
            queryRetentionDays: 90,
            enableAuditLogs: true,
            enablePersonalization: true,
          },
        },
      });
      logger.info('Tenant created', { domain, tenantId: tenant.id });
    }

    return tenant;
  } catch (error) {
    logger.error('Get or create tenant error', {
      error: error.message,
      domain,
      stack: error.stack,
    });
    throw new Error(`Tenant management failed: ${error.message}`);
  }
}

/**
 * Get tenant by ID
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<Object|null>} Tenant object or null
 */
export async function getTenantById(tenantId) {
  try {
    const prisma = await getPrismaClient();

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    return tenant;
  } catch (error) {
    logger.error('Get tenant by ID error', {
      error: error.message,
      tenantId,
      stack: error.stack,
    });
    throw new Error(`Get tenant failed: ${error.message}`);
  }
}

/**
 * Get tenant by domain
 * @param {string} domain - Tenant domain
 * @returns {Promise<Object|null>} Tenant object or null
 */
export async function getTenantByDomain(domain) {
  try {
    const prisma = await getPrismaClient();

    const tenant = await prisma.tenant.findUnique({
      where: { domain },
    });

    return tenant;
  } catch (error) {
    logger.error('Get tenant by domain error', {
      error: error.message,
      domain,
      stack: error.stack,
    });
    throw new Error(`Get tenant failed: ${error.message}`);
  }
}
