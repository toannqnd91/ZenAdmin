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

  // Order grid (list) -------------------------------------------------------
  /**
   * Request body shape for the order grid endpoint.
   * Matches backend sample provided by user.
   */
  async getOrdersGrid(body: OrderGridRequest) {
    return this.post<OrderGridResponse['data']>(API_ENDPOINTS.ORDER_GRID_EXTERNAL, body)
  }

  // Create POS order -------------------------------------------------------
  /**
   * Create a POS order (user provided sample). Returns 201 on success.
   */
  async createPosOrder(body: CreatePosOrderRequest) {
    return this.post<unknown>(API_ENDPOINTS.ORDER_CREATE_POS, body)
  }
}

// Types for order grid endpoint
export interface OrderGridRequest {
  Pagination: {
    Start: number
    TotalItemCount: number
    Number: number
    NumberOfPages: number
  }
  Search: {
    QueryObject: {
      Name: string | null
      OrderStatus?: string | null
    }
  }
  Sort: {
    Field: string
    Reverse: boolean
  }
}

export interface OrderGridItemAddressCustomer {
  customerId: string
  name: string
  email: string | null
  phone: string | null
}

export interface OrderGridItemAddress {
  customer: OrderGridItemAddressCustomer
  address: string | null
}

export interface OrderGridItem {
  id: number
  orderCode: string
  orderNumber: string // e.g. "#807"
  createdOn: string
  customerName: string
  sourceName: string | null
  orderTotal: number
  orderTotalString: string
  paidAmount: number
  paymentStatus: string
  orderStatus: string
  shippingMethod: string | null
  orderSource: string | null
  deliveryAddress: OrderGridItemAddress
}

export interface OrderGridResponse {
  code: string
  success: boolean
  message: string
  data: {
    items: OrderGridItem[]
    totalRecord: number
    numberOfPages: number
  } | null
}

// Create POS order types ---------------------------------------------------
export interface CreatePosOrderItemRequest {
  productId: number | string
  quantity: number
  productPrice: number
  discountAmount: number
  unitPrice: number
}
export interface CreatePosOrderRequest {
  items: CreatePosOrderItemRequest[]
  paymentMethod: number // backend expects numeric enum per sample
  warehouseId: number | string
  customerId: string | number
  deliveryAddress: {
    contactName: string
    phoneNumber: string
    email: string | null
    addressLine1: string | null
    addressLine2: string | null
    countryId: string | number | null
    stateOrProvinceId: number | null
    districtId: number | null
    city: string | null
    zipCode: string | null
  }
  payLater: boolean
  paidAmount: number
  orderSourceId: number | string | null
  shippingFeeAmount: number
  discountAmount: number
  deliveryOption: number // numeric enum
  shippingMethod: string | null
  expectedDeliveryDate: string | null // ISO string
  orderNote: string | null
  couponCode: string | null
  applyCouponToEachItem: boolean
}

export const ordersService = new OrdersService()
