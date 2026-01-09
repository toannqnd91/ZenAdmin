/**
 * Form Validator
 */

export interface ValidationRule {
  type: 'required' | 'email' | 'phone' | 'url' | 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern' | 'custom'
  value?: any
  message: string
  validator?: (value: any) => boolean
}

export interface FieldValidation {
  field: string
  rules: ValidationRule[]
}

export interface ValidationResult {
  valid: boolean
  errors: Record<string, string[]>
}

export class FormValidator {
  private validations: Map<string, ValidationRule[]> = new Map()

  addField(field: string, rules: ValidationRule[]): this {
    this.validations.set(field, rules)
    return this
  }

  removeField(field: string): this {
    this.validations.delete(field)
    return this
  }

  validate(data: Record<string, any>): ValidationResult {
    const errors: Record<string, string[]> = {}

    for (const [field, rules] of this.validations.entries()) {
      const value = data[field]
      const fieldErrors: string[] = []

      for (const rule of rules) {
        if (!this.validateRule(value, rule)) {
          fieldErrors.push(rule.message)
        }
      }

      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    }
  }

  validateField(field: string, value: any): { valid: boolean, errors: string[] } {
    const rules = this.validations.get(field)
    if (!rules) {
      return { valid: true, errors: [] }
    }

    const errors: string[] = []

    for (const rule of rules) {
      if (!this.validateRule(value, rule)) {
        errors.push(rule.message)
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  private validateRule(value: any, rule: ValidationRule): boolean {
    switch (rule.type) {
      case 'required':
        return this.isRequired(value)
      
      case 'email':
        return this.isEmail(value)
      
      case 'phone':
        return this.isPhone(value)
      
      case 'url':
        return this.isUrl(value)
      
      case 'min':
        return Number(value) >= rule.value
      
      case 'max':
        return Number(value) <= rule.value
      
      case 'minLength':
        return String(value).length >= rule.value
      
      case 'maxLength':
        return String(value).length <= rule.value
      
      case 'pattern':
        return new RegExp(rule.value).test(String(value))
      
      case 'custom':
        return rule.validator ? rule.validator(value) : true
      
      default:
        return true
    }
  }

  private isRequired(value: any): boolean {
    if (value === null || value === undefined) return false
    if (typeof value === 'string') return value.trim().length > 0
    if (Array.isArray(value)) return value.length > 0
    return true
  }

  private isEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
  }

  private isPhone(value: string): boolean {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/
    return phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10
  }

  private isUrl(value: string): boolean {
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  }
}

export function createFormValidator(validations: FieldValidation[]): FormValidator {
  const validator = new FormValidator()
  
  validations.forEach(({ field, rules }) => {
    validator.addField(field, rules)
  })
  
  return validator
}

export const commonValidationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    type: 'required',
    message
  }),
  
  email: (message = 'Invalid email address'): ValidationRule => ({
    type: 'email',
    message
  }),
  
  phone: (message = 'Invalid phone number'): ValidationRule => ({
    type: 'phone',
    message
  }),
  
  url: (message = 'Invalid URL'): ValidationRule => ({
    type: 'url',
    message
  }),
  
  min: (value: number, message?: string): ValidationRule => ({
    type: 'min',
    value,
    message: message || `Must be at least ${value}`
  }),
  
  max: (value: number, message?: string): ValidationRule => ({
    type: 'max',
    value,
    message: message || `Must be at most ${value}`
  }),
  
  minLength: (value: number, message?: string): ValidationRule => ({
    type: 'minLength',
    value,
    message: message || `Must be at least ${value} characters`
  }),
  
  maxLength: (value: number, message?: string): ValidationRule => ({
    type: 'maxLength',
    value,
    message: message || `Must be at most ${value} characters`
  }),
  
  pattern: (value: string | RegExp, message = 'Invalid format'): ValidationRule => ({
    type: 'pattern',
    value: value instanceof RegExp ? value.source : value,
    message
  }),
  
  custom: (validator: (value: any) => boolean, message = 'Invalid value'): ValidationRule => ({
    type: 'custom',
    validator,
    message
  })
}
