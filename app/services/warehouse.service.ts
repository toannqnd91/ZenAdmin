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
  // simple in-memory cache for list
  private _listCache: { data: WarehouseItem[], checksum: string, ts: number } | null = null

  private _sum(d: WarehouseItem[]) {
    try {
      // Only include stable fields for checksum.
      return JSON.stringify(d.map(w => ({ id: w.id, name: w.name, createdOn: w.createdOn, productCount: w.productCount, totalStock: w.totalStock, isDefault: w.isDefault })))
    } catch {
      return ''
    }
  }

  async getWarehouses() {
    return this.get<WarehouseItem[]>(API_ENDPOINTS.WAREHOUSES)
  }

  /**
   * Cache-first: return cached warehouses instantly, refresh in background.
   */
  async getWarehousesCached(opts?: { onUpdated?: (data: WarehouseItem[]) => void }): Promise<{ data: WarehouseItem[] | null, fromCache: boolean, refreshPromise?: Promise<boolean> }> {
    const cached = this._listCache
    if (cached) {
      const refreshPromise = this.getWarehouses()
        .then((res) => {
          const list = Array.isArray(res?.data) ? res.data : []
          const next = this._sum(list)
          if (next !== cached.checksum) {
            this._listCache = { data: list, checksum: next, ts: Date.now() }
            opts?.onUpdated?.(list)
            return true
          }
          return false
        })
        .catch(() => false)
      return { data: cached.data, fromCache: true, refreshPromise }
    }
    const res = await this.getWarehouses()
    const list = Array.isArray(res?.data) ? res.data : []
    this._listCache = { data: list, checksum: this._sum(list), ts: Date.now() }
    return { data: list, fromCache: false }
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

  async getWarehouse(id: number | string) {
    return this.get<any>(API_ENDPOINTS.WAREHOUSE_BY_ID(id))
  }

  async updateWarehouse(id: number | string, payload: any) {
    return this.put(API_ENDPOINTS.WAREHOUSE_UPDATE(id), payload)
  }
}

export const warehouseService = new WarehouseService()
