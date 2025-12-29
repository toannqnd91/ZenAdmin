import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'
import type { NewsCategory } from '@/types/newsCategory'

export class NewsCategoryService extends BaseService {
  /**
   * Get all news categories
   */
  async getCategories() {
    return this.get<NewsCategory[]>(API_ENDPOINTS.NEWS_CATEGORIES)
  }

  /**
   * Get category by id
   */
  async getCategory(id: number) {
    return this.get<NewsCategory>(API_ENDPOINTS.NEWS_CATEGORY_DETAIL(id))
  }

  /**
   * Create news category
   */
  async createCategory(data: Partial<NewsCategory>) {
    return this.post<NewsCategory>(API_ENDPOINTS.NEWS_CATEGORY_CREATE, data)
  }

  /**
   * Update category
   */
  async updateCategory(id: number, data: Partial<NewsCategory>) {
    return this.put<NewsCategory>(`${API_ENDPOINTS.NEWS_CATEGORY_UPDATE(id)}`, data)
  }

  /**
   * Delete category
   */
  async deleteCategory(id: number) {
    return this.delete(`${API_ENDPOINTS.NEWS_CATEGORIES}/${id}`)
  }
}

export const newsCategoryService = new NewsCategoryService()
