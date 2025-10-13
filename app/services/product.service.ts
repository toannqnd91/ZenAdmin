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
}

export class ProductService extends BaseService {
  /**
   * Lấy danh sách kho
   */
  async getWarehouses() {
    return this.get<WarehouseItem[]>(API_ENDPOINTS.WAREHOUSES)
  }

  /**
   * Get all products
   */
  async getProducts(options?: {
    search?: string
    categoryId?: number
    hasOptions?: boolean
    pagination?: { start: number, number: number }
    sort?: { field: string, reverse: boolean }
  }) {
    const searchObj: Record<string, unknown> = {
      Name: options?.search ?? null,
      CategoryId: options?.categoryId ?? null,
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
   * Get single product by ID
   */
  async getProductById(id: number) {
    return this.get<ProductItem>(API_ENDPOINTS.PRODUCT_BY_ID(id))
  }

  /**
   * Create new product
   */
  async createProduct(data: CreateProductRequest) {
    return this.post<ProductItem>(API_ENDPOINTS.PRODUCT_CREATE, data)
  }

  /**
   * Update product
   */
  async updateProduct(data: UpdateProductRequest) {
    return this.put<ProductItem>(API_ENDPOINTS.PRODUCT_UPDATE(data.id), data)
  }

  /**
   * Delete product
   */
  async deleteProduct(id: number) {
    return this.delete(API_ENDPOINTS.PRODUCT_BY_ID(id))
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
  async createQuickProduct(data: any) {
    return this.post<any>(API_ENDPOINTS.PRODUCT_QUICK_CREATE, data)
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
   * Get single product category by ID
   */
  async getCategoryById(id: number) {
    return this.get<ProductCategory>(API_ENDPOINTS.PRODUCT_CATEGORY_BY_ID(id))
  }

  /**
   * Create new product category
   */
  async createCategory(data: CreateProductCategoryRequest) {
    return this.post<ProductCategory>(API_ENDPOINTS.PRODUCT_CATEGORIES, data)
  }

  /**
   * Update product category
   */
  async updateCategory(data: UpdateProductCategoryRequest) {
    return this.put<ProductCategory>(API_ENDPOINTS.PRODUCT_CATEGORY_BY_ID(data.id), data)
  }

  /**
   * Delete product category
   */
  async deleteCategory(id: number) {
    return this.delete(API_ENDPOINTS.PRODUCT_CATEGORY_BY_ID(id))
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
