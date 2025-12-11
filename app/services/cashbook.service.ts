import { BaseService } from './base.service'
import { performanceMonitor } from '@/utils/performance-monitor'
import { API_ENDPOINTS } from '@/utils/api'

// Enums matching backend
export enum CashBookTypeEnum {
  All = 0,
  Thu = 1,
  Chi = 2
}

export enum CashBookMethodEnum {
  All = 0,
  TienMat = 1,
  ChuyenKhoan = 2,
  ViDienTu = 3
}

export enum CashBookStatusEnum {
  All = 0,
  Paid = 1,
  Canceled = 2,
  Draft = 3
}

// Cash Book (Sổ quỹ) API types
export interface CashBookFilterRequest {
  from: string // ISO datetime
  to: string // ISO datetime
  type: number // CashBookTypeEnum (0=All, 1=Thu, 2=Chi)
  method: number // CashBookMethodEnum (0=All, 1=TienMat, 2=ChuyenKhoan, 3=ViDienTu)
  status: number // CashBookStatusEnum (0=All, 1=Paid, 2=Canceled, 3=Draft)
  page: number
  pageSize: number
  keyword: string
  documentKinds: string[]
}

export interface CashBookItem {
  code: string
  occurredOn: string
  createdById: string
  type: number
  method: number
  amount: number
  description: string
  category: string
  partyType: string
  partyId: string | null
  partyName: string
  referenceModule: string | null
  referenceId: string | null
  orderId: number | null
  branchId: number | null
  status: number
  affectBusinessResult: boolean
  id: number
}

export interface CashBookPaginationInfo {
  page: number
  pageSize: number
  total: number
}

export interface MethodBreakdownEntry {
  method: number
  thu: number
  chi: number
  net: number
}

export interface DocumentKindBreakdown {
  thuTienMat: number
  chiTienMat: number
  netTienMat: number
  thuTKNH: number
  chiTKNH: number
  netTKNH: number
  transferIn: number
  transferOut: number
  transferNet: number
}

export interface CashBookResponseData {
  items: CashBookItem[]
  pagination: CashBookPaginationInfo
  openingBalance: number
  totalIn: number
  totalOut: number
  net: number
  closingBalance: number
  methodBreakdown: MethodBreakdownEntry[]
  documentKindBreakdown: DocumentKindBreakdown
}

export interface CashBookApiResponse {
  code: string
  success: boolean
  message: string
  data: CashBookResponseData
}

// Create Cash Book Request (based on API spec)
export interface CreateCashBookRequest {
  type: number // CashBookTypeEnum: 1=Thu, 2=Chi
  method: number // CashBookMethodEnum: 1=TienMat, 2=ChuyenKhoan, 3=ViDienTu
  amount: number
  description: string
  category: string
  partyType: string
  partyId: string
  discountCodeId?: string
  referenceId?: string
  ordCode?: string
  affectBusinessResult: boolean
}

class CashBookService extends BaseService {
  // In-memory cache by serialized request body
  private _cache: Record<string, { data: CashBookResponseData, checksum: string, ts: number }> = {}

  private checksum(d: CashBookResponseData) {
    try {
      return JSON.stringify({
        items: d.items,
        total: d.pagination?.total,
        openingBalance: d.openingBalance,
        totalIn: d.totalIn,
        totalOut: d.totalOut,
        closingBalance: d.closingBalance,
        methodBreakdown: d.methodBreakdown
      })
    } catch {
      return ''
    }
  }

  async filter(request: CashBookFilterRequest): Promise<CashBookResponseData> {
    return performanceMonitor.measure('api.cashbook.filter', async () => {
      const res = await this.post<CashBookResponseData>(API_ENDPOINTS.CASHBOOK_FILTER, request)
      // API envelope already parsed by BaseService; ensure success
      return res.data
    })
  }

  /**
   * Cache-first fetch: returns cached data instantly if available, and performs a background refresh.
   * The returned object includes a refreshPromise that resolves to true if new data replaces cache.
   */
  async filterCached(
    request: CashBookFilterRequest,
    opts?: { onUpdated?: (data: CashBookResponseData) => void }
  ): Promise<{ data: CashBookResponseData; fromCache: boolean; refreshPromise?: Promise<boolean> }> {
    const key = JSON.stringify(request)
    const cached = this._cache[key]
    if (cached) {
      const refreshPromise = this.filter(request)
        .then((data) => {
          const next = this.checksum(data)
          if (next !== cached.checksum) {
            this._cache[key] = { data, checksum: next, ts: Date.now() }
            if (opts?.onUpdated) opts.onUpdated(data)
            return true
          }
          return false
        })
        .catch(() => false)
      return { data: cached.data, fromCache: true, refreshPromise }
    }
    const fresh = await this.filter(request)
    this._cache[key] = { data: fresh, checksum: this.checksum(fresh), ts: Date.now() }
    return { data: fresh, fromCache: false }
  }

  async getByCode(code: string) {
    // Endpoint pattern: /cashbook/{code}
    const endpoint = API_ENDPOINTS.CASHBOOK_DETAIL(code)
    return this.get<unknown>(endpoint)
  }

  async createCashBook(request: CreateCashBookRequest) {
    return this.post<any>(API_ENDPOINTS.CASHBOOK_CREATE, request)
  }
}

export const cashBookService = new CashBookService()
export type { CashBookService }
