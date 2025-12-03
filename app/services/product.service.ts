import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'
import type { ProductItem } from '@/composables/useProducts'

export interface WarehouseItem {
  id: number
  name: string
}

export interface ProductCategory {
  id: number
  name: string
  description: string
  sortOrder: number
  isDeleted: boolean
  parentId?: number
  categories: ProductCategory[]
  // Extended fields from detail endpoint envelope
  slug?: string
  metaTitle?: string | null
  metaKeywords?: string | null
  metaDescription?: string | null
  displayOrder?: number
  includeInMenu?: boolean
  isPublished?: boolean
  thumbnailImage?: string | null
  thumbnailImageUrl?: string | null
}

export interface CreateProductRequest {
  name: string
  description?: string
  content: string
  price?: number
  sku?: string
  categoryIds?: number[]
  imageUrls?: string[]
  isFeatured?: boolean
  isInStock?: boolean
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: number
}

export interface CreateProductCategoryRequest {
  name: string
  description: string
  parentId?: number
  sortOrder?: number
}

export interface UpdateProductCategoryRequest extends Partial<CreateProductCategoryRequest> {
  id: number
  slug?: string
  metaTitle?: string | null
  metaKeywords?: string | null
  metaDescription?: string | null
  displayOrder?: number
  includeInMenu?: boolean
  isPublished?: boolean
  thumbnailImage?: string | null
  thumbnailImageUrl?: string | null
}

export class ProductService extends BaseService {
  /**
   * Lấy danh sách kho (cached)
   */
  async getWarehouses() {
    return this.getCached<WarehouseItem[]>(API_ENDPOINTS.WAREHOUSES, {}, 5 * 60 * 1000) // Cache 5 minutes
  }

  /**
   * Get all products
   */
  async getProducts(options?: {
    search?: string
    categoryId?: number
    warehouseId?: number | string | null
    hasOptions?: boolean
    pagination?: { start: number, number: number }
    sort?: { field: string, reverse: boolean }
  }) {
    const searchObj: Record<string, unknown> = {
      Name: options?.search ?? null,
      CategoryId: options?.categoryId ?? null,
      WarehouseId: options?.warehouseId ?? null,
      // Luôn gửi HasOptions; mặc định true nếu không truyền vào để phù hợp yêu cầu
      HasOptions: typeof options?.hasOptions !== 'undefined' ? options.hasOptions : true
    }
    const body = this.createListRequestBody({
      pagination: options?.pagination,
      search: searchObj,
      sort: options?.sort
    })
    return this.post<{ items: ProductItem[], totalRecord: number, numberOfPages: number }>(API_ENDPOINTS.PRODUCTS, body)
  }

  /**
   * Get single product by ID (cached)
   */
  async getProductById(id: number) {
    return this.getCached<ProductItem>(API_ENDPOINTS.PRODUCT_BY_ID(id), {}, 2 * 60 * 1000) // Cache 2 minutes
  }

  /**
   * Create new product
   */
  async createProduct(data: CreateProductRequest) {
    const result = await this.post<ProductItem>(API_ENDPOINTS.PRODUCT_CREATE, data)
    // Auto-invalidate product cache
    this.invalidateCache('ProductService:GET:/products')
    this.invalidateCache('ProductService:GET:/product/')
    return result
  }

  /**
   * Update product
   */
  async updateProduct(data: UpdateProductRequest) {
    const result = await this.put<ProductItem>(API_ENDPOINTS.PRODUCT_UPDATE(data.id), data)
    // Auto-invalidate product cache
    this.invalidateCache('ProductService:GET:/products')
    this.invalidateCache(`ProductService:GET:/product/${data.id}`)
    return result
  }

  /**
   * Delete product
   */
  async deleteProduct(id: number) {
    const result = await this.delete(API_ENDPOINTS.PRODUCT_BY_ID(id))
    // Auto-invalidate product cache
    this.invalidateCache('ProductService:GET:/products')
    this.invalidateCache(`ProductService:GET:/product/${id}`)
    return result
  }

  /**
   * Batch delete products
   */
  async deleteProductsMulti(ids: number[]) {
    return this.post(API_ENDPOINTS.PRODUCT_DELETE_MULTI, ids)
  }

  /**
   * Quick create product (for AddProductModal)
   */
  async createQuickProduct(data: unknown) {
    return this.post<unknown>(API_ENDPOINTS.PRODUCT_QUICK_CREATE, data)
  }

  /**
   * Get all product categories
   */
  async getCategories(options?: {
    search?: string
    parentId?: number
    pagination?: { start: number, number: number }
    sort?: { field: string, reverse: boolean }
  }) {
    const body = this.createListRequestBody({
      pagination: options?.pagination,
      search: {
        Name: options?.search || null,
        ParentId: options?.parentId || null
      },
      sort: options?.sort
    })

    return this.post<ProductCategory[]>(API_ENDPOINTS.PRODUCT_CATEGORIES, body)
  }

  /**
   * Get single product category by ID (cached)
   */
  async getCategoryById(id: number) {
    // Prefer singular detail endpoint if available, fallback to plural.
    try {
      return await this.getCached<ProductCategory>(API_ENDPOINTS.PRODUCT_CATEGORY_DETAIL_BY_ID(id), {}, 5 * 60 * 1000)
    } catch {
      return this.getCached<ProductCategory>(API_ENDPOINTS.PRODUCT_CATEGORY_BY_ID(id), {}, 5 * 60 * 1000)
    }
  }

  /**
   * Create new product category
   */
  async createCategory(data: CreateProductCategoryRequest) {
    const result = await this.post<ProductCategory>(API_ENDPOINTS.PRODUCT_CATEGORIES, data)
    // Auto-invalidate category cache
    this.invalidateCache('ProductService:GET:/product-categories')
    return result
  }

  /**
   * Update product category
   */
  async updateCategory(data: UpdateProductCategoryRequest) {
    // Use explicit update endpoint per backend spec
    const result = await this.put<ProductCategory>(API_ENDPOINTS.PRODUCT_CATEGORY_UPDATE(data.id), data)
    // Auto-invalidate category cache
    this.invalidateCache('ProductService:GET:/product-categories')
    this.invalidateCache(`ProductService:GET:/product-category/${data.id}`)
    return result
  }

  /**
   * Delete product category
   */
  async deleteCategory(id: number) {
    const result = await this.delete(API_ENDPOINTS.PRODUCT_CATEGORY_BY_ID(id))
    // Auto-invalidate category cache
    this.invalidateCache('ProductService:GET:/product-categories')
    this.invalidateCache(`ProductService:GET:/product-category/${id}`)
    return result
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(categoryId: number, options?: {
    pagination?: { start: number, number: number }
    sort?: { field: string, reverse: boolean }
  }) {
    return this.getProducts({
      categoryId,
      pagination: options?.pagination,
      sort: options?.sort
    })
  }
}

// Export singleton instance
export const productService = new ProductService()
