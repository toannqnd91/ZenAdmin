import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'
import type { PriceBookDetail, PriceBookMissingProductsPage } from '@/types/pricebook'

export interface CreatePriceBookRequest {
  code: string
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
  /** 'increase' or 'decrease' */
  adjustmentMode: 'increase' | 'decrease'
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

  /** Get a price book detail by code */
  async getByCode(code: string) {
    return this.get<PriceBookDetail>(API_ENDPOINTS.PRICING_PRICEBOOK_BY_CODE(code))
  }

  /** Get items of a price book by code */
  async getItemsByCode(code: string) {
    return this.get<import('@/types/pricebook').PriceBookItem[]>(API_ENDPOINTS.PRICING_PRICEBOOK_ITEMS_BY_CODE(code))
  }

  /** Get missing products for a price book by code with server pagination */
  async getMissingProductsByCode(code: string, page: number, pageSize: number, keyword?: string) {
    const params: Record<string, string | number> = { page, pageSize }
    if (keyword && String(keyword).trim() !== '') params.keyword = keyword
    return this.get<PriceBookMissingProductsPage>(API_ENDPOINTS.PRICING_PRICEBOOK_MISSING_PRODUCTS_BY_CODE(code), params)
  }

  /** Add an item (product price) into a price book by code */
  async addItemToPriceBook(
    code: string,
    payload: { productId: number, priceType: number, value: number, isActived: boolean, note?: string }
  ) {
    return this.post<unknown>(API_ENDPOINTS.PRICING_PRICEBOOK_ITEMS_BY_CODE(code), payload)
  }

  /** Delete an item from price book by item id */
  async deleteItemFromPriceBook(code: string, itemId: number | string) {
    return this.delete<unknown>(API_ENDPOINTS.PRICING_PRICEBOOK_ITEM_BY_CODE_AND_ID(code, itemId))
  }
}

export const priceBooksService = new PriceBooksService()
