import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'

export interface OrderSourceItem {
  id: number
  name: string
  code: string
  iconUrl?: string
  [key: string]: unknown
}

export class OrderSourceService extends BaseService {
  async getOrderSources() {
    return this.get<OrderSourceItem[]>(API_ENDPOINTS.ORDER_SOURCES)
  }
}

export const orderSourceService = new OrderSourceService()
