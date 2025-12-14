import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'

export interface ARSummaryItem {
  objectType: 'Customer' | 'Supplier'
  objectId: number
  objectCode: string
  objectName: string
  phoneNumber: string | null
  openingBalance: number
  periodChange: number
  closingBalance: number
}

export interface ARSummaryResponse {
  success: boolean
  period: {
    fromDate: string
    toDate: string
  }
  summary: {
    totalReceivables: number
    totalPayables: number
    totalPeriodChange: number
  }
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
    hasPreviousPage: boolean
    hasNextPage: boolean
  }
  items: ARSummaryItem[]
}

export class ARService extends BaseService {
  async getSummary(params?: {
    objectType?: 'Customer' | 'Supplier'
    page?: number
    pageSize?: number
    fromDate?: string
    toDate?: string
    search?: string
    warehouseId?: number | string
  }) {
    const queryParams = new URLSearchParams()
    
    if (params?.objectType) queryParams.append('objectType', params.objectType)
    if (params?.page) queryParams.append('page', String(params.page))
    if (params?.pageSize) queryParams.append('pageSize', String(params.pageSize))
    if (params?.fromDate) queryParams.append('fromDate', params.fromDate)
    if (params?.toDate) queryParams.append('toDate', params.toDate)
    if (params?.search) queryParams.append('search', params.search)

    const endpoint = `${API_ENDPOINTS.AR_SUMMARY}?${queryParams.toString()}`
    
    const headers: Record<string, string> = {}
    if (params?.warehouseId) {
      headers['X-Warehouse-Id'] = String(params.warehouseId)
    }
    
    return this.request<ARSummaryResponse>(endpoint, {
      method: 'GET',
      headers
    })
  }
}

export const arService = new ARService()
