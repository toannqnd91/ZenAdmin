/**
 * Batch Loader - DataLoader pattern for batching requests
 */

import { logger } from './logger'

interface BatchConfig<K, V> {
  batchFn: (keys: K[]) => Promise<V[]>
  maxBatchSize?: number
  batchDelay?: number
}

class BatchLoader<K, V> {
  private queue: Array<{
    key: K
    resolve: (value: V) => void
    reject: (error: any) => void
  }> = []
  
  private timer: NodeJS.Timeout | null = null
  private readonly maxBatchSize: number
  private readonly batchDelay: number
  private readonly batchFn: (keys: K[]) => Promise<V[]>

  constructor(config: BatchConfig<K, V>) {
    this.batchFn = config.batchFn
    this.maxBatchSize = config.maxBatchSize || 100
    this.batchDelay = config.batchDelay || 10 // 10ms
  }

  /**
   * Load single item (will be batched)
   */
  load(key: K): Promise<V> {
    return new Promise((resolve, reject) => {
      this.queue.push({ key, resolve, reject })

      // Schedule batch execution
      if (this.queue.length >= this.maxBatchSize) {
        this.executeBatch()
      } else if (!this.timer) {
        this.timer = setTimeout(() => this.executeBatch(), this.batchDelay)
      }
    })
  }

  /**
   * Load multiple items
   */
  loadMany(keys: K[]): Promise<V[]> {
    return Promise.all(keys.map(key => this.load(key)))
  }

  /**
   * Execute batch request
   */
  private async executeBatch() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    if (this.queue.length === 0) return

    const batch = this.queue.splice(0, this.maxBatchSize)
    const keys = batch.map(item => item.key)

    logger.debug('Executing batch request', { 
      batchSize: keys.length,
      maxBatchSize: this.maxBatchSize
    })

    try {
      const results = await this.batchFn(keys)

      // Resolve all promises
      batch.forEach((item, index) => {
        item.resolve(results[index])
      })

      logger.debug('Batch request completed', { 
        batchSize: keys.length 
      })
    } catch (error) {
      // Reject all promises
      batch.forEach(item => {
        item.reject(error)
      })

      logger.error('Batch request failed', {
        batchSize: keys.length,
        error: error instanceof Error ? error.message : String(error)
      })
    }

    // Process remaining queue
    if (this.queue.length > 0) {
      this.timer = setTimeout(() => this.executeBatch(), this.batchDelay)
    }
  }

  /**
   * Clear queue
   */
  clear() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    this.queue = []
  }
}

/**
 * Create batch loader
 */
export function createBatchLoader<K, V>(
  config: BatchConfig<K, V>
): BatchLoader<K, V> {
  return new BatchLoader(config)
}

/**
 * Example: Batch load products by IDs
 */
export function createProductBatchLoader(
  fetchProducts: (ids: number[]) => Promise<any[]>
) {
  return createBatchLoader<number, any>({
    batchFn: fetchProducts,
    maxBatchSize: 50,
    batchDelay: 10
  })
}
