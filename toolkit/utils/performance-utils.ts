/**
 * Performance Utilities
 */

export class PerformanceMonitor {
  private marks: Map<string, number> = new Map()
  private measures: Map<string, number[]> = new Map()

  mark(name: string): void {
    this.marks.set(name, performance.now())
  }

  measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark)
    if (!start) {
      throw new Error(`Start mark "${startMark}" not found`)
    }

    const end = endMark ? this.marks.get(endMark) : performance.now()
    if (endMark && !end) {
      throw new Error(`End mark "${endMark}" not found`)
    }

    const duration = (end as number) - start

    if (!this.measures.has(name)) {
      this.measures.set(name, [])
    }
    this.measures.get(name)!.push(duration)

    return duration
  }

  getMeasures(name: string): number[] {
    return this.measures.get(name) || []
  }

  getAverage(name: string): number {
    const measures = this.getMeasures(name)
    if (measures.length === 0) return 0
    return measures.reduce((a, b) => a + b, 0) / measures.length
  }

  getMin(name: string): number {
    const measures = this.getMeasures(name)
    if (measures.length === 0) return 0
    return Math.min(...measures)
  }

  getMax(name: string): number {
    const measures = this.getMeasures(name)
    if (measures.length === 0) return 0
    return Math.max(...measures)
  }

  getPercentile(name: string, percentile: number): number {
    const measures = this.getMeasures(name).sort((a, b) => a - b)
    if (measures.length === 0) return 0
    const index = Math.ceil((percentile / 100) * measures.length) - 1
    return measures[index]
  }

  clear(name?: string): void {
    if (name) {
      this.measures.delete(name)
      this.marks.delete(name)
    } else {
      this.measures.clear()
      this.marks.clear()
    }
  }

  getReport(name: string): {
    count: number
    average: number
    min: number
    max: number
    p50: number
    p95: number
    p99: number
  } {
    const measures = this.getMeasures(name)
    return {
      count: measures.length,
      average: this.getAverage(name),
      min: this.getMin(name),
      max: this.getMax(name),
      p50: this.getPercentile(name, 50),
      p95: this.getPercentile(name, 95),
      p99: this.getPercentile(name, 99)
    }
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startMark = `${name}-start-${Date.now()}`
    this.mark(startMark)
    
    try {
      const result = await fn()
      this.measure(name, startMark)
      return result
    } catch (error) {
      this.measure(name, startMark)
      throw error
    }
  }

  measureSync<T>(name: string, fn: () => T): T {
    const startMark = `${name}-start-${Date.now()}`
    this.mark(startMark)
    
    try {
      const result = fn()
      this.measure(name, startMark)
      return result
    } catch (error) {
      this.measure(name, startMark)
      throw error
    }
  }
}

export const performanceMonitor = new PerformanceMonitor()

export function measureTime(label: string): () => void {
  const start = performance.now()
  return () => {
    const end = performance.now()
    console.log(`[${label}] took ${(end - start).toFixed(2)}ms`)
  }
}

export async function measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now()
  try {
    const result = await fn()
    const end = performance.now()
    console.log(`[${label}] took ${(end - start).toFixed(2)}ms`)
    return result
  } catch (error) {
    const end = performance.now()
    console.log(`[${label}] failed after ${(end - start).toFixed(2)}ms`)
    throw error
  }
}

export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>()
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args)
    
    if (cache.has(key)) {
      return cache.get(key)
    }
    
    const result = fn(...args)
    cache.set(key, result)
    return result
  }) as T
}

export function once<T extends (...args: any[]) => any>(fn: T): T {
  let called = false
  let result: ReturnType<T>
  
  return ((...args: Parameters<T>) => {
    if (!called) {
      result = fn(...args)
      called = true
    }
    return result
  }) as T
}
