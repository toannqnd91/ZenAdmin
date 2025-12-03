/**
 * Service Optimization Composable
 * Provides utilities for optimizing service calls
 */

import { requestDeduplicator } from '@/utils/request-deduplication'
import { createBatchLoader } from '@/utils/batch-loader'

export const useServiceOptimization = () => {
  /**
   * Deduplicate service calls
   */
  const deduplicate = async <T>(
    key: string,
    fetcher: () => Promise<T>
  ): Promise<T> => {
    return requestDeduplicator.deduplicate(key, fetcher)
  }

  /**
   * Create batch loader for a service method
   */
  const createLoader = <K, V>(
    batchFn: (keys: K[]) => Promise<V[]>,
    options?: {
      maxBatchSize?: number
      batchDelay?: number
    }
  ) => {
    return createBatchLoader({
      batchFn,
      maxBatchSize: options?.maxBatchSize || 50,
      batchDelay: options?.batchDelay || 10
    })
  }

  /**
   * Wrap service call with deduplication
   */
  const withDeduplication = <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    keyGenerator: (...args: Parameters<T>) => string
  ): T => {
    return (async (...args: Parameters<T>) => {
      const key = keyGenerator(...args)
      return deduplicate(key, () => fn(...args))
    }) as T
  }

  return {
    deduplicate,
    createLoader,
    withDeduplication
  }
}

/**
 * Example usage:
 * 
 * const { deduplicate, createLoader } = useServiceOptimization()
 * 
 * // Deduplicate
 * const products = await deduplicate('products', () => productService.getProducts())
 * 
 * // Batch loading
 * const categoryLoader = createLoader(
 *   (ids: number[]) => productService.getCategoriesByIds(ids)
 * )
 * const categories = await categoryLoader.loadMany([1, 2, 3])
 */
