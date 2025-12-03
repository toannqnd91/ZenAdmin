/**
 * Smart Optimization Plugin
 * Auto-enables smart features (request deduplication, smart logger)
 */

import { requestDeduplicator } from '@/utils/request-deduplication'
import { logger } from '@/utils/logger'
import { apiCache } from '@/utils/cache-manager'
import { performanceMonitor } from '@/utils/performance-monitor'

export default defineNuxtPlugin(() => {
  // Enable smart features in production
  if (!process.dev) {
    logger.info('Smart optimization enabled')

    // Monitor performance
    if (window.performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = window.performance.timing
          const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart
          
          logger.info('Page load performance', {
            pageLoadTime,
            domReady: perfData.domContentLoadedEventEnd - perfData.navigationStart,
            render: perfData.domComplete - perfData.domLoading
          })
        }, 0)
      })
    }

    // Log cache stats periodically
    setInterval(() => {
      const stats = apiCache.getStats()
      logger.debug('Cache statistics', stats)
    }, 5 * 60 * 1000) // Every 5 minutes

    // Log deduplication stats
    setInterval(() => {
      const stats = requestDeduplicator.getStats()
      if (stats.pendingRequests > 0) {
        logger.debug('Request deduplication stats', stats)
      }
    }, 5 * 60 * 1000)
  }

  // Provide utilities globally
  return {
    provide: {
      requestDeduplicator,
      cache: apiCache,
      performance: performanceMonitor
    }
  }
})
