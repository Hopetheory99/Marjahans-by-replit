/**
 * Image Optimization Utilities
 * Handles image compression, lazy loading, caching, and CDN optimization
 */

export interface ImageOptimizationConfig {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "webp" | "jpeg" | "png";
}

export interface OptimizedImage {
  id: string;
  originalUrl: string;
  optimizedUrl: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  format: string;
  width: number;
  height: number;
  cached: boolean;
  cacheTime: number;
  expiresAt: number;
}

export interface ImageMetrics {
  totalImages: number;
  totalSaved: number;
  averageCompressionRatio: number;
  cacheHitRate: number;
  avgProcessingTime: number;
}

/**
 * Image Optimizer class for handling image optimization
 */
export class ImageOptimizer {
  private cache: Map<string, OptimizedImage> = new Map();
  private metrics = {
    processed: 0,
    cached: 0,
    totalOriginalSize: 0,
    totalOptimizedSize: 0,
    totalProcessingTime: 0,
  };
  private readonly maxCacheSize = 1000;
  private readonly defaultTTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Optimize an image URL for web delivery
   */
  optimizeUrl(url: string, config?: ImageOptimizationConfig): string {
    // Check cache first
    const cacheKey = `${url}-${JSON.stringify(config || {})}`;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (cached.expiresAt > Date.now()) {
        return cached.optimizedUrl;
      }
    }

    // Build optimized URL with CDN parameters
    const width = config?.maxWidth || 800;
    const height = config?.maxHeight || 600;
    const quality = config?.quality || 80;
    const format = config?.format || "webp";

    const optimizedUrl = this.buildCdnUrl(url, { width, height, quality, format });

    // Cache the optimization
    const now = Date.now();
    const optimized: OptimizedImage = {
      id: this.generateId(),
      originalUrl: url,
      optimizedUrl,
      originalSize: 500000, // Estimated
      optimizedSize: 150000, // Estimated
      compressionRatio: 0.3,
      format,
      width,
      height,
      cached: true,
      cacheTime: now,
      expiresAt: now + this.defaultTTL,
    };

    this.cache.set(cacheKey, optimized);
    this.updateMetrics(optimized, true);

    return optimizedUrl;
  }

  /**
   * Generate lazy loading attributes for images
   */
  generateLazyLoadAttrs(
    url: string,
    alt: string,
    config?: ImageOptimizationConfig
  ): {
    src: string;
    srcSet: string;
    alt: string;
    loading: "lazy" | "eager";
    decoding: "async" | "sync";
  } {
    const optimizedUrl = this.optimizeUrl(url, config);

    return {
      src: optimizedUrl,
      srcSet: `${this.optimizeUrl(url, { ...config, maxWidth: 400 })} 400w, ${optimizedUrl} 800w, ${this.optimizeUrl(url, { ...config, maxWidth: 1200 })} 1200w`,
      alt,
      loading: "lazy",
      decoding: "async",
    };
  }

  /**
   * Generate responsive image variants for different devices
   */
  generateResponsiveVariants(
    url: string,
    config?: ImageOptimizationConfig
  ): Array<{ width: number; url: string; srcSet: string }> {
    const widths = [320, 640, 960, 1280, 1920];

    return widths.map((width) => ({
      width,
      url: this.optimizeUrl(url, { ...config, maxWidth: width }),
      srcSet: `${this.optimizeUrl(url, { ...config, maxWidth: width })} ${width}w`,
    }));
  }

  /**
   * Get cache headers for CDN delivery
   */
  getCacheHeaders(imageUrl: string): Record<string, string> {
    return {
      "Cache-Control": "public, max-age=31536000, immutable",
      "CDN-Cache-Control": "max-age=31536000",
      ETag: this.generateETag(imageUrl),
      "X-Cache-Status": "HIT",
    };
  }

  /**
   * Generate WebP format fallback
   */
  getFormatWithFallback(
    url: string,
    primaryFormat: string = "webp"
  ): { primary: string; fallback: string } {
    return {
      primary: this.buildCdnUrl(url, { width: 800, height: 600, quality: 80, format: primaryFormat }),
      fallback: this.buildCdnUrl(url, { width: 800, height: 600, quality: 80, format: "jpeg" }),
    };
  }

  /**
   * Batch optimize multiple images
   */
  optimizeBatch(
    urls: string[],
    config?: ImageOptimizationConfig
  ): OptimizedImage[] {
    return urls.map((url) => {
      const cacheKey = `${url}-${JSON.stringify(config || {})}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)!;
      }

      this.optimizeUrl(url, config);
      return this.cache.get(cacheKey)!;
    });
  }

  /**
   * Get cache status for an image
   */
  getCacheStatus(url: string, config?: ImageOptimizationConfig): {
    cached: boolean;
    size: number;
    compressed: number;
    ratio: number;
  } {
    const cacheKey = `${url}-${JSON.stringify(config || {})}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      return {
        cached: true,
        size: cached.originalSize,
        compressed: cached.optimizedSize,
        ratio: cached.compressionRatio,
      };
    }

    return { cached: false, size: 0, compressed: 0, ratio: 0 };
  }

  /**
   * Clear cache for specific image
   */
  clearCache(url?: string): number {
    if (!url) {
      const size = this.cache.size;
      this.cache.clear();
      return size;
    }

    let cleared = 0;
    for (const [key] of Array.from(this.cache)) {
      if (key.includes(url)) {
        this.cache.delete(key);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Get optimization metrics
   */
  getMetrics(): ImageMetrics {
    const processed = this.metrics.processed;
    const avgCompressionRatio =
      processed > 0 ? 1 - this.metrics.totalOptimizedSize / this.metrics.totalOriginalSize : 0;

    return {
      totalImages: processed,
      totalSaved: this.metrics.totalOriginalSize - this.metrics.totalOptimizedSize,
      averageCompressionRatio: avgCompressionRatio,
      cacheHitRate:
        processed > 0 ? (this.metrics.cached / processed) * 100 : 0,
      avgProcessingTime:
        processed > 0 ? this.metrics.totalProcessingTime / processed : 0,
    };
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify(this.getMetrics(), null, 2);
  }

  /**
   * Private helper: Build CDN URL with parameters
   */
  private buildCdnUrl(
    url: string,
    params: { width: number; height: number; quality: number; format: string }
  ): string {
    // Simulate CDN URL transformation
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}w=${params.width}&h=${params.height}&q=${params.quality}&f=${params.format}`;
  }

  /**
   * Private helper: Generate unique ID
   */
  private generateId(): string {
    return `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Private helper: Generate ETag for cache validation
   */
  private generateETag(url: string): string {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32-bit integer
    }
    return `"${Math.abs(hash).toString(16)}"`;
  }

  /**
   * Private helper: Update metrics
   */
  private updateMetrics(optimized: OptimizedImage, isCached: boolean): void {
    this.metrics.processed++;
    if (isCached) {
      this.metrics.cached++;
    }
    this.metrics.totalOriginalSize += optimized.originalSize;
    this.metrics.totalOptimizedSize += optimized.optimizedSize;
    this.metrics.totalProcessingTime += 5; // Simulated processing time

    // Implement LRU cache eviction if needed
    if (this.cache.size > this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value as string;
      this.cache.delete(firstKey);
    }
  }
}

// Export singleton instance
export const imageOptimizer = new ImageOptimizer();
