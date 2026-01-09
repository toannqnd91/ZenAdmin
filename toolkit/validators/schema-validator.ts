/**
 * Schema Validator using Zod
 */

import { z } from 'zod'

export const commonSchemas = {
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number'),
  url: z.string().url('Invalid URL'),
  uuid: z.string().uuid('Invalid UUID'),
  date: z.string().datetime('Invalid date'),
  positiveNumber: z.number().positive('Must be a positive number'),
  nonNegativeNumber: z.number().nonnegative('Must be a non-negative number'),
  integer: z.number().int('Must be an integer'),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  hexColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color'),
}

export function createPaginationSchema() {
  return z.object({
    start: z.number().int().nonnegative().default(0),
    number: z.number().int().positive().default(20),
    numberOfPages: z.number().int().positive().optional()
  })
}

export function createSearchSchema(fields: Record<string, z.ZodTypeAny>) {
  return z.object(fields).partial()
}

export function createSortSchema(allowedFields: string[]) {
  return z.object({
    field: z.enum(allowedFields as [string, ...string[]]),
    reverse: z.boolean().default(false)
  })
}

export function createListRequestSchema(options: {
  searchFields?: Record<string, z.ZodTypeAny>
  sortFields?: string[]
}) {
  return z.object({
    pagination: createPaginationSchema().optional(),
    search: options.searchFields ? createSearchSchema(options.searchFields).optional() : z.any().optional(),
    sort: options.sortFields ? createSortSchema(options.sortFields).optional() : z.any().optional()
  })
}

export function createIdParamSchema() {
  return z.union([z.string(), z.number().int().positive()])
}

export function createTimestampSchema() {
  return z.object({
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime().optional(),
    deletedAt: z.string().datetime().optional().nullable()
  })
}

export function createAuditSchema() {
  return z.object({
    createdBy: z.string().optional(),
    updatedBy: z.string().optional(),
    deletedBy: z.string().optional().nullable()
  }).merge(createTimestampSchema())
}

export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): { success: true, data: T } | { success: false, errors: z.ZodError } {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  return { success: false, errors: result.error }
}

export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {}
  
  error.errors.forEach(err => {
    const path = err.path.join('.')
    formatted[path] = err.message
  })
  
  return formatted
}

export class SchemaValidator<T> {
  constructor(private schema: z.ZodSchema<T>) {}

  validate(data: unknown): T {
    return this.schema.parse(data)
  }

  validateSafe(data: unknown): { success: true, data: T } | { success: false, errors: Record<string, string> } {
    const result = this.schema.safeParse(data)
    
    if (result.success) {
      return { success: true, data: result.data }
    }
    
    return { success: false, errors: formatZodErrors(result.error) }
  }

  validatePartial(data: unknown): Partial<T> {
    return this.schema.partial().parse(data)
  }

  extend<E extends z.ZodRawShape>(extension: E): SchemaValidator<T & z.infer<z.ZodObject<E>>> {
    if (this.schema instanceof z.ZodObject) {
      return new SchemaValidator(this.schema.extend(extension))
    }
    throw new Error('Can only extend ZodObject schemas')
  }
}
