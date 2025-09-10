import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'
import type { ApiRequestBody } from '@/types/common'

export interface CustomerItem {
  id: string
  fullName: string
  email: string | null
  phoneNumber: string | null
  createdOn: string
  isActivated: boolean
  avatarUrl: string | null
  customerCode: string | null
  groups: unknown[]
  totalOrders: number
  totalAmount: number
  paid: number
  receivable: number
  totalSales: number
  totalNetSales: number
}

export interface CustomersGridResponse {
  items: CustomerItem[]
  totalRecord: number
  numberOfPages: number
  totalSalesAll: number
  totalNetSalesAll: number
}

export class CustomersService extends BaseService {
  /**
   * POST customers grid with pagination/search/sort
   */
  async getCustomers(options?: {
    pagination?: { start: number, number: number, numberOfPages?: number }
    search?: { name?: string | null, excludeGuests?: boolean }
    sort?: { field?: string, reverse?: boolean }
  }) {
    const body: ApiRequestBody = this.createListRequestBody({
      pagination: {
        start: options?.pagination?.start ?? 0,
        number: options?.pagination?.number ?? 20,
        numberOfPages: options?.pagination?.numberOfPages ?? 10
      },
      search: {
        Name: options?.search?.name ?? null,
        ExcludeGuests: options?.search?.excludeGuests ?? true
      },
      sort: {
        field: options?.sort?.field ?? 'Id',
        reverse: options?.sort?.reverse ?? false
      }
    })

    return this.post<CustomersGridResponse>(API_ENDPOINTS.CUSTOMERS_GRID, body)
  }
}

export const customersService = new CustomersService()
