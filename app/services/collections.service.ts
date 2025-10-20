import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'
import type { Collection } from '@/composables/useCollectionsService'

export interface CollectionListResponse {
  items: Collection[]
  totalRecord: number
  numberOfPages: number
}

export interface CollectionListOptions {
  search?: string
  pagination?: { start: number, number: number }
  sort?: { field: string, reverse: boolean }
}

export class CollectionsService extends BaseService {
  /**
   * Get all collections
   */
  async getCollections(options?: CollectionListOptions) {
    const searchObj: Record<string, unknown> = {
      Name: options?.search ?? null
    }
    const body = this.createListRequestBody({
      pagination: options?.pagination,
      search: searchObj,
      sort: options?.sort
    })
    return this.post<CollectionListResponse>(API_ENDPOINTS.COLLECTIONS, body)
  }
}

export const collectionsService = new CollectionsService()
