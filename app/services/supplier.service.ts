import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'

export interface Supplier {
  id: number
  name: string
  slug: string
  phone?: string | null
  email?: string | null
  address?: string | null
  isPublished: boolean
  isDeleted: boolean
}

export interface SuppliersApiResponse {
  code: string
  success: boolean
  message: string
  data: {
    items: Supplier[]
    totalRecord: number
    numberOfPages: number
  }
}

export class SupplierService extends BaseService {
  /**
   * Get all suppliers
   */
  async getSuppliers(options?: {
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
    return this.post<SuppliersApiResponse>(API_ENDPOINTS.SUPPLIERS, body)
  }
}

export const supplierService = new SupplierService()
