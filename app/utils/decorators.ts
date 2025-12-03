/**
 * Smart Decorators for auto-optimization
 */

import { apiCache } from './cache-manager'
import { logger } from './logger'
import { performanceMonitor } from './performance-monitor'

/**
 * Auto-cache decorator for GET methods
 */
export function Cached(ttl: number = 5 * 60 * 1000) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`
      
      return apiCache.getOrSet(
        cacheKey,
        () => originalMethod.apply(this, args),
        ttl
      )
    }

    return descriptor
  }
}

/**
 * Auto-invalidate cache decorator for mutations
 */
export function InvalidateCache(patterns: string[]) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args)
      
      // Invalidate cache patterns
      for (const pattern of patterns) {
        apiCache.invalidatePattern(pattern)
        logger.debug('Cache invalidated by decorator', { 
          method: propertyKey, 
          pattern 
        })
      }

      return result
    }

    return descriptor
  }
}

/**
 * Performance monitoring decorator
 */
export function Monitored(metricName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    const metric = metricName || `${target.constructor.name}.${propertyKey}`

    descriptor.value = async function (...args: any[]) {
      performanceMonitor.start(metric)
      
      try {
        const result = await originalMethod.apply(this, args)
        performanceMonitor.end(metric, { success: true })
        return result
      } catch (error) {
        performanceMonitor.end(metric, { success: false, error })
        throw error
      }
    }

    return descriptor
  }
}

/**
 * Retry decorator with exponential backoff
 */
export function Retry(maxRetries: number = 3) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      let lastError: any
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await originalMethod.apply(this, args)
        } catch (error) {
          lastError = error
          
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000
            logger.warn('Retrying method', { 
              method: propertyKey, 
              attempt: attempt + 1, 
              delay 
            })
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        }
      }
      
      throw lastError
    }

    return descriptor
  }
}

/**
 * Debounce decorator
 */
export function Debounce(delay: number = 300) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    let timeoutId: NodeJS.Timeout

    descriptor.value = function (...args: any[]) {
      clearTimeout(timeoutId)
      
      return new Promise((resolve) => {
        timeoutId = setTimeout(() => {
          resolve(originalMethod.apply(this, args))
        }, delay)
      })
    }

    return descriptor
  }
}

/**
 * Throttle decorator
 */
export function Throttle(limit: number = 1000) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    let lastRun = 0

    descriptor.value = async function (...args: any[]) {
      const now = Date.now()
      
      if (now - lastRun >= limit) {
        lastRun = now
        return originalMethod.apply(this, args)
      }
      
      logger.debug('Method throttled', { method: propertyKey })
      return Promise.resolve()
    }

    return descriptor
  }
}

/**
 * Memoize decorator (cache function results)
 */
export function Memoize() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    const cache = new Map()

    descriptor.value = function (...args: any[]) {
      const key = JSON.stringify(args)
      
      if (cache.has(key)) {
        return cache.get(key)
      }
      
      const result = originalMethod.apply(this, args)
      cache.set(key, result)
      return result
    }

    return descriptor
  }
}
