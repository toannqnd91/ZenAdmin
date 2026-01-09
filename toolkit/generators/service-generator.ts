/**
 * Service Generator
 * Generates service files following the BaseService pattern
 */

export interface ServiceGeneratorOptions {
  name: string
  entityName: string
  hasCache?: boolean
  hasCRUD?: boolean
  customMethods?: Array<{
    name: string
    method: 'get' | 'post' | 'put' | 'delete'
    hasParams?: boolean
  }>
}

export function generateServiceCode(options: ServiceGeneratorOptions): string {
  const { name, entityName, hasCache = false, hasCRUD = true, customMethods = [] } = options
  const serviceName = `${name.charAt(0).toUpperCase() + name.slice(1)}Service`
  const itemInterface = `${entityName}Item`
  const gridResponse = `${entityName}GridResponse`

  let code = `import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'
import type { ApiRequestBody } from '@/types/common'

export interface ${itemInterface} {
  id: number
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ${gridResponse} {
  numberOfRecords: number
  numberOfPages: number
  data: ${itemInterface}[]
}

export class ${serviceName} extends BaseService {
`

  if (hasCache) {
    code += `  private _cache: Record<string, { data: ${gridResponse}, checksum: string, ts: number }> = {}

  private checksum(d: ${gridResponse}) {
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

`
  }

  if (hasCRUD) {
    code += `  async getList(options?: {
    pagination?: { start: number, number: number, numberOfPages?: number }
    search?: { name?: string | null }
    sort?: { field?: string, reverse?: boolean }
  }) {
    const body: ApiRequestBody = this.createListRequestBody({
      pagination: {
        start: options?.pagination?.start ?? 0,
        number: options?.pagination?.number ?? 20,
        numberOfPages: options?.pagination?.numberOfPages ?? 10
      },
      search: {
        Name: options?.search?.name ?? null
      },
      sort: {
        field: options?.sort?.field ?? 'Id',
        reverse: options?.sort?.reverse ?? false
      }
    })

    return this.post<${gridResponse}>(API_ENDPOINTS.${name.toUpperCase()}_GRID, body)
  }

  async getById(id: string | number) {
    return this.get<${itemInterface}>(API_ENDPOINTS.${name.toUpperCase()}_BY_ID(id))
  }

  async create(data: Partial<${itemInterface}>) {
    return this.post(API_ENDPOINTS.${name.toUpperCase()}_CREATE, data)
  }

  async update(id: string | number, data: Partial<${itemInterface}>) {
    return this.put(API_ENDPOINTS.${name.toUpperCase()}_BY_ID(id), data)
  }

  async delete(id: string | number) {
    return this.delete(API_ENDPOINTS.${name.toUpperCase()}_BY_ID(id))
  }
`
  }

  if (hasCache) {
    code += `
  async getListCached(
    options?: {
      pagination?: { start: number, number: number, numberOfPages?: number }
      search?: { name?: string | null }
      sort?: { field?: string, reverse?: boolean }
    },
    opts?: { onUpdated?: (data: ${gridResponse}) => void }
  ): Promise<{ data: ${gridResponse}, fromCache: boolean, refreshPromise?: Promise<boolean> }> {
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
`
  }

  customMethods.forEach(method => {
    const methodName = method.name
    const httpMethod = method.method
    const params = method.hasParams ? 'id: string | number, data?: any' : ''
    const endpoint = method.hasParams 
      ? `API_ENDPOINTS.${name.toUpperCase()}_${methodName.toUpperCase()}(id)` 
      : `API_ENDPOINTS.${name.toUpperCase()}_${methodName.toUpperCase()}`
    
    code += `
  async ${methodName}(${params}) {
    return this.${httpMethod}(${endpoint}${method.hasParams && httpMethod !== 'get' ? ', data' : ''})
  }
`
  })

  code += `}

export const ${name}Service = new ${serviceName}()
`

  return code
}

export function generateServiceFile(options: ServiceGeneratorOptions): { path: string, content: string } {
  return {
    path: `app/services/${options.name}.service.ts`,
    content: generateServiceCode(options)
  }
}
