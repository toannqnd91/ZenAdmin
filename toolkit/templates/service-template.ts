/**
 * Service Templates
 */

export const baseServiceTemplate = `import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'

export interface {{EntityName}}Item {
  id: number
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface {{EntityName}}GridResponse {
  numberOfRecords: number
  numberOfPages: number
  data: {{EntityName}}Item[]
}

export class {{ServiceName}}Service extends BaseService {
  async getList(options?: {
    pagination?: { start: number, number: number }
    search?: { name?: string | null }
    sort?: { field?: string, reverse?: boolean }
  }) {
    const body = this.createListRequestBody({
      pagination: {
        start: options?.pagination?.start ?? 0,
        number: options?.pagination?.number ?? 20
      },
      search: {
        Name: options?.search?.name ?? null
      },
      sort: {
        field: options?.sort?.field ?? 'Id',
        reverse: options?.sort?.reverse ?? false
      }
    })

    return this.post<{{EntityName}}GridResponse>(API_ENDPOINTS.{{ENDPOINT_PREFIX}}_GRID, body)
  }

  async getById(id: string | number) {
    return this.get<{{EntityName}}Item>(API_ENDPOINTS.{{ENDPOINT_PREFIX}}_BY_ID(id))
  }

  async create(data: Partial<{{EntityName}}Item>) {
    return this.post(API_ENDPOINTS.{{ENDPOINT_PREFIX}}_CREATE, data)
  }

  async update(id: string | number, data: Partial<{{EntityName}}Item>) {
    return this.put(API_ENDPOINTS.{{ENDPOINT_PREFIX}}_BY_ID(id), data)
  }

  async delete(id: string | number) {
    return this.delete(API_ENDPOINTS.{{ENDPOINT_PREFIX}}_BY_ID(id))
  }
}

export const {{serviceName}}Service = new {{ServiceName}}Service()
`

export const cachedServiceTemplate = `import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'

export interface {{EntityName}}Item {
  id: number
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface {{EntityName}}GridResponse {
  numberOfRecords: number
  numberOfPages: number
  data: {{EntityName}}Item[]
}

export class {{ServiceName}}Service extends BaseService {
  private _cache: Record<string, { data: {{EntityName}}GridResponse, checksum: string, ts: number }> = {}

  private checksum(d: {{EntityName}}GridResponse) {
    try {
      return JSON.stringify({
        data: d.data,
        numberOfRecords: d.numberOfRecords,
        numberOfPages: d.numberOfPages
      })
    } catch {
      return ''
    }
  }

  async getList(options?: {
    pagination?: { start: number, number: number }
    search?: { name?: string | null }
    sort?: { field?: string, reverse?: boolean }
  }) {
    const body = this.createListRequestBody({
      pagination: {
        start: options?.pagination?.start ?? 0,
        number: options?.pagination?.number ?? 20
      },
      search: {
        Name: options?.search?.name ?? null
      },
      sort: {
        field: options?.sort?.field ?? 'Id',
        reverse: options?.sort?.reverse ?? false
      }
    })

    return this.post<{{EntityName}}GridResponse>(API_ENDPOINTS.{{ENDPOINT_PREFIX}}_GRID, body)
  }

  async getListCached(
    options?: {
      pagination?: { start: number, number: number }
      search?: { name?: string | null }
      sort?: { field?: string, reverse?: boolean }
    },
    opts?: { onUpdated?: (data: {{EntityName}}GridResponse) => void }
  ): Promise<{ data: {{EntityName}}GridResponse, fromCache: boolean, refreshPromise?: Promise<boolean> }> {
    const key = JSON.stringify(options)
    const cached = this._cache[key]
    
    if (cached) {
      const refreshPromise = this.getList(options)
        .then((res) => {
          if (!res.success || !res.data) return false
          const nextSum = this.checksum(res.data)
          if (nextSum !== cached.checksum) {
            this._cache[key] = { data: res.data, checksum: nextSum, ts: Date.now() }
            if (opts?.onUpdated) opts.onUpdated(res.data)
            return true
          }
          return false
        })
        .catch(() => false)
      return { data: cached.data, fromCache: true, refreshPromise }
    }
    
    const fresh = await this.getList(options)
    if (!fresh.success || !fresh.data) {
      return { data: { data: [], numberOfRecords: 0, numberOfPages: 1 }, fromCache: false }
    }
    this._cache[key] = { data: fresh.data, checksum: this.checksum(fresh.data), ts: Date.now() }
    return { data: fresh.data, fromCache: false }
  }

  async getById(id: string | number) {
    return this.get<{{EntityName}}Item>(API_ENDPOINTS.{{ENDPOINT_PREFIX}}_BY_ID(id))
  }

  async create(data: Partial<{{EntityName}}Item>) {
    return this.post(API_ENDPOINTS.{{ENDPOINT_PREFIX}}_CREATE, data)
  }

  async update(id: string | number, data: Partial<{{EntityName}}Item>) {
    return this.put(API_ENDPOINTS.{{ENDPOINT_PREFIX}}_BY_ID(id), data)
  }

  async delete(id: string | number) {
    return this.delete(API_ENDPOINTS.{{ENDPOINT_PREFIX}}_BY_ID(id))
  }
}

export const {{serviceName}}Service = new {{ServiceName}}Service()
`
