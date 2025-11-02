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
  // in-memory caches
  private _listCache: Record<string, { data: NewsListResponse, checksum: string, ts: number }> = {}
  private _catCache: { data: NewsCategory[], checksum: string, ts: number } | null = null

  private _listSum(d: NewsListResponse) {
    try {
      return JSON.stringify({
        totalRecord: d.totalRecord,
        numberOfPages: d.numberOfPages,
        items: d.items.map(i => ({ id: i.id, title: i.title, desc: i.desc, url: i.url, createdDate: i.createdDate }))
      })
    } catch {
      return ''
    }
  }

  private _catSum(d: NewsCategory[]) {
    try {
      return JSON.stringify(d.map(c => ({ id: c.id, name: c.name })))
    } catch {
      return ''
    }
  }
  /**
   * Get all news categories
   */
  async getCategories() {
    const body = this.createListRequestBody()
    return this.post<NewsCategory[]>(API_ENDPOINTS.NEWS_CATEGORIES, body)
  }

  async getCategoriesCached(opts?: { onUpdated?: (data: NewsCategory[]) => void }): Promise<{ data: NewsCategory[] | null, fromCache: boolean, refreshPromise?: Promise<boolean> }> {
    const cached = this._catCache
    if (cached) {
      const refreshPromise = this.getCategories().then((res) => {
        const list = Array.isArray(res?.data) ? res.data : []
        const next = this._catSum(list)
        if (next !== cached.checksum) {
          this._catCache = { data: list, checksum: next, ts: Date.now() }
          opts?.onUpdated?.(list)
          return true
        }
        return false
      }).catch(() => false)
      return { data: cached.data, fromCache: true, refreshPromise }
    }
    const res = await this.getCategories()
    const list = Array.isArray(res?.data) ? res.data : []
    this._catCache = { data: list, checksum: this._catSum(list), ts: Date.now() }
    return { data: list, fromCache: false }
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

  async getNewsCached(options?: {
    categoryId?: number
    search?: string
    pagination?: { start: number, number: number }
    sort?: { field: string, reverse: boolean }
  }, opts?: { onUpdated?: (data: NewsListResponse) => void }): Promise<{ data: NewsListResponse | null, fromCache: boolean, refreshPromise?: Promise<boolean> }> {
    const body = this.createListRequestBody({
      pagination: options?.pagination,
      search: {
        CategoryId: options?.categoryId || null,
        Title: options?.search || null
      },
      sort: options?.sort
    })
    const key = JSON.stringify(body)
    const cached = this._listCache[key]
    if (cached) {
      const refreshPromise = this.post<NewsListResponse>(API_ENDPOINTS.NEWS, body).then((res) => {
        if (!res?.success || !res.data) return false
        const next = this._listSum(res.data)
        if (next !== cached.checksum) {
          this._listCache[key] = { data: res.data, checksum: next, ts: Date.now() }
          opts?.onUpdated?.(res.data)
          return true
        }
        return false
      }).catch(() => false)
      return { data: cached.data, fromCache: true, refreshPromise }
    }
    const res = await this.post<NewsListResponse>(API_ENDPOINTS.NEWS, body)
    if (!res?.success || !res.data) return { data: null, fromCache: false }
    this._listCache[key] = { data: res.data, checksum: this._listSum(res.data), ts: Date.now() }
    return { data: res.data, fromCache: false }
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
