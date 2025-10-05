import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'

// Request payload for creating an inventory transfer
export interface CreateInventoryTransferItemRequest {
  productId: number | string
  quantity: number
}
export interface CreateInventoryTransferRequest {
  originWarehouseId: number | string
  destinationWarehouseId: number | string
  note: string | null
  referenceName: string | null
  tags: string[]
  items: CreateInventoryTransferItemRequest[]
}

export interface CreateInventoryTransferResponseEnvelope {
  id: number | string
  code?: string | null
  createdOn?: string
}
export interface CreateInventoryTransferApiResponse {
  code: string
  success: boolean
  message: string
  data: CreateInventoryTransferResponseEnvelope | null
}

export class InventoryTransfersService extends BaseService {
  async createTransfer(body: CreateInventoryTransferRequest) {
    return this.post<CreateInventoryTransferApiResponse['data']>(API_ENDPOINTS.INVENTORY_TRANSFERS, body)
  }

  // Grid listing
  async getTransfersGrid(body: TransferGridRequest) {
    return this.post<TransferGridResponseEnvelope>(API_ENDPOINTS.INVENTORY_TRANSFERS_GRID, body)
  }

  // Counts by status
  async getCountsByStatus() {
    return this.get<InventoryTransferCountsResponse['data']>(API_ENDPOINTS.INVENTORY_TRANSFERS_COUNT_BY_STATUS)
  }
}

// Separated types (exportable if needed elsewhere)
interface TransferGridRequest {
  Pagination: { Start: number, TotalItemCount: number, Number: number, NumberOfPages: number }
  Search: { QueryObject: { Name: string | null } }
  Sort: { Field: string, Reverse: boolean }
}

export const inventoryTransfersService = new InventoryTransfersService()

// Exported types for grid usage elsewhere
export interface TransferGridItem {
  id: number | string
  transferCode: string
  status: number
  statusText: string
  createdOn: string
  originId: number | string
  originName: string
  destinationId: number | string
  destinationName: string
  itemCount: number
  totalQuantity: number
  tags: string
}
export interface TransferGridData {
  items: TransferGridItem[]
  totalRecord: number
  numberOfPages: number
}
export interface TransferGridResponseEnvelope {
  code: string
  success: boolean
  message: string
  data: TransferGridData | null
}

// Counts by status types
export interface InventoryTransferCountsData {
  total: number
  draft: number
  readyToShip: number
  inProgress: number
  partiallyTransferred: number
  transferred: number
  cancelled: number
  byStatus?: Record<string, number>
}
export interface InventoryTransferCountsResponse {
  code: string
  success: boolean
  message: string
  data: InventoryTransferCountsData | null
}
