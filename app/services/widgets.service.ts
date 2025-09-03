import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'
import type { ApiResponse } from '@/types/common'

export interface WidgetInstance {
  id: number
  name: string
  widgetType: string
  widgetZone: string
  createdOn: string
  editUrl: string
  publishStart: string
  publishEnd: string | null
  displayOrder: number
}

export interface WidgetZone {
  id: number
  name: string
  description: string | null
}

export interface WidgetApiResponse {
  code: string
  success: boolean
  message: string
  data: WidgetInstance[]
}

export interface CarouselWidgetItem {
  image: string
  imageUrl: string
  caption: string
  subCaption: string
  linkText: string
  targetUrl: string
  sortOrder: number
}

// Custom Data widget item
export interface CustomDataWidgetItem {
  caption: string
  subCaption: string
  imageUrl: string
  linkText: string
  targetUrl: string
  sortOrder: number
}

// Create Custom Data widget request
export interface CreateCustomDataWidgetRequest {
  id: number
  name: string
  widgetZoneId: number
  publishStart: string | null
  publishEnd: string | null
  displayOrder: number
  items: CustomDataWidgetItem[]
}

export interface CreateCarouselWidgetRequest {
  id: number
  name: string
  widgetZoneId: number
  publishStart: string
  publishEnd: string
  displayOrder: number
  items: CarouselWidgetItem[]
}

export interface CarouselWidgetData {
  items: CarouselWidgetItem[]
  id: number
  name: string
  widgetZoneId: number
  publishStart: string
  publishEnd: string
  displayOrder: number
}

export interface CarouselWidgetResponse {
  code: string
  success: boolean
  message: string
  data: CarouselWidgetData
}
// Simple news widget
export interface SimpleNewsWidgetData {
  id: number
  name: string
  widgetZoneId: number
  publishStart: string
  publishEnd: string
  displayOrder: number
  news: Array<{
    id: number
    name: string
    isPublished: boolean
  }>
}

// Create simple news widget request (same shape as data, id should be 0 for create)
export type CreateSimpleNewsWidgetRequest = SimpleNewsWidgetData

export interface NewsWidgetSetting {
  numberOfNews: number
  categoryId: number | null
  orderBy: number
  featuredOnly: boolean
}

export interface CreateNewsWidgetRequest {
  id: number
  name: string
  widgetZoneId: number
  publishStart: string | null
  publishEnd: string | null
  displayOrder: number
  setting: NewsWidgetSetting
}

export interface CreateWidgetApiResponse {
  code: string
  success: boolean
  message: string
  data: null
}

export class WidgetsService extends BaseService {
  /**
   * Create custom data widget
  import { BaseService } from './base.service'
  import { API_ENDPOINTS } from '@/utils/api'
  import type { ApiResponse } from '@/types/common'

  export interface SimpleNewsWidgetData {
    id: number;
    name: string;
    widgetZoneId: number;
    publishStart: string;
    publishEnd: string;
    displayOrder: number;
    news: Array<{
      id: number;
      name: string;
      isPublished: boolean;
    }>;
  }

  export interface SimpleNewsWidgetResponse {
    code: string;
    success: boolean;
    message: string;
    data: SimpleNewsWidgetData;
  }
   */
  async getWidgets() {
    return this.get<WidgetInstance[]>(API_ENDPOINTS.WIDGET_INSTANCES)
  }

  /**
   * Reorder widget instances
   */
  async reorderWidgets(items: { id: number, displayOrder: number }[]) {
    return this.post(API_ENDPOINTS.WIDGET_INSTANCES_REORDER, { items })
  }

  /**
   * Get all widget zones
   */
  async getWidgetZones(): Promise<ApiResponse<WidgetZone[]>> {
    return this.get<WidgetZone[]>(API_ENDPOINTS.WIDGET_ZONES)
  }

  /**
   * Create carousel widget
   */
  async createCarouselWidget(data: CreateCarouselWidgetRequest) {
    return this.post<CreateWidgetApiResponse>(API_ENDPOINTS.CAROUSEL_WIDGET, data)
  }

  /**
   * Create custom data widget
   */
  async createCustomDataWidget(data: CreateCustomDataWidgetRequest) {
    return this.post<CreateWidgetApiResponse>(API_ENDPOINTS.CUSTOM_DATA_WIDGETS, data)
  }

  /**
   * Create news widget
   */
  async createNewsWidget(data: CreateNewsWidgetRequest): Promise<ApiResponse<null>> {
    return this.post<null>(API_ENDPOINTS.NEWS_WIDGET, data)
  }

  /**
   * Get news widget by ID
   */
  async getNewsWidget(id: number): Promise<ApiResponse<CreateNewsWidgetRequest>> {
    return this.get<CreateNewsWidgetRequest>(API_ENDPOINTS.NEWS_WIDGET_BY_ID(id))
  }

  /**
   * Update news widget by ID
   */
  async updateNewsWidget(id: number, data: CreateNewsWidgetRequest): Promise<ApiResponse<null>> {
    return this.put<null>(API_ENDPOINTS.NEWS_WIDGET_BY_ID(id), data)
  }

  /**
   * Update carousel widget by ID
   */
  async updateCarouselWidget(id: number, data: CreateCarouselWidgetRequest) {
    return this.put<CreateWidgetApiResponse>(API_ENDPOINTS.CAROUSEL_WIDGET_BY_ID(id), data)
  }

  /**
   * Get carousel widget by ID
   */
  async getCarouselWidget(id: number): Promise<ApiResponse<CarouselWidgetData>> {
    return this.get<CarouselWidgetData>(API_ENDPOINTS.CAROUSEL_WIDGET_BY_ID(id))
  }

  /**
   * Get custom data widget by ID
   */
  async getCustomDataWidget(id: number) {
    return this.get(API_ENDPOINTS.CUSTOM_DATA_WIDGET_BY_ID(id))
  }

  /**
   * Update custom data widget by ID
   */
  async updateCustomDataWidget(id: number, data: CreateCustomDataWidgetRequest) {
    return this.put(API_ENDPOINTS.CUSTOM_DATA_WIDGET_BY_ID(id), data)
  }

  /**
   * Get simple news widget by ID
   */
  async getSimpleNewsWidget(id: number): Promise<ApiResponse<SimpleNewsWidgetData>> {
    return this.get<SimpleNewsWidgetData>(API_ENDPOINTS.SIMPLE_NEWS_WIDGET_BY_ID(id))
  }

  /**
   * Update simple news widget by ID
   */
  async updateSimpleNewsWidget(id: number, data: SimpleNewsWidgetData): Promise<ApiResponse<null>> {
    return this.put<null>(API_ENDPOINTS.SIMPLE_NEWS_WIDGET_BY_ID(id), data)
  }

  /**
   * Create simple news widget
   */
  async createSimpleNewsWidget(data: CreateSimpleNewsWidgetRequest): Promise<ApiResponse<null>> {
    return this.post<null>(API_ENDPOINTS.SIMPLE_NEWS_WIDGETS, data)
  }
}

// Export singleton instance
export const widgetsService = new WidgetsService()
