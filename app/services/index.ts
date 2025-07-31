// Export all services for easy importing
export { BaseService } from './base.service'
export { authService, AuthService } from './auth.service'
export { dashboardService, DashboardService } from './dashboard.service'
export { newsService, NewsService } from './news.service'
export { productService, ProductService } from './product.service'
export { fileService, FileService } from './file.service'
export { admissionService, scholarshipService, AdmissionService, ScholarshipService } from './admission.service'
export { linksService, LinksService } from './links.service'
export { widgetsService, WidgetsService } from './widgets.service'

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
  AdmissionApplication,
  CreateAdmissionApplicationRequest
} from './admission.service'

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