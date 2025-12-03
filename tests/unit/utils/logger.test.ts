import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logger, LogLevel } from '@/utils/logger'

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should log debug messages', () => {
    const consoleSpy = vi.spyOn(console, 'log')
    logger.debug('Test debug message', { userId: 123 })
    expect(consoleSpy).toHaveBeenCalled()
  })

  it('should log info messages', () => {
    const consoleSpy = vi.spyOn(console, 'log')
    logger.info('Test info message')
    expect(consoleSpy).toHaveBeenCalled()
  })

  it('should log error messages with context', () => {
    const consoleSpy = vi.spyOn(console, 'log')
    const error = new Error('Test error')
    logger.error('Test error message', { error, userId: 456 })
    expect(consoleSpy).toHaveBeenCalled()
  })

  it('should log API requests', () => {
    const consoleSpy = vi.spyOn(console, 'log')
    logger.logRequest('GET', '/api/products', 200, 150)
    expect(consoleSpy).toHaveBeenCalled()
  })

  it('should log API calls', () => {
    const consoleSpy = vi.spyOn(console, 'log')
    logger.logApiCall('/products', 'GET', true, 100)
    expect(consoleSpy).toHaveBeenCalled()
  })
})
