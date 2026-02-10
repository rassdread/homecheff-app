/**
 * Simple in-memory cache - FREE alternative to Redis
 * Like Instagram/Facebook use for ultra-fast responses
 */

interface CacheItem {
  value: any;
  expires: number;
}

class SimpleCache {
  private cache = new Map<string, CacheItem>();
  private maxSize = 1000; // Prevent memory leaks

  set(key: string, value: any, ttlSeconds: number = 3600) {
    // Clean up expired items
    this.cleanup();
    
    // Remove oldest if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + (ttlSeconds * 1000)
    });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache stats
  stats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 'N/A' // Would need tracking for this
    };
  }
}

// Global cache instance - like Redis but FREE
export const cache = new SimpleCache();

/**
 * Cache decorator for API routes
 * Usage: @cache(3600) // Cache for 1 hour
 */
export function withCache(ttlSeconds: number = 3600) {
  return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      const cacheKey = `${propertyName}:${JSON.stringify(args)}`;
      
      // Try to get from cache first
      const cached = cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Execute original method
      const result = await method.apply(this, args);
      
      // Cache the result
      cache.set(cacheKey, result, ttlSeconds);
      
      return result;
    };

    return descriptor;
  };
}

/**
 * Simple cache for API responses
 */
export async function getCachedOrFetch<T>(
  key: string, 
  fetchFn: () => Promise<T>, 
  ttlSeconds: number = 3600
): Promise<T> {
  // Try cache first
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  // Fetch and cache
  const result = await fetchFn();
  cache.set(key, result, ttlSeconds);
  
  return result;
}
