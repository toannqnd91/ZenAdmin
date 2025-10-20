import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'
import type { NewsCategory } from '@/types/newsCategory'

export interface News {
  id: number
  title: string
  content: string
  desc: string // Changed from description to match API response
  imageUrl: string | null
  url: string
  categoryId?: number // Make optional since some items don't have it
  categories: Array<{ id: number, name: string, url: string | null }> // Changed to match API response
  createdDate: string // Changed from publishDate to match API response
  createdBy: string | null
  updatedDate: string
  updatedBy: string | null
  tags: string[] | null
}

export interface NewsListResponse {
  items: News[]
  totalRecord: number
  numberOfPages: number
}

export interface NewsFormData {
  title: string
  desc: string
  content: string
  imageUrl?: string
  tags?: string[]
  categoryIds: number[]
}

export type CreateNewsRequest = NewsFormData

export interface UpdateNewsRequest extends NewsFormData {
  id: number
}

export class NewsService extends BaseService {
  /**
   * Get all news categories
   */
  async getCategories() {
    const body = this.createListRequestBody()
    return this.post<NewsCategory[]>(API_ENDPOINTS.NEWS_CATEGORIES, body)
  }

  /**
   * Get news list
   */
  async getNews(options?: {
    categoryId?: number
    search?: string
    pagination?: { start: number, number: number }
    sort?: { field: string, reverse: boolean }
  }) {
    const body = this.createListRequestBody({
      pagination: options?.pagination,
      search: {
        CategoryId: options?.categoryId || null,
        Title: options?.search || null
      },
      sort: options?.sort
    })
    const response = await this.post<NewsListResponse>(
      API_ENDPOINTS.NEWS,
      body
    )
    return response
  }

  /**
   * Get single news by ID
   */
  async getNewsById(id: number) {
    return this.get<News>(API_ENDPOINTS.NEWS_BY_ID(id))
  }

  /**
   * Create new news
   */
  async createNews(data: CreateNewsRequest) {
    return this.post<boolean>(API_ENDPOINTS.NEWS_CREATE, data)
  }

  /**
   * Update news
   */
  async updateNews(id: number, data: NewsFormData) {
    return this.put<boolean>(API_ENDPOINTS.NEWS_UPDATE(id), data)
  }

  /**
   * Delete news
   */
  async deleteNews(id: number) {
    return this.delete(API_ENDPOINTS.NEWS_DELETE(id))
  }

  /**
   * Create news category
   */
  async createCategory(data: {
    name: string
    description: string
    imageUrl?: string
    icon?: string
  }) {
    return this.post<NewsCategory>(API_ENDPOINTS.NEWS_CATEGORIES, data)
  }

  /**
   * Update news category
   */
  async updateCategory(
    id: number,
    data: {
      name?: string
      description?: string
      imageUrl?: string
      icon?: string
    }
  ) {
    return this.put<NewsCategory>(API_ENDPOINTS.NEWS_CATEGORY_BY_ID(id), data)
  }

  /**
   * Delete multiple news
   * Backend đã đổi HttpDelete sang POST
   */
  async deleteNewsMulti(ids: number[]) {
    return this.post(API_ENDPOINTS.NEWS_DELETE_MULTI, ids)
  }

  /**
   * Delete news category
   */
  async deleteCategory(id: number) {
    return this.delete(API_ENDPOINTS.NEWS_CATEGORY_BY_ID(id))
  }
}

// Export singleton instance
export const newsService = new NewsService()
