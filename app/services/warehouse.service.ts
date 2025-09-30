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

  async createWarehouse(payload: {
    name: string
    contactName?: string | null
    phone?: string | null
    addressLine1?: string | null
    addressLine2?: string | null
    city?: string | null
    zipCode?: string | null
    wardId?: number | null
    stateOrProvinceId?: number | null
    countryId?: string | null
    latitude?: number | null
    longitude?: number | null
  }) {
    return this.post(API_ENDPOINTS.WAREHOUSE_CREATE, payload)
  }
}

export const warehouseService = new WarehouseService()
