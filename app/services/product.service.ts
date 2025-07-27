import { BaseService } from './base.service'
import type { ProductItem } from '@/composables/useProducts'

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
   * Get all products
   */
  async getProducts(options?: {
    search?: string
    categoryId?: number
    pagination?: { start: number, number: number }
    sort?: { field: string, reverse: boolean }
  }) {
    const body = this.createListRequestBody({
      pagination: options?.pagination,
      search: {
        Name: options?.search || null,
        CategoryId: options?.categoryId || null
      },
      sort: options?.sort
    })
    
    return this.post<ProductItem[]>('/Products', body)
  }

  /**
   * Get single product by ID
   */
  async getProductById(id: number) {
    return this.get<ProductItem>(`/Products/${id}`)
  }

  /**
   * Create new product
   */
  async createProduct(data: CreateProductRequest) {
    return this.post<ProductItem>('/Products', data)
  }

  /**
   * Update product
   */
  async updateProduct(data: UpdateProductRequest) {
    return this.put<ProductItem>(`/Products/${data.id}`, data)
  }

  /**
   * Delete product
   */
  async deleteProduct(id: number) {
    return this.delete(`/Products/${id}`)
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
    
    return this.post<ProductCategory[]>('/ProductCategories', body)
  }

  /**
   * Get single product category by ID
   */
  async getCategoryById(id: number) {
    return this.get<ProductCategory>(`/ProductCategories/${id}`)
  }

  /**
   * Create new product category
   */
  async createCategory(data: CreateProductCategoryRequest) {
    return this.post<ProductCategory>('/ProductCategories', data)
  }

  /**
   * Update product category
   */
  async updateCategory(data: UpdateProductCategoryRequest) {
    return this.put<ProductCategory>(`/ProductCategories/${data.id}`, data)
  }

  /**
   * Delete product category
   */
  async deleteCategory(id: number) {
    return this.delete(`/ProductCategories/${id}`)
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
