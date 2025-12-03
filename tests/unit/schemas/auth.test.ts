import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema, changePasswordSchema } from '@/schemas/auth.schema'

describe('Auth Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      }
      const result = loginSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123'
      }
      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '12345'
      }
      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        fullName: 'Test User'
      }
      const result = registerSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject weak password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password',
        confirmPassword: 'password',
        fullName: 'Test User'
      }
      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject mismatched passwords', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!',
        fullName: 'Test User'
      }
      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('changePasswordSchema', () => {
    it('should validate correct password change data', () => {
      const validData = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      }
      const result = changePasswordSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject same current and new password', () => {
      const invalidData = {
        currentPassword: 'Password123!',
        newPassword: 'Password123!',
        confirmPassword: 'Password123!'
      }
      const result = changePasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})
