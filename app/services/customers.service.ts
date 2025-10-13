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

// External get-by-id response shape
export interface ExternalCustomerByIdResponse {
  code: string
  success: boolean
  message: string
  data: {
    id: string
    fullName: string
    email: string | null
    phoneNumber: string | null
    createdOn: string
    isActivated: boolean
    birthDate: string | null
    gender: number | null
    avatarUrl: string | null
    customerCode: string | null
    address: Array<{
      id: number
      addressLine1: string | null
      city: string | null
      stateOrProvinceId: number | null
      districtId: number | null
      wardId: number | null
      wardName: string | null
      districtName: string | null
      stateOrProvinceName: string | null
      countryName: string | null
      zipCode: string | null
      phoneNumber: string | null
      contactName: string | null
      isDefault: boolean
    }>
    groups: Array<{ groupId: number, name: string }>
    totalSales: number
    totalNetSales: number
    totalOrders: number
    totalAmount: number
    paid: number
    receivable: number
  } | null
}

// External groups list response item
export interface CustomerGroupItem {
  id: number
  name: string
  description: string | null
  isActive: boolean
  discountValue: number | null
  discountType: number | null
  ruleJson: string | null
  ruleMode: number
  autoRun: boolean
  createdOn: string
  latestUpdatedOn: string
}

// External customer orders list request/response
export interface CustomerOrdersListRequest {
  Pagination?: {
    Start: number
    TotalItemCount?: number
    Number: number
    NumberOfPages?: number
  }
  Search?: {
    QueryObject?: {
      Name?: string | null
    }
  }
  Sort?: {
    Field: string
    Reverse: boolean
  }
}

export interface CustomerOrderItem {
  id: number
  orderCode: string
  orderNumber: string
  createdOn: string
  orderStatus: number
  orderStatusText: string
  orderTotal: number
  paidAmount: number
  paymentStatus: string
  items: number
}

export interface CustomerOrdersListResponse {
  code: string
  success: boolean
  message: string
  data: {
    items: CustomerOrderItem[]
    totalRecord: number
    numberOfPages: number
  } | null
}

export class CustomersService extends BaseService {
  /** Create a new customer via external API */
  async createCustomer(data: CreateCustomerRequest) {
    return this.post<CreateCustomerResponse>(API_ENDPOINTS.CUSTOMER_CREATE_EXTERNAL, data)
  }

  /** Get customer by id via external API */
  async getCustomerByIdExternal(id: string) {
    // The external API already wraps the payload in our ApiResponse envelope,
    // so we should type T to the inner `data` shape, not the whole response.
    return this.get<ExternalCustomerByIdResponse['data']>(API_ENDPOINTS.CUSTOMER_BY_ID_EXTERNAL(id))
  }

  /** Get customer groups via external API */
  async getCustomerGroupsExternal() {
    return this.get<CustomerGroupItem[]>(API_ENDPOINTS.CUSTOMER_GROUPS_EXTERNAL)
  }

  /** Get recent orders for a customer via external API (POST) */
  async getCustomerOrdersExternal(id: string, body?: Partial<CustomerOrdersListRequest>) {
    const request: CustomerOrdersListRequest = {
      Pagination: {
        Start: body?.Pagination?.Start ?? 0,
        TotalItemCount: body?.Pagination?.TotalItemCount ?? 0,
        Number: body?.Pagination?.Number ?? 20,
        NumberOfPages: body?.Pagination?.NumberOfPages ?? 10
      },
      Search: {
        QueryObject: {
          Name: body?.Search?.QueryObject?.Name ?? null
        }
      },
      Sort: {
        Field: body?.Sort?.Field ?? 'Id',
        Reverse: body?.Sort?.Reverse ?? false
      }
    }
    return this.post<CustomerOrdersListResponse['data']>(API_ENDPOINTS.CUSTOMER_ORDERS_EXTERNAL(id), request)
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
    customerId: string
    customerCode: string
  } | null
}
