import Redis from 'ioredis';

const testRedisUrl = process.env.TEST_REDIS_URL || process.env.REDIS_URL;

const redisTestClient = testRedisUrl
  ? new Redis(testRedisUrl, {
      enableOfflineQueue: false,
    })
  : null;

async function clearCache() {
  if (!redisTestClient) {
    return;
  }

  await redisTestClient.flushall();
}

async function disconnectCache() {
  if (!redisTestClient) {
    return;
  }

  await redisTestClient.quit();
}

export { redisTestClient, clearCache, disconnectCache };

