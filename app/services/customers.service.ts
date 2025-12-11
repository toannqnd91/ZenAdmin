import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'
import type { ApiRequestBody } from '@/types/common'

export interface CustomerItem {
  id: number
  customerCode: string | null
  name: string
  email: string | null
  phoneNumber: string | null
  dateOfBirth: string | null
  gender: string | null
  customerGroupId: number | null
  isActive: boolean
  createdAt: string
  createdBy: string
  currentReceivables: number
  totalSales: number
  netSales: number
  // Legacy fields for backward compatibility
  totalOrders?: number | null
  totalSpent?: number | null
  debt?: number | null
  fullName?: string
  avatarUrl?: string | null
  receivable?: number
  totalNetSales?: number
}

export interface CustomersGridResponse {
  numberOfRecords: number
  numberOfPages: number
  data: CustomerItem[]
  // Legacy fields for backward compatibility
  totalCurrentReceivables?: number
  totalSales?: number
  totalNetSales?: number
  items?: CustomerItem[]
  totalRecord?: number
  totalSalesAll?: number
  totalNetSalesAll?: number
}

// External get-by-id response shape
export interface ExternalCustomerByIdResponse {
  code: string
  success: boolean
  message: string
  data: {
    id: number | string
    name?: string | null
    fullName?: string | null
    email: string | null
    phoneNumber: string | null
    createdOn: string
    isActivated: boolean
    birthDate: string | null
    gender: number | null
    avatarUrl: string | null
    customerCode: string | null
    note?: string | null
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
    totalSales?: number
    totalNetSales?: number
    totalOrders?: number
    totalAmount?: number
    paid?: number
    receivable?: number
    currentReceivables?: number
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

// Cached result type for customers grid
export type CustomersCachedResult = {
  data: CustomersGridResponse
  fromCache: boolean
  refreshPromise?: Promise<boolean>
}

export class CustomersService extends BaseService {
  private _cache: Record<string, { data: CustomersGridResponse, checksum: string, ts: number }> = {}
  private _groupsCache: { data: CustomerGroupItem[], checksum: string, ts: number } | null = null

  private groupsChecksum(list: CustomerGroupItem[]) {
    try {
      return JSON.stringify(list.map(g => ({ id: g.id, name: g.name, ruleMode: g.ruleMode, autoRun: g.autoRun, latestUpdatedOn: g.latestUpdatedOn })))
    } catch {
      return ''
    }
  }

  private checksum(d: CustomersGridResponse) {
    try {
      return JSON.stringify({
        data: d.data,
        numberOfRecords: d.numberOfRecords,
        numberOfPages: d.numberOfPages
      })
    } catch {
      return ''
    }
  }

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

  /** Cache-first groups: return cached list instantly, refresh in background. */
  async getCustomerGroupsExternalCached(opts?: { onUpdated?: (data: CustomerGroupItem[]) => void }): Promise<{ data: CustomerGroupItem[] | null, fromCache: boolean, refreshPromise?: Promise<boolean> }> {
    const cached = this._groupsCache
    if (cached) {
      const refreshPromise = this.getCustomerGroupsExternal()
        .then((res) => {
          const list = Array.isArray(res?.data) ? res.data : []
          const next = this.groupsChecksum(list)
          if (next !== cached.checksum) {
            this._groupsCache = { data: list, checksum: next, ts: Date.now() }
            if (opts?.onUpdated) opts.onUpdated(list)
            return true
          }
          return false
        })
        .catch(() => false)
      return { data: cached.data, fromCache: true, refreshPromise }
    }
    const res = await this.getCustomerGroupsExternal()
    const list = Array.isArray(res?.data) ? res.data : []
    this._groupsCache = { data: list, checksum: this.groupsChecksum(list), ts: Date.now() }
    return { data: list, fromCache: false }
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

  /** Cache-first loader: returns cached data instantly and refreshes in background. */
  async getCustomersCached(
    options?: {
      pagination?: { start: number, number: number, numberOfPages?: number }
      search?: { name?: string | null, excludeGuests?: boolean }
      sort?: { field?: string, reverse?: boolean }
    },
    opts?: { onUpdated?: (data: CustomersGridResponse) => void }
  ): Promise<CustomersCachedResult> {
    const norm = {
      pagination: {
        start: options?.pagination?.start ?? 0,
        number: options?.pagination?.number ?? 20,
        numberOfPages: options?.pagination?.numberOfPages ?? 10
      },
      search: {
        name: options?.search?.name ?? null,
        excludeGuests: options?.search?.excludeGuests ?? true
      },
      sort: {
        field: options?.sort?.field ?? 'Id',
        reverse: options?.sort?.reverse ?? false
      }
    }
    const key = JSON.stringify(norm)
    const cached = this._cache[key]
    if (cached) {
      const refreshPromise = this.getCustomers(options)
        .then((res) => {
          if (!res.success || !res.data) return false
          const nextSum = this.checksum(res.data)
          if (nextSum !== cached.checksum) {
            this._cache[key] = { data: res.data, checksum: nextSum, ts: Date.now() }
            if (opts?.onUpdated) opts.onUpdated(res.data)
            return true
          }
          return false
        })
        .catch(() => false)
      return { data: cached.data, fromCache: true, refreshPromise }
    }
    const fresh = await this.getCustomers(options)
    if (!fresh.success || !fresh.data) {
      // degrade gracefully
      return { data: { data: [], numberOfRecords: 0, numberOfPages: 1 }, fromCache: false }
    }
    this._cache[key] = { data: fresh.data, checksum: this.checksum(fresh.data), ts: Date.now() }
    return { data: fresh.data, fromCache: false }
  }
}

export const customersService = new CustomersService()

// Types for create customer (API v2)
export interface CreateCustomerRequest {
  customerCode?: string | null
  name: string // Required
  email?: string | null
  phoneNumber?: string | null
  dateOfBirth?: string | null // DateTimeOffset format (ISO 8601)
  gender?: number | null // 0=Nam, 1=Nữ, 2=Khác
  customerGroupId?: string | null
  note?: string | null
  avatarUrl?: string | null
  extensionData?: string | null
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
