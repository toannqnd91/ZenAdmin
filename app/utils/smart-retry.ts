/**
 * Smart Retry - Adaptive retry with circuit breaker
 */

import { withRetry, type RetryOptions } from './retry-handler'
import { logger } from './logger'

interface CircuitBreakerState {
  failures: number
  lastFailureTime: number
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
}

class SmartRetry {
  private circuits: Map<string, CircuitBreakerState> = new Map()
  private readonly failureThreshold = 5
  private readonly resetTimeout = 60000 // 1 minute

  /**
   * Execute with smart retry and circuit breaker
   */
  async execute<T>(
    key: string,
    fn: () => Promise<T>,
    options?: RetryOptions
  ): Promise<T> {
    const circuit = this.getCircuit(key)

    // Check circuit breaker state
    if (circuit.state === 'OPEN') {
      const timeSinceFailure = Date.now() - circuit.lastFailureTime
      
      if (timeSinceFailure < this.resetTimeout) {
        throw new Error(`Circuit breaker OPEN for ${key}. Try again in ${Math.ceil((this.resetTimeout - timeSinceFailure) / 1000)}s`)
      }
      
      // Try half-open state
      circuit.state = 'HALF_OPEN'
      logger.info('Circuit breaker HALF_OPEN', { key })
    }

    try {
      const result = await withRetry(fn, {
        ...options,
        onRetry: (attempt, delay) => {
          logger.warn('Smart retry attempt', { key, attempt, delay })
          options?.onRetry?.(attempt, delay)
        }
      })

      // Success - reset circuit breaker
      if (circuit.state === 'HALF_OPEN') {
        circuit.state = 'CLOSED'
        circuit.failures = 0
        logger.info('Circuit breaker CLOSED', { key })
      }

      return result
    } catch (error) {
      // Failure - update circuit breaker
      circuit.failures++
      circuit.lastFailureTime = Date.now()

      if (circuit.failures >= this.failureThreshold) {
        circuit.state = 'OPEN'
        logger.error('Circuit breaker OPEN', { 
          key, 
          failures: circuit.failures 
        })
      }

      throw error
    }
  }

  /**
   * Get or create circuit breaker for key
   */
  private getCircuit(key: string): CircuitBreakerState {
    if (!this.circuits.has(key)) {
      this.circuits.set(key, {
        failures: 0,
        lastFailureTime: 0,
        state: 'CLOSED'
      })
    }
    return this.circuits.get(key)!
  }

  /**
   * Get circuit breaker stats
   */
  getStats() {
    const stats: Record<string, any> = {}
    
    for (const [key, circuit] of this.circuits.entries()) {
      stats[key] = {
        state: circuit.state,
        failures: circuit.failures,
        lastFailure: circuit.lastFailureTime 
          ? new Date(circuit.lastFailureTime).toISOString()
          : null
      }
    }

    return stats
  }

  /**
   * Reset circuit breaker
   */
  reset(key: string) {
    const circuit = this.circuits.get(key)
    if (circuit) {
      circuit.state = 'CLOSED'
      circuit.failures = 0
      circuit.lastFailureTime = 0
      logger.info('Circuit breaker manually reset', { key })
    }
  }

  /**
   * Reset all circuit breakers
   */
  resetAll() {
    for (const key of this.circuits.keys()) {
      this.reset(key)
    }
  }
}

export const smartRetry = new SmartRetry()
