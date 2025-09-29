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

  // Order detail ----------------------------------------------------------
  async getOrderById(id: number | string) {
    return this.get<OrderDetail | null>(API_ENDPOINTS.ORDER_BY_ID(id))
  }

  async getOrderHistory(id: number | string) {
    return this.get<OrderHistoryEvent[] | null>(API_ENDPOINTS.ORDER_HISTORY(id))
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

// Detail page types -------------------------------------------------------
export interface OrderDetailItem {
  id: number | string
  productId: number | string
  productName: string
  quantity: number
  unitPrice: number
  lineTotal: number
  thumbnailImageUrl?: string | null
  note?: string | null
}

export interface OrderHistoryEvent {
  id?: number | string
  createdOn: string
  actorName: string | null
  message: string
  meta?: Record<string, unknown>
}

export interface OrderDetailCustomerInfo {
  id: number | string
  name: string
  phone?: string | null
  email?: string | null
  totalSpent?: number | null
  lastOrderCode?: string | null
}

export interface OrderDetailAddressInfo {
  contactName: string | null
  phoneNumber: string | null
  email: string | null
  addressLine1: string | null
  addressLine2: string | null
  country?: string | null
  stateOrProvince?: string | null
  district?: string | null
  city?: string | null
  zipCode?: string | null
}

export interface OrderDetailPaymentInfo {
  totalQuantity: number
  subTotal: number
  discountAmount: number
  shippingFeeAmount: number
  orderTotal: number
  paidAmount: number
  paymentMethod: string | null
  paymentStatus: string | null
}

export interface OrderDetailMetaInfo {
  sourceName: string | null
  branchName: string | null
  staffInCharge: string | null
  creatorName?: string | null
  orderDate?: string | null
  scheduledDate?: string | null
  shippingMethod?: string | null
  deliveryOption?: string | null
  expectedDeliveryDate?: string | null
  tags?: string[] | null
}

export interface OrderDetail {
  id: number | string
  orderCode: string
  status: string
  processStatus?: string | null
  paymentStatus?: string | null
  createdOn: string
  items: OrderDetailItem[]
  customer: OrderDetailCustomerInfo | null
  address: OrderDetailAddressInfo | null
  payment: OrderDetailPaymentInfo | null
  note: string | null
  meta: OrderDetailMetaInfo | null
  history?: OrderHistoryEvent[]
}

export const ordersService = new OrdersService()
