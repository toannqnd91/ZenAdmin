import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'

export interface WarehouseItem {
  id: number
  name: string
  createdOn?: string
  productCount?: number
  totalStock?: number
  address?: string
}

export class WarehouseService extends BaseService {
  async getWarehouses() {
    return this.get<WarehouseItem[]>(API_ENDPOINTS.WAREHOUSES)
  }
}

export const warehouseService = new WarehouseService()
