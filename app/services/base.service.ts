import type { ApiResponse, ApiRequestBody } from '@/types/common'
import { httpInterceptor } from '@/utils/http-interceptor'
import { getApiBaseUrl } from '@/utils/api'

export abstract class BaseService {
  protected baseURL: string

  constructor(baseURL?: string) {
    // Use runtime config API base URL if available, otherwise fallback to provided URL or default
    try {
      this.baseURL = baseURL || getApiBaseUrl()
    } catch {
      // Fallback for server-side or when runtime config is not available
      this.baseURL = baseURL || process.env.NUXT_PUBLIC_API_BASE_URL || 'https://demo.cokhitamlong.vn/api/v1'
    }
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`
    
    // Log request details
    console.log('[BaseService] API Request:', {
      method: options.method || 'GET',
      url,
      body: options.body ? JSON.parse(options.body as string) : undefined,
      headers: (options as any).headers,
      // Log authorization token for debugging
      authToken: (options as any).headers?.Authorization || 'No token'
    })
    
    try {
      const response = await httpInterceptor.request(url, options)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        })
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorData.message || ''}`)
      }

      const data = await response.json()
      console.log('API Success Response:', data)
      return data as ApiResponse<T>
    } catch (error) {
      console.error('API Request failed:', error)
      throw error
    }
  }

  protected get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint
    return this.request<T>(url, { method: 'GET' })
  }

  protected post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  protected put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  protected delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  protected patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // Helper method to create standard request body for list endpoints
  protected createListRequestBody(options?: {
    pagination?: Partial<{ start: number, number: number, numberOfPages: number }>
    search?: Record<string, any>
    sort?: { field: string, reverse: boolean }
  }): ApiRequestBody {
    return {
      Pagination: {
        Start: options?.pagination?.start || 0,
        TotalItemCount: 0,
        Number: options?.pagination?.number || 20,
        NumberOfPages: options?.pagination?.numberOfPages || 10
      },
      Search: {
        QueryObject: options?.search || {}
      },
      Sort: {
        Field: options?.sort?.field || 'Id',
        Reverse: options?.sort?.reverse || false
      }
    }
  }
}
