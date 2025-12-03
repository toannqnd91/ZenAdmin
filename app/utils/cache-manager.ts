/**
 * Enterprise-grade caching layer
 * Supports in-memory caching with TTL and LRU eviction
 */

import { logger } from './logger'

export interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum cache size (LRU eviction)
}

interface CacheEntry<T> {
  value: T
  expiry: number
  lastAccessed: number
}

class CacheManager {
  private cache: Map<string, CacheEntry<unknown>> = new Map()
  private defaultTTL: number = 5 * 60 * 1000 // 5 minutes
  private maxSize: number = 100
  private hits: number = 0
  private misses: number = 0

  constructor(options?: CacheOptions) {
    if (options?.ttl) this.defaultTTL = options.ttl
    if (options?.maxSize) this.maxSize = options.maxSize
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined

    if (!entry) {
      this.misses++
      logger.debug('Cache miss', { key, hitRate: this.getHitRate() })
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      this.misses++
      logger.debug('Cache expired', { key, hitRate: this.getHitRate() })
      return null
    }

    // Update last accessed time for LRU
    entry.lastAccessed = Date.now()
    this.hits++
    logger.debug('Cache hit', { key, hitRate: this.getHitRate() })
    return entry.value
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    const expiryTime = ttl || this.defaultTTL
    const entry: CacheEntry<T> = {
      value,
      expiry: Date.now() + expiryTime,
      lastAccessed: Date.now()
    }

    this.cache.set(key, entry as CacheEntry<unknown>)
    logger.debug('Cache set', { key, ttl: expiryTime, size: this.cache.size })
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      logger.debug('Cache deleted', { key, size: this.cache.size })
    }
    return deleted
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const size = this.cache.size
    this.cache.clear()
    this.hits = 0
    this.misses = 0
    logger.info('Cache cleared', { previousSize: size })
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return false
    }
    return true
  }

  /**
   * Get or set pattern - fetch from cache or compute and cache
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const value = await fetcher()
    this.set(key, value, ttl)
    return value
  }

  /**
   * Invalidate cache by pattern (prefix matching)
   */
  invalidatePattern(pattern: string): number {
    let count = 0
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key)
        count++
      }
    }
    logger.info('Cache invalidated by pattern', { pattern, count })
    return count
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.getHitRate(),
      totalRequests: this.hits + this.misses
    }
  }

  /**
   * Get cache hit rate
   */
  private getHitRate(): number {
    const total = this.hits + this.misses
    return total === 0 ? 0 : (this.hits / total) * 100
  }

  /**
   * Evict oldest (least recently used) entry
   */
  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      logger.debug('Cache evicted (LRU)', { key: oldestKey })
    }
  }
}

// Singleton instances for different cache types
export const apiCache = new CacheManager({ ttl: 5 * 60 * 1000, maxSize: 100 }) // 5 min
export const dataCache = new CacheManager({ ttl: 15 * 60 * 1000, maxSize: 50 }) // 15 min
export const staticCache = new CacheManager({ ttl: 60 * 60 * 1000, maxSize: 200 }) // 1 hour
