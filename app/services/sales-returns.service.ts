import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'

export interface SalesReturnGridRequest {
  Pagination: {
    Start: number
    TotalItemCount: number
    Number: number
    NumberOfPages: number
  }
  Search: {
    QueryObject: {
      Name: string | null
    }
  }
  Sort: {
    Field: string
    Reverse: boolean
  }
}

export interface SalesReturnGridItem {
  id: number
  orderId: number
  orderCode?: string // newly added in response
  returnNumber: string
  customerId: number | null
  customerName: string | null
  warehouseId: number | null
  warehouseName: string | null
  status: string
  total: number
  refundAmount: number
  note: string | null
}

export interface SalesReturnGridResponse {
  code: string
  success: boolean
  message: string
  data: {
    items: SalesReturnGridItem[]
    totalRecord: number
    numberOfPages: number
  } | null
}

export class SalesReturnsService extends BaseService {
  private _gridCache: Record<string, { data: SalesReturnGridResponse['data'], checksum: string, ts: number }> = {}

  private _gridChecksum(d: SalesReturnGridResponse['data']) {
    try {
      return JSON.stringify({ items: d?.items, totalRecord: d?.totalRecord, numberOfPages: d?.numberOfPages })
    } catch {
      return ''
    }
  }

  async getGrid(body: SalesReturnGridRequest) {
    return this.post<SalesReturnGridResponse['data']>(API_ENDPOINTS.SALES_RETURNS + '/grid', body)
  }

  async getGridCached(
    body: SalesReturnGridRequest,
    opts?: { onUpdated?: (data: SalesReturnGridResponse['data']) => void }
  ): Promise<{ data: SalesReturnGridResponse['data'] | null, fromCache: boolean, refreshPromise?: Promise<boolean> }> {
    const key = JSON.stringify(body)
    const cached = this._gridCache[key]
    if (cached) {
      const refreshPromise = this.getGrid(body)
        .then((res) => {
          if (!res.success || !res.data) return false
          const sum = this._gridChecksum(res.data)
          if (sum !== cached.checksum) {
            this._gridCache[key] = { data: res.data, checksum: sum, ts: Date.now() }
            opts?.onUpdated?.(res.data)
            return true
          }
          return false
        })
        .catch(() => false)
      return { data: cached.data, fromCache: true, refreshPromise }
    }
    const res = await this.getGrid(body)
    if (!res.success || !res.data) return { data: null, fromCache: false }
    this._gridCache[key] = { data: res.data, checksum: this._gridChecksum(res.data), ts: Date.now() }
    return { data: res.data, fromCache: false }
  }
}

export const salesReturnsService = new SalesReturnsService()
