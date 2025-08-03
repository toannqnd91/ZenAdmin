import { BaseService } from './base.service'
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

export interface CreateWidgetApiResponse {
  code: string
  success: boolean
  message: string
  data: null
}

export class WidgetsService extends BaseService {
  /**
   * Create custom data widget
   */
  async createCustomDataWidget(data: any) {
    return this.post('/custom-data-widgets', data)
  }
  /**
   * Get all widgets
   */
  async getWidgets() {
    return this.get<WidgetInstance[]>('/widget-instances')
  }

  /**
   * Get all widget zones
   */
  async getWidgetZones(): Promise<ApiResponse<WidgetZone[]>> {
    return this.get<WidgetZone[]>('/widget-zones')
  }

  /**
   * Create carousel widget
   */
  async createCarouselWidget(data: CreateCarouselWidgetRequest) {
    return this.post<CreateWidgetApiResponse>('/widgets/carousel-widgets', data)
  }

  /**
   * Update carousel widget by ID
   */
  async updateCarouselWidget(id: number, data: CreateCarouselWidgetRequest) {
    return this.put<CreateWidgetApiResponse>(`/CarouselWidget/${id}`, data)
  }

  /**
   * Get carousel widget by ID
   */
  async getCarouselWidget(id: number): Promise<ApiResponse<CarouselWidgetData>> {
    return this.get<CarouselWidgetData>(`/CarouselWidget/${id}`)
  }

  /**
   * Get custom data widget by ID
   */
  async getCustomDataWidget(id: number) {
    return this.get(`/custom-data-widgets/${id}`)
  }

  /**
   * Update custom data widget by ID
   */
  async updateCustomDataWidget(id: number, data: any) {
    return this.put(`/custom-data-widgets/${id}`, data)
  }

  // You can add more CRUD methods here as needed
  // async getWidgetById(id: number) { ... }
  // async updateWidget(id: number, data: ...) { ... }
  // async deleteWidget(id: number) { ... }
}

// Export singleton instance
export const widgetsService = new WidgetsService()
