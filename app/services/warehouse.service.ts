import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'

export interface WarehouseItem {
  id: number
  name: string
  createdOn?: string
  productCount?: number
  totalStock?: number
  address?: string
  isDefault?: boolean
}

export class WarehouseService extends BaseService {
  async getWarehouses() {
    return this.get<WarehouseItem[]>(API_ENDPOINTS.WAREHOUSES)
  }

  async getDefaultWarehouse() {
    return this.get<{ id: number }>(API_ENDPOINTS.WAREHOUSE_DEFAULT)
  }
}

export const warehouseService = new WarehouseService()
