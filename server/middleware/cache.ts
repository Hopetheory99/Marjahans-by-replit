import type { RequestHandler } from "express";

/**
 * In-Memory Cache with TTL support
 * Simple, fast caching layer for frequently accessed data
 */
class CacheStore {
  private cache = new Map<string, { value: any; expireAt: number }>();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  };

  /**
   * Set a value in cache with TTL
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttlSeconds - Time to live in seconds (default 5 minutes)
   */
  set(key: string, value: any, ttlSeconds: number = 300): void {
    const expireAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expireAt });
    this.stats.sets++;
  }

  /**
   * Get a value from cache
   * Returns undefined if not found or expired
   */
  get(key: string): any {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    // Check if expired
    if (Date.now() > entry.expireAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return undefined;
    }

    this.stats.hits++;
    return entry.value;
  }

  /**
   * Delete a value from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`[CACHE] Cleared ${size} entries`);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) : "0";
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: `${hitRate}%`,
    };
  }

  /**
   * Get cache size
   */
  getSize(): number {
    return this.cache.size;
  }
}

// Global cache instance
const cache = new CacheStore();

/**
 * Generate cache key from request
 */
function generateCacheKey(req: any): string | null {
  // Only cache GET requests
  if (req.method !== "GET") {
    return null;
  }

  // Skip if authenticated (user-specific data)
  if (req.user) {
    return null;
  }

  // Create key from path and query params
  const queryKey =
    Object.keys(req.query).length > 0
      ? `?${new URLSearchParams(req.query).toString()}`
      : "";

  return `${req.path}${queryKey}`;
}

/**
 * Middleware to handle response caching
 */
export const cacheMiddleware: RequestHandler = (req, res, next) => {
  const cacheKey = generateCacheKey(req);

  // Try to get from cache
  if (cacheKey) {
    const cachedResponse = cache.get(cacheKey);
    if (cachedResponse) {
      console.log(`[CACHE] Hit: ${cacheKey}`);
      return res.json(cachedResponse);
    }
  }

  // Override res.json to capture response
  const originalJson = res.json;
  res.json = function (data: any) {
    // Only cache successful responses
    if (res.statusCode === 200 && cacheKey) {
      cache.set(cacheKey, data, 300); // 5 minutes default TTL
      console.log(`[CACHE] Set: ${cacheKey}`);
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Cache invalidation middleware
 * Clears relevant cache entries when data is modified
 */
export const invalidateCacheMiddleware: RequestHandler = (req, res, next) => {
  // Only invalidate on state-changing requests
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    // Invalidate products cache on any modification
    if (req.path.startsWith("/api/products")) {
      cache.delete("/api/products/featured");
      cache.delete("/api/products/new-arrivals");
      cache.delete("/api/products");
      console.log("[CACHE] Invalidated: products");
    }

    // Invalidate categories cache
    if (req.path.startsWith("/api/categories")) {
      cache.delete("/api/categories");
      console.log("[CACHE] Invalidated: categories");
    }

    // Invalidate search cache
    if (req.path.includes("/search")) {
      console.log("[CACHE] Invalidated: search results");
    }
  }

  next();
};

/**
 * Prefetch featured products into cache
 * Call this on app startup or periodically
 */
export async function prefetchFeaturedProducts(
  fetchFn: () => Promise<any>
): Promise<void> {
  try {
    const products = await fetchFn();
    cache.set("/api/products/featured", products, 600); // 10 minutes TTL
    console.log("[CACHE] Prefetched featured products");
  } catch (error) {
    console.error("Error prefetching featured products:", error);
  }
}

/**
 * Prefetch new arrivals into cache
 */
export async function prefetchNewArrivals(
  fetchFn: () => Promise<any>
): Promise<void> {
  try {
    const products = await fetchFn();
    cache.set("/api/products/new-arrivals", products, 600); // 10 minutes TTL
    console.log("[CACHE] Prefetched new arrivals");
  } catch (error) {
    console.error("Error prefetching new arrivals:", error);
  }
}

/**
 * Prefetch categories into cache
 */
export async function prefetchCategories(
  fetchFn: () => Promise<any>
): Promise<void> {
  try {
    const categories = await fetchFn();
    cache.set("/api/categories", categories, 3600); // 1 hour TTL
    console.log("[CACHE] Prefetched categories");
  } catch (error) {
    console.error("Error prefetching categories:", error);
  }
}

/**
 * Get cache statistics endpoint
 */
export function getCacheStatsEndpoint(req: any, res: any) {
  res.json(cache.getStats());
}

/**
 * Clear cache endpoint
 */
export function clearCacheEndpoint(req: any, res: any) {
  cache.clear();
  res.json({ message: "Cache cleared" });
}

/**
 * Get cache size endpoint
 */
export function getCacheSizeEndpoint(req: any, res: any) {
  res.json({ size: cache.getSize() });
}

export default cache;
