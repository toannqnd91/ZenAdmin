/**
 * Security headers middleware
 * Adds security-related HTTP headers to all responses
 */

export default defineEventHandler((event) => {
  const headers = {
    // Prevent clickjacking
    'X-Frame-Options': 'SAMEORIGIN',
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Enable XSS protection
    'X-XSS-Protection': '1; mode=block',
    
    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions policy
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    
    // Content Security Policy (adjust as needed)
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Nuxt requires unsafe-inline/eval
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'self'"
    ].join('; ')
  }

  // Set all security headers
  for (const [key, value] of Object.entries(headers)) {
    setResponseHeader(event, key, value)
  }
})
