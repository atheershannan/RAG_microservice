/**
 * Manual mock for redis.config.js
 */

import { jest } from '@jest/globals';

export const redis = {
  get: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  status: 'ready',
};

export const isRedisAvailable = jest.fn(() => true);
export const getRedis = jest.fn(() => redis);

