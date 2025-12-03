/**
 * Rate limiting middleware
 * Prevents abuse by limiting requests per IP
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 100 // 100 requests per minute

export default defineEventHandler((event) => {
  // Skip rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return
  }

  // Get client IP
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  
  const now = Date.now()
  let entry = rateLimitStore.get(ip)

  // Clean up expired entries
  if (entry && now > entry.resetTime) {
    rateLimitStore.delete(ip)
    entry = undefined
  }

  // Initialize or increment counter
  if (!entry) {
    entry = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    }
    rateLimitStore.set(ip, entry)
  } else {
    entry.count++
  }

  // Check if rate limit exceeded
  if (entry.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    
    event.node.res.statusCode = 429
    event.node.res.statusMessage = 'Too Many Requests'
    setResponseHeader(event, 'Retry-After', retryAfter)
    setResponseHeader(event, 'X-RateLimit-Limit', String(MAX_REQUESTS))
    setResponseHeader(event, 'X-RateLimit-Remaining', '0')
    setResponseHeader(event, 'X-RateLimit-Reset', String(entry.resetTime))
    
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`
    })
  }

  // Set rate limit headers
  setResponseHeader(event, 'X-RateLimit-Limit', String(MAX_REQUESTS))
  setResponseHeader(event, 'X-RateLimit-Remaining', String(MAX_REQUESTS - entry.count))
  setResponseHeader(event, 'X-RateLimit-Reset', String(entry.resetTime))
})
