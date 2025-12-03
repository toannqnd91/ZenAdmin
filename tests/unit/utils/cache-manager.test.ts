import { describe, it, expect, beforeEach, vi } from 'vitest'
import { apiCache } from '@/utils/cache-manager'

describe('CacheManager', () => {
  beforeEach(() => {
    apiCache.clear()
  })

  it('should store and retrieve values', () => {
    apiCache.set('test-key', { data: 'test-value' })
    const result = apiCache.get('test-key')
    expect(result).toEqual({ data: 'test-value' })
  })

  it('should return null for non-existent keys', () => {
    const result = apiCache.get('non-existent')
    expect(result).toBeNull()
  })

  it('should expire values after TTL', async () => {
    apiCache.set('test-key', 'test-value', 100) // 100ms TTL
    expect(apiCache.get('test-key')).toBe('test-value')
    
    await new Promise(resolve => setTimeout(resolve, 150))
    expect(apiCache.get('test-key')).toBeNull()
  })

  it('should delete values', () => {
    apiCache.set('test-key', 'test-value')
    expect(apiCache.has('test-key')).toBe(true)
    
    apiCache.delete('test-key')
    expect(apiCache.has('test-key')).toBe(false)
  })

  it('should clear all cache', () => {
    apiCache.set('key1', 'value1')
    apiCache.set('key2', 'value2')
    
    apiCache.clear()
    expect(apiCache.get('key1')).toBeNull()
    expect(apiCache.get('key2')).toBeNull()
  })

  it('should use getOrSet pattern', async () => {
    const fetcher = vi.fn().mockResolvedValue('fetched-value')
    
    const result1 = await apiCache.getOrSet('test-key', fetcher)
    expect(result1).toBe('fetched-value')
    expect(fetcher).toHaveBeenCalledTimes(1)
    
    const result2 = await apiCache.getOrSet('test-key', fetcher)
    expect(result2).toBe('fetched-value')
    expect(fetcher).toHaveBeenCalledTimes(1) // Should not call fetcher again
  })

  it('should invalidate by pattern', () => {
    apiCache.set('user:1', 'value1')
    apiCache.set('user:2', 'value2')
    apiCache.set('product:1', 'value3')
    
    const count = apiCache.invalidatePattern('user:')
    expect(count).toBe(2)
    expect(apiCache.get('user:1')).toBeNull()
    expect(apiCache.get('user:2')).toBeNull()
    expect(apiCache.get('product:1')).toBe('value3')
  })

  it('should track cache statistics', () => {
    apiCache.set('key1', 'value1')
    apiCache.get('key1') // hit
    apiCache.get('key2') // miss
    
    const stats = apiCache.getStats()
    expect(stats.hits).toBe(1)
    expect(stats.misses).toBe(1)
    expect(stats.hitRate).toBe(50)
  })
})
