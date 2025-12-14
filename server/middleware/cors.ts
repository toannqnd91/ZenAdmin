/**
 * CORS middleware
 * Handles Cross-Origin Resource Sharing
 */

export default defineEventHandler((event) => {
  const origin = getRequestHeader(event, 'origin')
  
  // Allowed origins (configure based on environment)
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:7001',
    'https://localhost:7002',
    'https://web.vnnsoft.com'
  ]

  // Check if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    setResponseHeader(event, 'Access-Control-Allow-Origin', origin)
  }

  // Set CORS headers
  setResponseHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  setResponseHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization, WarehouseId')
  setResponseHeader(event, 'Access-Control-Allow-Credentials', 'true')
  setResponseHeader(event, 'Access-Control-Max-Age', 86400) // 24 hours

  // Handle preflight requests
  if (getMethod(event) === 'OPTIONS') {
    event.node.res.statusCode = 204
    event.node.res.statusMessage = 'No Content'
    return ''
  }
})
