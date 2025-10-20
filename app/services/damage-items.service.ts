import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'

export interface DamageItemGridItem {
  id: number
  warehouseId: number
  warehouseName: string
  status: number
  createdOn: string
  approvedOn: string | null
  createdById: string
}

export interface DamageItemsGridData {
  Items: DamageItemGridItem[]
  TotalRecord: number
  NumberOfPages: number
}

export class DamageItemsService extends BaseService {
  async getGrid(options?: {
    pagination?: { start: number, number: number, numberOfPages?: number }
    search?: Record<string, unknown>
    sort?: { field?: string, reverse?: boolean }
  }) {
    const body = this.createListRequestBody({
      pagination: options?.pagination,
      search: options?.search || {},
      sort: {
        field: options?.sort?.field ?? 'Id',
        reverse: options?.sort?.reverse ?? true
      }
    })
    return this.post<DamageItemsGridData>(API_ENDPOINTS.DAMAGE_ITEMS_GRID, body)
  }
}

export const damageItemsService = new DamageItemsService()
