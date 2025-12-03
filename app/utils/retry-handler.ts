/**
 * Retry handler for failed requests
 * Implements exponential backoff strategy
 */

import { logger } from './logger'

export interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  retryableStatuses?: number[]
  shouldRetry?: (error: unknown) => boolean
  onRetry?: (attempt: number, delay: number) => void
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'shouldRetry' | 'onRetry'>> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504]
}

/**
 * Check if error is retryable
 */
function isRetryable(
  error: unknown,
  options: Required<Omit<RetryOptions, 'shouldRetry' | 'onRetry'>>,
  customShouldRetry?: (error: unknown) => boolean
): boolean {
  // Use custom shouldRetry if provided
  if (customShouldRetry) {
    return customShouldRetry(error)
  }
  
  if (error instanceof Response) {
    return options.retryableStatuses.includes(error.status)
  }
  
  if (error instanceof Error) {
    // Network errors are retryable (case-insensitive)
    const message = error.message.toLowerCase()
    if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
      return true
    }
  }
  
  return false
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(
  attempt: number,
  options: Required<Omit<RetryOptions, 'shouldRetry' | 'onRetry'>>
): number {
  const delay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt)
  return Math.min(delay, options.maxDelay)
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const { shouldRetry, onRetry } = options || {}
  let lastError: unknown

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry if not retryable or max retries reached
      if (!isRetryable(error, opts, shouldRetry) || attempt === opts.maxRetries) {
        throw error
      }

      const delay = calculateDelay(attempt, opts)
      
      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, delay)
      }
      
      logger.warn('Request failed, retrying', {
        attempt: attempt + 1,
        maxRetries: opts.maxRetries,
        delay,
        error: error instanceof Error ? error.message : String(error)
      })

      await sleep(delay)
    }
  }

  throw lastError
}

/**
 * Retry wrapper for fetch requests
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit & { retry?: RetryOptions }
): Promise<Response> {
  const { retry, ...fetchOptions } = options || {}
  
  return withRetry(
    async () => {
      const response = await fetch(url, fetchOptions)
      
      // Throw for retryable status codes
      if (!response.ok && retry?.retryableStatuses?.includes(response.status)) {
        throw response
      }
      
      return response
    },
    retry
  )
}
