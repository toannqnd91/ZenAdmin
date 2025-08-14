
import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'

export interface PageItem {
  id: number
  name: string
  slug: string
  metaTitle: string
  metaKeywords: string
  metaDescription: string
  isPublished: boolean
  publishedOn: string | null
  body: string
}

export class PagesService extends BaseService {
  async getPages(options?: {
    search?: string
    pagination?: { start: number, number: number }
    sort?: { field: string, reverse: boolean }
  }) {
    const body = this.createListRequestBody({
      pagination: options?.pagination,
      search: { Name: options?.search ?? null },
      sort: options?.sort
    })
  return this.post<{ items: PageItem[], totalRecord: number, numberOfPages: number }>(API_ENDPOINTS.PAGES, body)
  }
}

export const pagesService = new PagesService()
