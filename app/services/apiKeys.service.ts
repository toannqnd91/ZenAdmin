import { BaseService } from './base.service'

export interface ApiKey {
    id: number
    name: string
    description: string
    permissions: string[]
    keyPrefix: string
    fullKey: string
    maskedKey: string
    isActive: boolean
    lastUsedAt: string | null
    expiresAt: string | null
    totalCalls: number
    allowedIPs: string | null
    rateLimitPerMinute: number
    createdBy: string
    createdAt: string
}

export interface CreateApiKeyRequest {
    name: string
    description?: string
    expiresAt?: string
    allowedIPs?: string
    rateLimit?: number
}

export interface ApiKeysResponse {
    code: number
    success: boolean
    message: string
    data: ApiKey[]
}

class ApiKeysService extends BaseService {
    /**
     * Get all API keys for the current tenant
     */
    async getApiKeys(): Promise<ApiKeysResponse> {
        return this.get<ApiKey[]>('/ApiKeys')
    }

    /**
     * Create a new API key
     */
    async createApiKey(request: CreateApiKeyRequest): Promise<any> {
        return this.post('/ApiKeys', request)
    }

    /**
     * Delete an API key
     */
    async deleteApiKey(id: number): Promise<any> {
        return this.delete(`/ApiKeys/${id}`)
    }
}

export const apiKeysService = new ApiKeysService()
