import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'

export interface OrderCountsByStatusResponse {
  code: string
  success: boolean
  message: string
  data: {
    all: number
    ordered: number
    inProgress: number
    completed: number
    canceled: number
    byStatus: Record<string, number>
  } | null
}

export class OrdersService extends BaseService {
  async getCountsByStatus() {
    // POST with empty body per sample
    return this.post<OrderCountsByStatusResponse['data']>(API_ENDPOINTS.ORDER_COUNT_BY_STATUS_EXTERNAL, {})
  }
}

export const ordersService = new OrdersService()
