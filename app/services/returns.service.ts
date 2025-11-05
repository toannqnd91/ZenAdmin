import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'

export interface CalculateRefundRequestItem {
  orderItemId: number | string
  productId: number | string
  quantity: number
}
export interface CalculateRefundRequest {
  items: CalculateRefundRequestItem[]
}

export interface CalculateRefundItemResponse {
  orderItemId: number | string
  productId: number | string
  productName: string
  requestedQty: number
  appliedQty: number
  maxReturnQty: number
  unitPrice: number
  lineSubtotal: number
  lineTax: number
  adjusted: boolean
  note: string | null
}
export interface CalculateRefundResponseData {
  orderCode: string
  totalItems: number
  subtotal: number
  manualDiscountAmount: number
  taxRefund: number
  totalRefund: number
  items: CalculateRefundItemResponse[]
}
export interface CalculateRefundResponseEnvelope {
  code: string
  success: boolean
  message: string
  data: CalculateRefundResponseData | null
}

export class ReturnsService extends BaseService {
  async calculateRefund(orderCode: string, body: CalculateRefundRequest) {
    return this.post<CalculateRefundResponseData | null>(API_ENDPOINTS.SALES_RETURNS_CALCULATE_REFUND(orderCode), body)
  }
}

export const returnsService = new ReturnsService()
