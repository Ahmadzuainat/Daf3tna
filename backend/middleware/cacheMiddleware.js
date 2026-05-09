import NodeCache from 'node-cache';

// TTL of 5 minutes by default
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * Cache middleware to store API responses in memory.
 * Use this only for semi-static data like profiles, settings, or static feeds.
 */
export const cacheMiddleware = (duration = 300) => (req, res, next) => {
  // Only cache GET requests
  if (req.method !== 'GET') {
    return next();
  }

  const key = `__express__${req.originalUrl || req.url}`;
  const cachedResponse = cache.get(key);

  if (cachedResponse) {
    console.log(`📡 Cache hit for: ${key}`);
    return res.status(200).json(cachedResponse);
  } else {
    // Override res.json to capture the response and store it in cache
    res.sendResponse = res.json;
    res.json = (body) => {
      cache.set(key, body, duration);
      res.sendResponse(body);
    };
    next();
  }
};

/**
 * Clear specific cache key or pattern
 */
export const clearCache = (key) => {
  if (key) {
    cache.del(key);
  } else {
    cache.flushAll();
  }
};

export default cache;
