import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'

export interface CreatePriceBookRequest {
  code: string | null
  name: string
  status: number
  startOn: string
  endOn: string
  currency: string
  warehouseIds: number[]
  customerGroupIds: number[]
  channelIds: string[]
  creatorUserId: string
  allowItemsNotInBook: boolean
  warnItemsNotInBook: boolean
  restrictItemsToBook: boolean
  priceFormulaJson: string
  priceFormulaDescription: string
  defaultAdjustmentPercent: number
}

export interface CreatePriceBookResponse {
  id: number
  code: string
}

export class PriceBooksService extends BaseService {
  /** Create a new price book */
  async createPriceBook(payload: CreatePriceBookRequest) {
    // Use centralized pricing endpoint
    return this.post<CreatePriceBookResponse>(API_ENDPOINTS.PRICING_PRICEBOOKS, payload)
  }

  /**
   * Get pricebooks by type
   * type can be 'Warehouse' | 'CustomerGroup' | 'Channel'. If omitted, returns all.
   */
  async getByType(type?: 'Warehouse' | 'CustomerGroup' | 'Channel') {
    const params = type ? { type } : undefined
    return this.get<Array<Record<string, unknown>>>(API_ENDPOINTS.PRICING_PRICEBOOKS_BY_TYPE, params)
  }
}

export const priceBooksService = new PriceBooksService()
