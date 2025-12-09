import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'

export interface Supplier {
  id: number
  code: string
  name: string
  slug: string
  phone?: string | null
  email?: string | null
  address?: string | null
  isPublished: boolean
  isDeleted: boolean
  debtBalance: number
  totalPurchase: number
  netPurchase: number
  status?: string | null
  statusEnum?: number
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

export interface CreateSupplierRequest {
  name: string
  code: string | null
  phoneCountryCode: string | null
  phone: string | null
  email: string | null
  address: string | null
  country: string | null
  region: string | null
  provinceId: number | null
  wardId: number | null
  taxCode: string | null
  website: string | null
  fax: string | null
  status: string | null
}

export interface CreateSupplierResponse {
  id: number
  code: string
}

export interface UpdateSupplierRequest {
  name: string
  code: string | null
  slug: string | null
  phoneCountryCode: string | null
  phone: string | null
  email: string | null
  address: string | null
  country: string | null
  region: string | null
  provinceId: number | null
  wardId: number | null
  taxCode: string | null
  website: string | null
  fax: string | null
  status: string | null
}

export interface SupplierByIdData {
  id: number
  code: string
  isDeleted: boolean
  statusEnum: number
  provinceId: number | null
  name: string
  slug: string | null
  phoneCountryCode: string | null
  phone: string | null
  email: string | null
  address: string | null
  country: string | null
  region: string | null
  wardId: number | null
  taxCode: string | null
  website: string | null
  fax: string | null
  status: string | null
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

  /** Get supplier detail by id */
  async getSupplierById(id: number | string) {
    return this.get<SupplierByIdData>(API_ENDPOINTS.SUPPLIER_BY_ID(id))
  }

  /**
   * Create a new supplier
   */
  async createSupplier(payload: CreateSupplierRequest) {
    return this.post<CreateSupplierResponse>(API_ENDPOINTS.SUPPLIER_CREATE, payload)
  }

  /**
   * Update supplier by id
   */
  async updateSupplier(id: number | string, payload: UpdateSupplierRequest) {
    return this.put(API_ENDPOINTS.SUPPLIER_BY_ID(id), payload)
  }

  /**
   * Import suppliers from Excel file
   */
  async importExcel(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return this.request<{ jobId: string }>(API_ENDPOINTS.SUPPLIER_IMPORT_EXCEL, {
      method: 'POST',
      body: formData
    })
  }
}

export const supplierService = new SupplierService()
