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

export interface CreateCollectionRequest {
  name: string
  description?: string
  imageUrl?: string
  isPublished?: boolean
}

export interface UpdateCollectionRequest extends Partial<CreateCollectionRequest> {
  id: number
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

  /**
   * Create new collection
   */
  async createCollection(data: CreateCollectionRequest) {
    return this.post<Collection>(API_ENDPOINTS.COLLECTIONS, data)
  }

  /**
   * Update collection
   */
  async updateCollection(data: UpdateCollectionRequest) {
    // Use explicit update endpoint per backend spec: /Collection/{id}/update
    return this.put<Collection>(API_ENDPOINTS.COLLECTION_UPDATE(data.id), {
      id: data.id,
      name: data.name,
      description: data.description,
      imageUrl: data.imageUrl,
      isPublished: data.isPublished
    })
  }

  /**
   * Delete collection
   */
  async deleteCollection(id: number) {
    return this.delete(`${API_ENDPOINTS.COLLECTIONS}/${id}`)
  }
}

export const collectionsService = new CollectionsService()
