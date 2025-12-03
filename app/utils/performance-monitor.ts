/**
 * Performance monitoring utility
 * Tracks metrics for API calls, component renders, and user interactions
 */

import { logger } from './logger'

export interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
  metadata?: Record<string, unknown>
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private maxMetrics: number = 1000
  private timers: Map<string, number> = new Map()

  /**
   * Start a performance timer
   */
  start(name: string): void {
    this.timers.set(name, Date.now())
  }

  /**
   * End a performance timer and record metric
   */
  end(name: string, metadata?: Record<string, unknown>): number {
    const startTime = this.timers.get(name)
    if (!startTime) {
      logger.warn('Performance timer not found', { name })
      return 0
    }

    const duration = Date.now() - startTime
    this.timers.delete(name)

    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata
    }

    this.recordMetric(metric)
    return duration
  }

  /**
   * Measure async function performance
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    this.start(name)
    try {
      const result = await fn()
      const duration = this.end(name, { ...metadata, success: true })
      
      if (duration > 1000) {
        logger.warn('Slow operation detected', { name, duration, metadata })
      }
      
      return result
    } catch (error) {
      this.end(name, { ...metadata, success: false, error })
      throw error
    }
  }

  /**
   * Record a metric
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric)

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }

    // Log slow operations
    if (metric.duration > 1000) {
      logger.warn('Slow operation', {
        name: metric.name,
        duration: metric.duration,
        metadata: metric.metadata
      })
    } else {
      logger.debug('Performance metric', {
        name: metric.name,
        duration: metric.duration,
        metadata: metric.metadata
      })
    }
  }

  /**
   * Get metrics by name
   */
  getMetrics(name?: string): PerformanceMetric[] {
    if (!name) return this.metrics
    return this.metrics.filter(m => m.name === name)
  }

  /**
   * Get average duration for a metric
   */
  getAverage(name: string): number {
    const metrics = this.getMetrics(name)
    if (metrics.length === 0) return 0
    
    const total = metrics.reduce((sum, m) => sum + m.duration, 0)
    return total / metrics.length
  }

  /**
   * Get percentile duration for a metric
   */
  getPercentile(name: string, percentile: number): number {
    const metrics = this.getMetrics(name)
    if (metrics.length === 0) return 0

    const sorted = metrics.map(m => m.duration).sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[index] || 0
  }

  /**
   * Get performance summary
   */
  getSummary(name?: string): {
    count: number
    avg: number
    min: number
    max: number
    p50: number
    p95: number
    p99: number
  } {
    const metrics = name ? this.getMetrics(name) : this.metrics
    if (metrics.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 }
    }

    const durations = metrics.map(m => m.duration).sort((a, b) => a - b)
    const sum = durations.reduce((a, b) => a + b, 0)

    return {
      count: metrics.length,
      avg: sum / metrics.length,
      min: durations[0] || 0,
      max: durations[durations.length - 1] || 0,
      p50: durations[Math.floor(durations.length * 0.5)] || 0,
      p95: durations[Math.floor(durations.length * 0.95)] || 0,
      p99: durations[Math.floor(durations.length * 0.99)] || 0
    }
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = []
    this.timers.clear()
    logger.info('Performance metrics cleared')
  }

  /**
   * Get slow operations (> threshold ms)
   */
  getSlowOperations(threshold: number = 1000): PerformanceMetric[] {
    return this.metrics.filter(m => m.duration > threshold)
  }

  /**
   * Log performance report
   */
  logReport(name?: string): void {
    const summary = this.getSummary(name)
    logger.info('Performance Report', {
      name: name || 'all',
      ...summary
    })
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Helper composable for Vue components
export const usePerformance = () => {
  const measure = async <T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> => {
    return performanceMonitor.measure(name, fn, metadata)
  }

  const start = (name: string) => performanceMonitor.start(name)
  const end = (name: string, metadata?: Record<string, unknown>) => 
    performanceMonitor.end(name, metadata)

  return {
    measure,
    start,
    end,
    getSummary: (name?: string) => performanceMonitor.getSummary(name),
    getSlowOperations: (threshold?: number) => performanceMonitor.getSlowOperations(threshold)
  }
}
