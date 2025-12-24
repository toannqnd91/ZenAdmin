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


export interface CustomerPayment {
  id: number
  paymentNumber: string
  amount: number
  paymentDate: string
  paymentMethod: string
  referenceNumber: string
  note: string
  customer: {
    id: number
    name: string
    customerCode: string
  }
  accountReceivable: {
    id: number
    arNumber: string
    orderCode: string
    originalAmount: number
    remainingAmount: number
  }
}

export interface CustomerPaymentResponse {
  success: boolean
  summary: {
    totalPayments: number
    totalAmount: number
  }
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
    hasPreviousPage: boolean
    hasNextPage: boolean
  }
  payments: CustomerPayment[]
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

  async getPayments(params?: {
    customerId?: number | string
    page?: number
    pageSize?: number
    fromDate?: string
    toDate?: string
    warehouseId?: number | string
  }) {
    const queryParams = new URLSearchParams()
    if (params?.customerId) queryParams.append('customerId', String(params.customerId))
    if (params?.page) queryParams.append('page', String(params.page))
    if (params?.pageSize) queryParams.append('pageSize', String(params.pageSize))
    if (params?.fromDate) queryParams.append('fromDate', params.fromDate)
    if (params?.toDate) queryParams.append('toDate', params.toDate)

    const endpoint = `${API_ENDPOINTS.AR_PAYMENTS}?${queryParams.toString()}`

    const headers: Record<string, string> = {}
    if (params?.warehouseId) {
      headers['X-Warehouse-Id'] = String(params.warehouseId)
    }

    return this.request<CustomerPaymentResponse>(endpoint, {
      method: 'GET',
      headers
    })
  }

  async adjustDebt(customerId: string | number, payload: { newBalance: number, note: string }) {
    return this.post(API_ENDPOINTS.CUSTOMER_ADJUST_DEBT(customerId), payload)
  }
}

export const arService = new ARService()
