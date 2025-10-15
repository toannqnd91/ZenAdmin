import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'

export interface PurchaseOrderGridItem {
  code: string
  id: number
  createdOn: string
  supplierName: string
  warehouseName: string
  currency: string | null
  paymentTerms: string | null
  estimatedArrival: string | null
  shippingCarrier: string | null
  trackingNumber: string | null
  referenceNumber: string | null
  noteToSupplier: string | null
  tags: string[] | null
  status: string
  subtotal: number
  taxTotal: number
  shippingCost: number
  discount: number
  total: number
  paymentStatus: string | null
  paidAmount: number
  paymentMethod: string | null
  paymentReference: string | null
  items: unknown[]
}

// Response "data" shape from the API (outer ApiResponse is provided by BaseService)
export interface PurchaseOrderGridData {
  items: PurchaseOrderGridItem[]
  totalRecord: number
  numberOfPages: number
}

export class PurchaseOrderService extends BaseService {
  async getGrid(options?: {
    pagination?: { start: number, number: number, numberOfPages?: number }
    search?: { name?: string | null }
    sort?: { field?: string, reverse?: boolean }
  }) {
    const body = this.createListRequestBody({
      pagination: options?.pagination,
      search: {
        Name: options?.search?.name ?? null
      },
      sort: {
        field: options?.sort?.field ?? 'Id',
        reverse: options?.sort?.reverse ?? true
      }
    })
    // BaseService.post already wraps with ApiResponse<T>, so T should be the inner data shape
    return this.post<PurchaseOrderGridData>(API_ENDPOINTS.PURCHASE_ORDERS_GRID, body)
  }
}

export const purchaseOrderService = new PurchaseOrderService()
