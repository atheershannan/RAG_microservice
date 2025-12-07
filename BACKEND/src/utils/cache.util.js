/**
 * Cache utility
 * Redis-based caching with TTL support
 * Gracefully handles Redis unavailability
 */

import { redis, isRedisAvailable } from '../config/redis.config.js';

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {Promise<string|null>} Cached value or null
 */
async function get(key) {
  if (!isRedisAvailable() || !redis) {
    return null;
  }
  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    // Silently fail - Redis is optional
    return null;
  }
}

/**
 * Set value in cache with TTL
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttlSeconds - Time to live in seconds
 * @returns {Promise<boolean>} Success status
 */
async function set(key, value, ttlSeconds = 3600) {
  if (!isRedisAvailable() || !redis) {
    return false;
  }
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    // Silently fail - Redis is optional
    return false;
  }
}

/**
 * Delete value from cache
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Success status
 */
async function del(key) {
  if (!isRedisAvailable() || !redis) {
    return false;
  }
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    // Silently fail - Redis is optional
    return false;
  }
}

/**
 * Check if key exists in cache
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Existence status
 */
async function exists(key) {
  if (!isRedisAvailable() || !redis) {
    return false;
  }
  try {
    const result = await redis.exists(key);
    return result === 1;
  } catch (error) {
    // Silently fail - Redis is optional
    return false;
  }
}

export { get, set, del, exists };




