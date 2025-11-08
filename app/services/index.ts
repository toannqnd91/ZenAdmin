// Export all services for easy importing
export { BaseService } from './base.service'
export { authService, AuthService } from './auth.service'
export { dashboardService, DashboardService } from './dashboard.service'
export { newsService, NewsService } from './news.service'
export { productService, ProductService } from './product.service'
export { fileService, FileService } from './file.service'
export { linksService, LinksService } from './links.service'
export { widgetsService, WidgetsService } from './widgets.service'
export { orderSourceService, OrderSourceService } from './order-source.service'
export { customersService, CustomersService } from './customers.service'
export { ordersService, OrdersService } from './orders.service'
export { salesReturnsService, SalesReturnsService } from './sales-returns.service'
export { cashBookService } from './cashbook.service'
export { priceBooksService, PriceBooksService } from './pricebooks.service'
export { warehouseService, WarehouseService } from './warehouse.service'
export { returnsService, ReturnsService } from './returns.service'

// Export types
export type {
  CreateProductRequest,
  UpdateProductRequest,
  ProductCategory,
  CreateProductCategoryRequest,
  UpdateProductCategoryRequest
} from './product.service'

export type {
  News,
  NewsFormData,
  CreateNewsRequest,
  UpdateNewsRequest
} from './news.service'

export type {
  LinkData,
  MenuItem,
  CreateLinkRequest,
  UpdateLinkRequest,
  CreateMenuItemRequest,
  UpdateMenuItemRequest
} from './links.service'

export type {
  WidgetInstance,
  WidgetApiResponse
} from './widgets.service'

export type {
  CreatePosOrderRequest,
  CreatePosOrderItemRequest
} from './orders.service'

export type {
  CashBookFilterRequest,
  CashBookItem,
  CashBookResponseData,
  MethodBreakdownEntry,
  DocumentKindBreakdown
} from './cashbook.service'

export type {
  CreatePriceBookRequest,
  CreatePriceBookResponse
} from './pricebooks.service'

export type {
  CalculateRefundRequest,
  CalculateRefundRequestItem,
  CalculateRefundResponseData
} from './returns.service'
