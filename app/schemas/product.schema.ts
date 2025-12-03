import { z } from 'zod'

/**
 * Product validation schemas
 */

export const productSchema = z.object({
  name: z
    .string()
    .min(1, 'Tên sản phẩm là bắt buộc')
    .max(500, 'Tên sản phẩm quá dài'),
  code: z
    .string()
    .min(1, 'Mã sản phẩm là bắt buộc')
    .max(100, 'Mã sản phẩm quá dài')
    .regex(/^[A-Z0-9-_]+$/, 'Mã sản phẩm chỉ được chứa chữ hoa, số, dấu gạch ngang và gạch dưới'),
  description: z
    .string()
    .max(2000, 'Mô tả quá dài')
    .optional(),
  price: z
    .number()
    .min(0, 'Giá phải lớn hơn hoặc bằng 0')
    .max(999999999, 'Giá quá lớn'),
  comparePrice: z
    .number()
    .min(0, 'Giá so sánh phải lớn hơn hoặc bằng 0')
    .max(999999999, 'Giá so sánh quá lớn')
    .optional()
    .nullable(),
  costPrice: z
    .number()
    .min(0, 'Giá vốn phải lớn hơn hoặc bằng 0')
    .max(999999999, 'Giá vốn quá lớn')
    .optional()
    .nullable(),
  categoryId: z
    .number()
    .int('Category ID phải là số nguyên')
    .positive('Category ID phải là số dương')
    .optional()
    .nullable(),
  brandId: z
    .number()
    .int('Brand ID phải là số nguyên')
    .positive('Brand ID phải là số dương')
    .optional()
    .nullable(),
  sku: z
    .string()
    .max(100, 'SKU quá dài')
    .optional(),
  barcode: z
    .string()
    .max(100, 'Barcode quá dài')
    .optional(),
  weight: z
    .number()
    .min(0, 'Trọng lượng phải lớn hơn hoặc bằng 0')
    .optional()
    .nullable(),
  unit: z
    .string()
    .max(50, 'Đơn vị quá dài')
    .optional(),
  images: z
    .array(z.string().url('URL hình ảnh không hợp lệ'))
    .max(10, 'Tối đa 10 hình ảnh')
    .optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  tags: z
    .array(z.string().max(50, 'Tag quá dài'))
    .max(20, 'Tối đa 20 tags')
    .optional()
}).refine((data) => {
  if (data.comparePrice && data.price) {
    return data.comparePrice >= data.price
  }
  return true
}, {
  message: 'Giá so sánh phải lớn hơn hoặc bằng giá bán',
  path: ['comparePrice']
})

export const productCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Tên danh mục là bắt buộc')
    .max(255, 'Tên danh mục quá dài'),
  slug: z
    .string()
    .min(1, 'Slug là bắt buộc')
    .max(255, 'Slug quá dài')
    .regex(/^[a-z0-9-]+$/, 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang'),
  description: z
    .string()
    .max(1000, 'Mô tả quá dài')
    .optional(),
  parentId: z
    .number()
    .int('Parent ID phải là số nguyên')
    .positive('Parent ID phải là số dương')
    .optional()
    .nullable(),
  image: z
    .string()
    .url('URL hình ảnh không hợp lệ')
    .optional()
    .nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z
    .number()
    .int('Thứ tự sắp xếp phải là số nguyên')
    .min(0, 'Thứ tự sắp xếp phải lớn hơn hoặc bằng 0')
    .default(0)
})

export type ProductInput = z.infer<typeof productSchema>
export type ProductCategoryInput = z.infer<typeof productCategorySchema>
