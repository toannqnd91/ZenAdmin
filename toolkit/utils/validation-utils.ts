/**
 * Validation Utilities
 */

export function isEmail(value: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(value)
}

export function isUrl(value: string): boolean {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

export function isPhoneNumber(value: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/
  return phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10
}

export function isNumeric(value: string): boolean {
  return !isNaN(Number(value)) && !isNaN(parseFloat(value))
}

export function isInteger(value: string | number): boolean {
  return Number.isInteger(Number(value))
}

export function isPositive(value: number): boolean {
  return value > 0
}

export function isNegative(value: number): boolean {
  return value < 0
}

export function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}

export function minLength(value: string, min: number): boolean {
  return value.length >= min
}

export function maxLength(value: string, max: number): boolean {
  return value.length <= max
}

export function matches(value: string, pattern: RegExp): boolean {
  return pattern.test(value)
}

export function isRequired(value: any): boolean {
  if (value === null || value === undefined) {
    return false
  }
  if (typeof value === 'string') {
    return value.trim().length > 0
  }
  if (Array.isArray(value)) {
    return value.length > 0
  }
  return true
}

export function isDate(value: string): boolean {
  const date = new Date(value)
  return !isNaN(date.getTime())
}

export function isFutureDate(value: string): boolean {
  const date = new Date(value)
  return date.getTime() > Date.now()
}

export function isPastDate(value: string): boolean {
  const date = new Date(value)
  return date.getTime() < Date.now()
}

export function isAlpha(value: string): boolean {
  return /^[a-zA-Z]+$/.test(value)
}

export function isAlphanumeric(value: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(value)
}

export function isSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
}

export function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

export function isHexColor(value: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)
}

export function isJson(value: string): boolean {
  try {
    JSON.parse(value)
    return true
  } catch {
    return false
  }
}

export interface ValidationRule {
  validator: (value: any) => boolean
  message: string
}

export function validate(value: any, rules: ValidationRule[]): { valid: boolean, errors: string[] } {
  const errors: string[] = []
  
  for (const rule of rules) {
    if (!rule.validator(value)) {
      errors.push(rule.message)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
