/**
 * Request Deduplication - Prevent duplicate API calls
 */

import { logger } from './logger'

interface PendingRequest<T> {
  promise: Promise<T>
  timestamp: number
  count: number
}

class RequestDeduplicator {
  private pending: Map<string, PendingRequest<any>> = new Map()
  private readonly timeout = 5000 // 5 seconds

  /**
   * Deduplicate requests with same key
   */
  async deduplicate<T>(
    key: string,
    fetcher: () => Promise<T>
  ): Promise<T> {
    // Check if request is already pending
    const existing = this.pending.get(key)
    
    if (existing) {
      // Check if not timed out
      if (Date.now() - existing.timestamp < this.timeout) {
        existing.count++
        logger.debug('Request deduplicated', { 
          key, 
          duplicateCount: existing.count 
        })
        return existing.promise
      } else {
        // Timeout - remove and create new
        this.pending.delete(key)
      }
    }

    // Create new request
    const promise = fetcher()
      .then(result => {
        this.pending.delete(key)
        return result
      })
      .catch(error => {
        this.pending.delete(key)
        throw error
      })

    this.pending.set(key, {
      promise,
      timestamp: Date.now(),
      count: 1
    })

    return promise
  }

  /**
   * Clear all pending requests
   */
  clear() {
    this.pending.clear()
    logger.info('Request deduplication cleared')
  }

  /**
   * Get statistics
   */
  getStats() {
    const stats: Record<string, any> = {}
    
    for (const [key, req] of this.pending.entries()) {
      stats[key] = {
        pending: true,
        duplicateCount: req.count,
        age: Date.now() - req.timestamp
      }
    }
    
    return {
      pendingRequests: this.pending.size,
      details: stats
    }
  }
}

export const requestDeduplicator = new RequestDeduplicator()

/**
 * Deduplicate decorator
 */
export function Deduplicate() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const key = `${target.constructor.name}.${propertyKey}:${JSON.stringify(args)}`
      
      return requestDeduplicator.deduplicate(key, () => 
        originalMethod.apply(this, args)
      )
    }

    return descriptor
  }
}
