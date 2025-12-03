/**
 * Input sanitization utilities
 * Prevents XSS and injection attacks
 */

/**
 * Sanitize HTML string
 * Removes potentially dangerous HTML tags and attributes
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ''

  // Remove script tags
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '')

  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '')

  return sanitized
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  if (!text) return ''

  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  }

  return text.replace(/[&<>"'/]/g, (char) => map[char] || char)
}

/**
 * Sanitize SQL input
 * Prevents SQL injection
 */
export function sanitizeSql(input: string): string {
  if (!input) return ''

  // Remove SQL keywords and special characters
  return input
    .replace(/['";\\]/g, '') // Remove quotes and backslashes
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove block comments
    .replace(/\*\//g, '')
    .trim()
}

/**
 * Sanitize file name
 * Removes path traversal attempts and special characters
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return ''

  return fileName
    .replace(/\.\./g, '') // Remove path traversal
    .replace(/[/\\]/g, '') // Remove path separators
    .replace(/[<>:"|?*]/g, '') // Remove invalid filename characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .trim()
}

/**
 * Sanitize URL
 * Validates and cleans URL input
 */
export function sanitizeUrl(url: string): string {
  if (!url) return ''

  // Remove javascript: and data: protocols
  if (url.match(/^(javascript|data|vbscript):/i)) {
    return ''
  }

  // Only allow http, https, and relative URLs
  if (!url.match(/^(https?:)?\/\//i) && !url.startsWith('/')) {
    return ''
  }

  return url.trim()
}

/**
 * Sanitize email
 * Basic email validation and sanitization
 */
export function sanitizeEmail(email: string): string {
  if (!email) return ''

  return email
    .toLowerCase()
    .trim()
    .replace(/[^\w@.+-]/g, '') // Only allow valid email characters
}

/**
 * Sanitize phone number
 * Removes non-numeric characters except +
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return ''

  return phone.replace(/[^\d+]/g, '')
}

/**
 * Sanitize object recursively
 * Applies sanitization to all string values in an object
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  sanitizer: (value: string) => string = escapeHtml
): T {
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizer(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string' ? sanitizer(item) :
        typeof item === 'object' && item !== null ? sanitizeObject(item as Record<string, unknown>, sanitizer) :
        item
      )
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>, sanitizer)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized as T
}

/**
 * Validate and sanitize JSON input
 */
export function sanitizeJson(jsonString: string): unknown | null {
  if (!jsonString) return null

  try {
    const parsed = JSON.parse(jsonString)
    
    // Recursively sanitize if it's an object
    if (typeof parsed === 'object' && parsed !== null) {
      return sanitizeObject(parsed as Record<string, unknown>)
    }
    
    return parsed
  } catch {
    return null
  }
}

/**
 * Remove null bytes (can be used for injection)
 */
export function removeNullBytes(input: string): string {
  if (!input) return ''
  return input.replace(/\0/g, '')
}

/**
 * Truncate string to max length
 */
export function truncate(input: string, maxLength: number): string {
  if (!input || input.length <= maxLength) return input
  return input.substring(0, maxLength)
}

/**
 * Comprehensive input sanitizer
 * Combines multiple sanitization techniques
 */
export function sanitizeInput(input: string, options?: {
  maxLength?: number
  allowHtml?: boolean
  type?: 'text' | 'email' | 'url' | 'phone' | 'filename'
}): string {
  if (!input) return ''

  let sanitized = removeNullBytes(input)

  // Apply type-specific sanitization
  switch (options?.type) {
    case 'email':
      sanitized = sanitizeEmail(sanitized)
      break
    case 'url':
      sanitized = sanitizeUrl(sanitized)
      break
    case 'phone':
      sanitized = sanitizePhone(sanitized)
      break
    case 'filename':
      sanitized = sanitizeFileName(sanitized)
      break
    default:
      sanitized = options?.allowHtml ? sanitizeHtml(sanitized) : escapeHtml(sanitized)
  }

  // Truncate if max length specified
  if (options?.maxLength) {
    sanitized = truncate(sanitized, options.maxLength)
  }

  return sanitized
}
