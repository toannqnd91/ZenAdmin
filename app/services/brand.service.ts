import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'

export interface Brand {
  id: number
  slug: string
  name: string
  isPublished: boolean
  logoUrl: string
}

export interface CreateBrandRequest {
  name: string
  slug?: string
  isPublished?: boolean
  logoUrl?: string
}

export interface UpdateBrandRequest extends Partial<CreateBrandRequest> {
  id: number
}

export class BrandService extends BaseService {
  /**
   * Get all brands (with filter, pagination, sort)
   */
  async getBrands(options?: {
    search?: string
    pagination?: { start: number, number: number }
    sort?: { field: string, reverse: boolean }
  }) {
    const searchObj: Record<string, unknown> = {
      Name: options?.search ?? null
    }
    const body = this.createListRequestBody({
      pagination: options?.pagination,
      search: searchObj,
      sort: options?.sort
    })
    return this.post<Brand[]>(API_ENDPOINTS.BRANDS, body)
  }

  /**
   * Get single brand by ID
   */
  async getBrandById(id: number) {
    return this.get<Brand>(API_ENDPOINTS.BRAND_BY_ID(id))
  }

  /**
   * Create new brand
   */
  async createBrand(data: CreateBrandRequest) {
    return this.post<Brand>(API_ENDPOINTS.BRANDS, data)
  }

  /**
   * Update brand
   */
  async updateBrand(data: UpdateBrandRequest) {
    return this.put<Brand>(API_ENDPOINTS.BRAND_BY_ID(data.id), data)
  }

  /**
   * Delete brand
   */
  async deleteBrand(id: number) {
    return this.delete(API_ENDPOINTS.BRAND_BY_ID(id))
  }
}

// Export singleton instance
export const brandService = new BrandService()
