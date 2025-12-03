import { z } from 'zod'

/**
 * Common validation schemas
 */

export const paginationSchema = z.object({
  start: z.number().int().min(0).default(0),
  number: z.number().int().min(1).max(100).default(20),
  numberOfPages: z.number().int().min(1).default(10)
})

export const sortSchema = z.object({
  field: z.string().min(1),
  reverse: z.boolean().default(false)
})

export const searchSchema = z.object({
  query: z.string().max(500).optional(),
  filters: z.record(z.unknown()).optional()
})

export const idSchema = z.object({
  id: z.number().int().positive('ID phải là số dương')
})

export const slugSchema = z.object({
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, 'Slug không hợp lệ')
})

export const emailSchema = z.object({
  email: z.string().email('Email không hợp lệ')
})

export const phoneSchema = z.object({
  phone: z.string().regex(/^[0-9]{10,11}$/, 'Số điện thoại phải có 10-11 chữ số')
})

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date())
}).refine((data) => {
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  return start <= end
}, {
  message: 'Ngày bắt đầu phải trước ngày kết thúc',
  path: ['endDate']
})

export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  maxSize: z.number().int().positive().default(5 * 1024 * 1024), // 5MB
  allowedTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/webp'])
}).refine((data) => {
  return data.file.size <= data.maxSize
}, {
  message: 'File quá lớn',
  path: ['file']
}).refine((data) => {
  return data.allowedTypes.includes(data.file.type)
}, {
  message: 'Loại file không được hỗ trợ',
  path: ['file']
})

export type PaginationInput = z.infer<typeof paginationSchema>
export type SortInput = z.infer<typeof sortSchema>
export type SearchInput = z.infer<typeof searchSchema>
export type IdInput = z.infer<typeof idSchema>
export type SlugInput = z.infer<typeof slugSchema>
export type EmailInput = z.infer<typeof emailSchema>
export type PhoneInput = z.infer<typeof phoneSchema>
export type DateRangeInput = z.infer<typeof dateRangeSchema>
export type FileUploadInput = z.infer<typeof fileUploadSchema>
