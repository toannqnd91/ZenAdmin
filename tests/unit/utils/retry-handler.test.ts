import { describe, it, expect, vi } from 'vitest'
import { withRetry } from '@/utils/retry-handler'

describe('RetryHandler', () => {
  it('should succeed on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success')
    const result = await withRetry(fn, { maxRetries: 3, initialDelay: 100 })
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should retry on failure and eventually succeed', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue('success')

    const result = await withRetry(fn, { maxRetries: 3, initialDelay: 100 })
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('should throw after max retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Network error'))

    await expect(
      withRetry(fn, { maxRetries: 2, initialDelay: 100 })
    ).rejects.toThrow('Network error')
    expect(fn).toHaveBeenCalledTimes(3) // Initial + 2 retries
  })

  it('should not retry non-retryable errors', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Validation error'))

    await expect(
      withRetry(fn, { maxRetries: 3, initialDelay: 100, shouldRetry: (err) => !err.message.includes('Validation') })
    ).rejects.toThrow('Validation error')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should use exponential backoff', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue('success')

    const delays: number[] = []
    const startTime = Date.now()

    await withRetry(fn, {
      maxRetries: 3,
      initialDelay: 100,
      backoffMultiplier: 2,
      onRetry: (_, delay) => {
        delays.push(delay)
      }
    })

    expect(delays.length).toBe(2)
    expect(delays[0]).toBeGreaterThanOrEqual(100)
    expect(delays[1]).toBeGreaterThanOrEqual(200)
  })
})
