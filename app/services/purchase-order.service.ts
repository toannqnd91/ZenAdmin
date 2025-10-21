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

// Detail by code DTOs
export interface PurchaseOrderItemDTO {
  id: number | string
  productName: string
  sku?: string | null
  quantity: number
  cost: number
  lineTotal?: number
}

export interface PurchaseOrderByCodeDTO {
  code: string
  createdOn: string
  status?: string
  statusLabel?: string
  supplierName: string
  warehouseName: string
  createdByName: string
  estimatedArrival?: string | null
  referenceNumber?: string | null
  noteToSupplier?: string | null
  tags?: string[] | null
  subtotal: number
  discount: number
  shippingCost: number
  total: number
  paidAmount: number
  items: PurchaseOrderItemDTO[]
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

  async getByCode(code: string) {
    // API returns envelope { code, success, message, data }
    return this.get<PurchaseOrderByCodeDTO>(API_ENDPOINTS.PURCHASE_ORDER_BY_CODE(code))
  }
}

export const purchaseOrderService = new PurchaseOrderService()
