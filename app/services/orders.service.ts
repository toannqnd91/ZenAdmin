import { BaseService } from './base.service'
import { performanceMonitor } from '@/utils/performance-monitor'
import type { ShippingMethod } from '@/types/shipping'
import type { DeliveryOption } from '@/types/delivery'
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
  // simple in-memory caches
  private _gridCache: Record<string, { data: OrderGridResponse['data'], checksum: string, ts: number }> = {}

  private _gridChecksum(d: OrderGridResponse['data']) {
    try {
      return JSON.stringify({ items: d?.items, totalRecord: d?.totalRecord, numberOfPages: d?.numberOfPages })
    } catch {
      return ''
    }
  }
  async getCountsByStatus() {
    // POST with empty body per sample
    return performanceMonitor.measure('api.orders.counts', () =>
      this.post<OrderCountsByStatusResponse['data']>(API_ENDPOINTS.ORDER_COUNT_BY_STATUS_EXTERNAL, {})
    )
  }


  // Order grid (list) -------------------------------------------------------
  /**
   * Request body shape for the order grid endpoint.
   * Matches backend sample provided by user.
   */
  async getOrdersGrid(body: OrderGridRequest) {
    return performanceMonitor.measure('api.orders.grid', () =>
      this.post<OrderGridResponse['data']>(API_ENDPOINTS.ORDER_GRID_EXTERNAL, body)
    )
  }

  /**
   * Cache-first grid: returns cached data instantly and refreshes in background.
   */
  async getOrdersGridCached(
    body: OrderGridRequest,
    opts?: { onUpdated?: (data: OrderGridResponse['data']) => void }
  ): Promise<{ data: OrderGridResponse['data'] | null, fromCache: boolean, refreshPromise?: Promise<boolean> }> {
    const key = JSON.stringify(body)
    const cached = this._gridCache[key]
    if (cached) {
      const refreshPromise = this.getOrdersGrid(body)
        .then((res) => {
          if (!res.success || !res.data) return false
          const sum = this._gridChecksum(res.data)
          if (sum !== cached.checksum) {
            this._gridCache[key] = { data: res.data, checksum: sum, ts: Date.now() }
            opts?.onUpdated?.(res.data)
            return true
          }
          return false
        })
        .catch(() => false)
      return { data: cached.data, fromCache: true, refreshPromise }
    }
    const res = await this.getOrdersGrid(body)
    if (!res.success || !res.data) return { data: null, fromCache: false }
    this._gridCache[key] = { data: res.data, checksum: this._gridChecksum(res.data), ts: Date.now() }
    return { data: res.data, fromCache: false }
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
    return performanceMonitor.measure('api.orders.detail', () =>
      this.get<OrderDetailRawResponse | null>(API_ENDPOINTS.ORDER_BY_ID(id))
    )
  }

  async getOrderHistory(id: number | string) {
    return performanceMonitor.measure('api.orders.history', () =>
      this.get<OrderHistoryListResponse | null>(API_ENDPOINTS.ORDER_HISTORY(id) + '?page=1&pageSize=20')
    )
  }

  // Pay order ------------------------------------------------------------
  async payOrder(orderCode: string, body: PayOrderRequest) {
    // Backend expects numeric method per user's sample
    return this.post<PayOrderResponse | null>(API_ENDPOINTS.ORDER_PAY(orderCode), body)
  }

  // Cancel order ---------------------------------------------------------
  async cancelOrder(orderCode: string, body: CancelOrderRequest) {
    return this.post<CancelOrderResponseData | null>(API_ENDPOINTS.ORDER_CANCEL(orderCode), body)
  }

  // Print preview --------------------------------------------------------
  async getOrderPrintPreviewHtml(orderCode: string) {
    return performanceMonitor.measure('api.orders.printPreview', () =>
      this.requestText(API_ENDPOINTS.ORDER_PRINT_HTML_PREVIEW(orderCode))
    )
  }

  async downloadOrderPrintPdf(orderCode: string) {
    return performanceMonitor.measure('api.orders.printDownloadPdf', () =>
      this.requestBlob(API_ENDPOINTS.ORDER_PRINT_DOWNLOAD_PDF(orderCode), { method: 'POST' })
    )
  }

  // Calculate prices based on pricebook -----------------------------------
  async calculatePrices(body: CalculatePricesRequest) {
    return this.post<CalculatePricesResponse>(API_ENDPOINTS.ORDER_CALCULATE_PRICES, body)
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
      OrderStatus?: string | null // legacy (string-based)
      Status?: number | null // new numeric enum filter
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

export interface OrderGridCustomerRef {
  code: string | null
  name: string
}

export interface OrderGridItem {
  id: number
  orderCode: string
  createdOn: string
  orderStatus: string
  orderTotal: number
  orderTotalString: string
  paidAmount: number
  paymentStatus: string
  customer: OrderGridCustomerRef | null
  // Optional legacy / not always present fields
  orderNumber?: string
  customerName?: string
  sourceName?: string | null
  orderSource?: string | null
  shippingMethod?: string | null
  deliveryAddress?: OrderGridItemAddress
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
  giftQuantity: number
  lineNote: string | null
}
export interface CreatePosOrderRequest {
  items: CreatePosOrderItemRequest[]
  paymentMethod: number // backend expects numeric enum per sample
  warehouseId: number | string
  customerId: number | null
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
  deliveryOption: DeliveryOption // string token: 'vanchuyen' | 'tugiaohang' | 'giaongay' | 'giaosau'
  shippingMethod: ShippingMethod | null
  expectedDeliveryDate: string | null // ISO string
  orderNote: string | null
  couponCode: string | null
  applyCouponToEachItem: boolean
  priceBookId: number | null // NEW: PriceBook Id selected for this order
  employeeId: number | null // NEW: Employee responsible for this order
  orderCreatedAt: string | null // ISO DateTimeOffset format
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

// Raw API (current backend) -----------------------------------------------
export interface RawOrderItem {
  id: number
  productId: number
  productName: string
  productImage: string | null
  productPrice: number
  quantity: number
  shippedQuantity: number
  taxAmount: number
  taxPercent: number
  discountAmount: number
  total: number
  taxIncludedAmount: number
  rowTotal: number
  variationOptions: unknown[]
  // string formatted values
  taxAmountString: string
  productPriceString: string
  discountAmountString: string
  totalString: string
  taxIncludedAmountString: string
  rowTotalString: string
}

export interface RawOrderEntity {
  id: number
  customerId: string
  customerName: string
  customerEmail: string
  createdOn: string
  orderStatusString: string
  orderStatus: number
  subtotal: number
  discountAmount: number
  subTotalWithDiscount: number
  taxAmount: number
  shippingAmount: number
  orderTotal: number
  shippingMethod: string | null
  paymentMethod: string | null
  paymentFeeAmount: number
  subtotalString: string
  discountAmountString: string
  subtotalWithDiscountString: string
  taxAmountString: string
  shippingAmountString: string
  paymentFeeAmountString: string
  orderTotalString: string
  orderItems: RawOrderItem[]
  subOrderIds: number[] | null
  isMasterOrder: boolean
  orderNote: string | null
}

export interface RawCustomerInfoCustomer {
  customerId: string
  name: string
  email: string | null
  phone: string | null
}
export interface RawCustomerInfoAddress {
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  districtName: string | null
  stateOrProvinceName: string | null
  countryId: string | null
  phone: string | null
  zipCode: string | null
}
export interface RawCustomerInfo {
  customer: RawCustomerInfoCustomer | null
  address: RawCustomerInfoAddress | null
}
export interface OrderDetailRawEnvelope {
  order: RawOrderEntity
  customerInfo: RawCustomerInfo | null
}
export interface OrderDetailRawResponse {
  code: string
  success: boolean
  message: string
  data: OrderDetailRawEnvelope | null
}

// History list envelope (current backend format) -------------------------
export interface RawHistoryItem {
  id: number
  orderId: number
  oldStatus: number | null
  newStatus: number | null
  oldStatusText: string | null
  newStatusText: string | null
  note: string | null
  paymentDelta: number | null
  createdOn: string
  createdById: string | null
}
export interface OrderHistoryListEnvelope {
  total: number
  page: number
  pageSize: number
  items: RawHistoryItem[]
}
export interface OrderHistoryListResponse {
  code: string
  success: boolean
  message: string
  data: OrderHistoryListEnvelope | null
}

// Pay order types --------------------------------------------------------
export interface PayOrderRequest {
  amount: number
  method: 1 | 2 | 3 // 1: TienMat, 2: ChuyenKhoan, 3: ViDienTu
  description: string
  autoCompleteWhenFullyPaid: boolean
}
export interface PayOrderResponse {
  code: string
  success: boolean
  message: string
  data: unknown
}

// Cancel order types -----------------------------------------------------
export enum CancellationReasonEnum {
  CustomerRequested = 1,      // Khách hàng yêu cầu
  CreatedByMistake = 2,       // Tạo nhầm
  OutOfStock = 3,             // Hết hàng
  PriceChanged = 4,           // Thay đổi giá
  PaymentIssue = 5,           // Vấn đề thanh toán
  Other = 99                  // Lý do khác
}

export enum RefundOptionEnum {
  RefundNow = 1,              // Hoàn tiền ngay
  RefundLater = 2             // Hoàn trả sau
}

export interface CancelOrderRequest {
  reason: CancellationReasonEnum
  note: string
  refundOption: RefundOptionEnum
  restockAllItems: boolean
  idempotencyKey: string | null
  createdById: string | null
}

export interface CancelOrderResponseData {
  message: string
  orderCode: string
  sagaId: string
  correlationId: string
  orderStatus: string
  note: string
}

export interface CancelOrderResponse {
  code: string
  success: boolean
  message: string
  data: CancelOrderResponseData | null
}

// Calculate prices types -------------------------------------------------
export interface CalculatePricesRequestItem {
  productId: number | string
  quantity: number
  originalPrice: number
}

export interface CalculatePricesRequest {
  priceBookId: number | string
  customerId: number | string | null
  items: CalculatePricesRequestItem[]
}

export interface CalculatePricesResponseItem {
  productId: number
  sku: string | null
  quantity: number
  originalPrice: number
  priceBookPrice: number
  discountAmount: number
  discountPercent: number
  finalPrice: number
  lineTotal: number
}

export interface CalculatePricesSummary {
  subtotal: number
  totalDiscount: number
  couponDiscount: number
  total: number
}

export interface CalculatePricesData {
  success: boolean
  data: {
    priceBookId: number
    priceBookName: string | null
    couponCode: string | null
    isCouponValid: boolean
    couponValidationMessage: string | null
    items: CalculatePricesResponseItem[]
    summary: CalculatePricesSummary
  }
}

export interface CalculatePricesResponse {
  code: string
  success: boolean
  message: string
  data: CalculatePricesData | null
}

export const ordersService = new OrdersService()
