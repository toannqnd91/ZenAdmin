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
  /** Create a new customer via external API */
  async createCustomer(data: CreateCustomerRequest) {
    return this.post<CreateCustomerResponse>(API_ENDPOINTS.CUSTOMER_CREATE_EXTERNAL, data)
  }

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

// Types for create customer
export interface CreateCustomerRequest {
  fullName: string
  email?: string | null
  phoneNumber?: string | null
  birthDate?: string | null
  gender?: number | null
  note?: string | null
  customerCode?: string | null
  customerGroupId?: number | null
  ownerUserId?: string | null
  tags?: string[]
  countryId?: string | null
  stateOrProvinceId?: number | null
  districtId?: number | null
  wardId?: number | null
  addressLine1?: string | null
  addressLine2?: string | null
  zipCode?: string | null
  contactName?: string | null
  avatarUrl?: string | null
}

export interface CreateCustomerResponse {
  code: string
  success: boolean
  message: string
  data: {
    id: number | string
  } | null
}
