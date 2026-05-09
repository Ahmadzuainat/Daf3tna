import nodeCache from 'node-cache';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const myCache = new nodeCache({ stdTTL: 600 }); // 10 minutes default
let redis = null;

if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL);
    console.log('✅ Redis connected for caching');
  } catch (error) {
    console.error('❌ Redis connection failed, falling back to node-cache');
  }
}

export const getCache = async (key) => {
  if (redis) {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }
  return myCache.get(key);
};

export const setCache = async (key, value, ttl = 600) => {
  if (redis) {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } else {
    myCache.set(key, value, ttl);
  }
};

export const deleteCache = async (key) => {
  if (redis) {
    await redis.del(key);
  } else {
    myCache.del(key);
  }
};

// Clear cache by pattern (Redis only)
export const clearCachePattern = async (pattern) => {
  if (redis) {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(keys);
  } else {
    // node-cache doesn't support patterns easily, we'll just flush for now if needed
    // myCache.flushAll(); 
  }
};
