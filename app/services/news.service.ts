import { BaseService } from './base.service'
import type { NewsCategory } from '@/types/newsCategory'

export interface News {
  id: number
  title: string
  content: string
  description: string
  imageUrl: string | null
  url: string
  categoryId: number
  category: NewsCategory
  publishDate: string
  isPublished: boolean
  views: number
  createdAt: string
}

export interface CreateNewsRequest {
  title: string
  content: string
  description: string
  categoryId: number
  imageUrl?: string
  isPublished?: boolean
}

export interface UpdateNewsRequest extends Partial<CreateNewsRequest> {
  id: number
}

export class NewsService extends BaseService {
  /**
   * Get all news categories
   */
  async getCategories() {
    const body = this.createListRequestBody()
    return this.post<NewsCategory[]>('/NewsCategories', body)
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
    
    return this.post<News[]>('/News', body)
  }

  /**
   * Get single news by ID
   */
  async getNewsById(id: number) {
    return this.get<News>(`/News/${id}`)
  }

  /**
   * Create new news
   */
  async createNews(data: CreateNewsRequest) {
    return this.post<News>('/News', data)
  }

  /**
   * Update news
   */
  async updateNews(data: UpdateNewsRequest) {
    return this.put<News>(`/News/${data.id}`, data)
  }

  /**
   * Delete news
   */
  async deleteNews(id: number) {
    return this.delete(`/News/${id}`)
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
    return this.post<NewsCategory>('/NewsCategories', data)
  }

  /**
   * Update news category
   */
  async updateCategory(id: number, data: {
    name?: string
    description?: string
    imageUrl?: string
    icon?: string
  }) {
    return this.put<NewsCategory>(`/NewsCategories/${id}`, data)
  }

  /**
   * Delete news category
   */
  async deleteCategory(id: number) {
    return this.delete(`/NewsCategories/${id}`)
  }
}

// Export singleton instance
export const newsService = new NewsService()
