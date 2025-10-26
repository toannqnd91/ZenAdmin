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

  // Detail by transfer code
  async getByCode(code: string) {
    return this.get<InventoryTransferDetailDTO>(API_ENDPOINTS.INVENTORY_TRANSFER_BY_CODE(code))
  }

  // Update status by code
  async updateStatus(code: string, payload: { status: number, strictFifo?: boolean, rollbackAll?: boolean }) {
    return this.post<{ success: boolean } | null>(API_ENDPOINTS.INVENTORY_TRANSFER_UPDATE_STATUS(code), payload)
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

// Detail DTO by code
export interface InventoryTransferItemDTO {
  id: number
  productId: number
  quantity: number
  transferredQuantity: number
  stockQuantity?: number
  availableQuantity?: number
  sku?: string
}
export interface InventoryTransferDetailDTOEnvelope {
  id: number
  transferCode: string
  status: number
  statusText: string
  createdOn: string
  note: string | null
  referenceName: string | null
  tags: string | null
  originId: number
  originName: string
  destinationId: number
  destinationName: string
  items: InventoryTransferItemDTO[]
}
export interface InventoryTransferDetailDTOResponse {
  code: string
  success: boolean
  message: string
  data: InventoryTransferDetailDTOEnvelope | null
}
export type InventoryTransferDetailDTO = InventoryTransferDetailDTOEnvelope
