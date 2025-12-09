/**
 * Redis configuration
 * 
 * Redis is OPTIONAL - used for caching query responses
 * If Redis is not available, the service will work without caching
 */

import Redis from 'ioredis';
import { logger } from '../utils/logger.util.js';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisEnabled = process.env.REDIS_ENABLED !== 'false'; // Default: true, set REDIS_ENABLED=false to disable

let redis = null;
let redisAvailable = false;

if (redisEnabled) {
  try {
    redis = new Redis(redisUrl, {
      retryStrategy: () => {
        // Never retry - stop immediately
        return null;
      },
      maxRetriesPerRequest: 0, // Don't retry requests
      lazyConnect: true, // Don't auto-connect
      enableOfflineQueue: false, // Don't queue commands if offline
      connectTimeout: 2000, // 2 second timeout
      enableReadyCheck: false, // Don't wait for ready
      showFriendlyErrorStack: false,
    });

    // Suppress all error events after first one
    let errorLogged = false;
    redis.on('error', (_err) => {
      if (!errorLogged) {
        logger.warn('Redis connection error (Redis is optional - service will work without it). Disabling Redis...');
        errorLogged = true;
        redisAvailable = false;
        // Disconnect and stop trying
        try {
          redis.disconnect();
        } catch (_e) {
          // Ignore disconnect errors
        }
        redis = null;
      }
    });

    redis.on('connect', () => {
      redisAvailable = true;
      errorLogged = false;
      logger.info('Redis connected - caching enabled');
    });

    redis.on('ready', () => {
      redisAvailable = true;
      errorLogged = false;
      logger.info('Redis ready - caching enabled');
    });

    // Try to connect with timeout (non-blocking)
    const connectTimeout = setTimeout(() => {
      if (!redisAvailable && redis) {
        logger.warn('Redis connection timeout. Service will continue without Redis cache.');
        try {
          redis.disconnect();
        } catch (_e) {
          // Ignore disconnect errors
        }
        redis = null;
      }
    }, 3000); // 3 second timeout

    redis.connect().then(() => {
      clearTimeout(connectTimeout);
    }).catch(() => {
      clearTimeout(connectTimeout);
      // Silently fail - Redis is optional
      redisAvailable = false;
      if (redis) {
        try {
          redis.disconnect();
        } catch (_e) {
          // Ignore disconnect errors
        }
        redis = null;
      }
    });
  } catch (error) {
    logger.warn('Redis initialization failed (Redis is optional):', error.message);
    redis = null;
    redisAvailable = false;
  }
} else {
  logger.info('Redis disabled (REDIS_ENABLED=false)');
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable() {
  return redisAvailable && redis && (redis.status === 'ready' || redis.status === 'connect');
}

/**
 * Get Redis client (may be null if not available)
 */
export function getRedis() {
  return isRedisAvailable() ? redis : null;
}

// Export redis for backward compatibility, but warn if not available
export { redis };




