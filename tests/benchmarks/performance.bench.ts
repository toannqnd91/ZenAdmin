import { bench, describe } from 'vitest'
import { apiCache } from '@/utils/cache-manager'
import { withRetry } from '@/utils/retry-handler'
import { sanitizeInput, sanitizeObject } from '@/utils/sanitizer'

/**
 * Performance benchmarks
 * Run with: npm run test:bench
 */

describe('Cache Performance', () => {
  bench('cache set operation', () => {
    apiCache.set('bench-key', { data: 'test' })
  })

  bench('cache get operation (hit)', () => {
    apiCache.set('bench-key', { data: 'test' })
    apiCache.get('bench-key')
  })

  bench('cache get operation (miss)', () => {
    apiCache.get('non-existent-key')
  })

  bench('cache invalidate pattern', () => {
    for (let i = 0; i < 100; i++) {
      apiCache.set(`test:${i}`, { data: i })
    }
    apiCache.invalidatePattern('test:')
  })
})

describe('Retry Handler Performance', () => {
  bench('successful operation (no retry)', async () => {
    await withRetry(async () => 'success', { maxRetries: 3, initialDelay: 1 })
  })

  bench('failed operation with retries', async () => {
    let attempts = 0
    await withRetry(
      async () => {
        attempts++
        if (attempts < 3) throw new Error('Network error')
        return 'success'
      },
      { maxRetries: 3, initialDelay: 1 }
    )
  })
})

describe('Sanitizer Performance', () => {
  const testString = '<script>alert("xss")</script>Hello <b>World</b>!'
  const testObject = {
    name: '<script>alert("xss")</script>John',
    email: 'test@example.com',
    nested: {
      value: '<b>Bold</b> text',
      array: ['<i>item1</i>', '<i>item2</i>']
    }
  }

  bench('sanitize simple string', () => {
    sanitizeInput(testString)
  })

  bench('sanitize HTML string', () => {
    sanitizeInput(testString, { allowHtml: true })
  })

  bench('sanitize email', () => {
    sanitizeInput('TEST@EXAMPLE.COM', { type: 'email' })
  })

  bench('sanitize URL', () => {
    sanitizeInput('https://example.com/path?query=value', { type: 'url' })
  })

  bench('sanitize object (shallow)', () => {
    sanitizeObject({ name: testString, email: 'test@example.com' })
  })

  bench('sanitize object (deep)', () => {
    sanitizeObject(testObject)
  })
})

describe('Validation Performance', () => {
  bench('email validation (valid)', () => {
    const email = 'test@example.com'
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    regex.test(email)
  })

  bench('email validation (invalid)', () => {
    const email = 'invalid-email'
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    regex.test(email)
  })

  bench('URL validation', () => {
    const url = 'https://example.com/path'
    const regex = /^https?:\/\/.+/
    regex.test(url)
  })

  bench('phone validation', () => {
    const phone = '+1234567890'
    const regex = /^\+?\d{10,15}$/
    regex.test(phone)
  })
})

describe('Array Operations', () => {
  const largeArray = Array.from({ length: 10000 }, (_, i) => ({ id: i, name: `Item ${i}` }))

  bench('filter array', () => {
    largeArray.filter(item => item.id % 2 === 0)
  })

  bench('map array', () => {
    largeArray.map(item => ({ ...item, processed: true }))
  })

  bench('reduce array', () => {
    largeArray.reduce((acc, item) => acc + item.id, 0)
  })

  bench('find in array', () => {
    largeArray.find(item => item.id === 5000)
  })
})

describe('Object Operations', () => {
  const largeObject = Object.fromEntries(
    Array.from({ length: 1000 }, (_, i) => [`key${i}`, `value${i}`])
  )

  bench('Object.keys', () => {
    Object.keys(largeObject)
  })

  bench('Object.values', () => {
    Object.values(largeObject)
  })

  bench('Object.entries', () => {
    Object.entries(largeObject)
  })

  bench('spread operator', () => {
    ({ ...largeObject })
  })

  bench('Object.assign', () => {
    Object.assign({}, largeObject)
  })
})
