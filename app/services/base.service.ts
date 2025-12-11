import type { ApiResponse, ApiRequestBody } from '@/types/common'
import { httpInterceptor } from '@/utils/http-interceptor'
import { logger } from '@/utils/logger'
import { errorTracker } from '@/utils/error-tracker'
import { apiCache } from '@/utils/cache-manager'
import { performanceMonitor } from '@/utils/performance-monitor'

export abstract class BaseService {
  protected baseURL: string

  constructor(baseURL?: string) {
    // Chỉ lưu baseURL được truyền vào, không gọi composable
    this.baseURL = baseURL || ''
  }

  protected async requestBlob(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Blob> {
    const baseURL = this.getBaseURL()
    const url = endpoint.startsWith('http') ? endpoint : `${baseURL}${endpoint}`
    const method = options.method || 'GET'
    const metricName = `${this.constructor.name}.${method}.${endpoint}.blob`

    performanceMonitor.start(metricName)
    logger.debug('API Blob Request initiated', {
      service: this.constructor.name,
      method,
      url,
      endpoint
    })

    try {
      const response = await httpInterceptor.request(url, options)
      if (!response.ok) {
        const raw = await response.text().catch(() => '')
        let errorData: any = {}
        if (raw) {
          try {
            errorData = JSON.parse(raw)
          } catch {
            errorData = { message: raw }
          }
        }
        const errorDuration = performanceMonitor.end(metricName, {
          service: this.constructor.name,
          method,
          endpoint,
          statusCode: response.status,
          success: false
        })
        logger.error('API Blob Request failed', {
          service: this.constructor.name,
          method,
          url,
          endpoint,
          statusCode: response.status,
          statusText: response.statusText,
          duration: errorDuration,
          errorData
        })
        const parts: string[] = []
        const push = (v?: unknown) => {
          if (!v) return
          const s = typeof v === 'string' ? v : JSON.stringify(v)
          if (s && !parts.includes(s)) parts.push(s)
        }
        if (errorData?.message) push(errorData.message)
        if (errorData?.error) push(errorData.error)
        if (Array.isArray(errorData?.errors)) push(errorData.errors.join('\n'))
        if (errorData?.Errors && typeof errorData.Errors === 'object') {
          for (const [k, v] of Object.entries(errorData.Errors)) {
            push(`${k}: ${(Array.isArray(v) ? v.join(', ') : String(v))}`)
          }
        }
        if (errorData?.ModelState && typeof errorData.ModelState === 'object') {
          for (const [k, v] of Object.entries(errorData.ModelState)) {
            push(`${k}: ${(Array.isArray(v) ? v.join(', ') : String(v))}`)
          }
        }
        push(errorData?.title)
        push(errorData?.detail)
        if (parts.length === 0 && raw) push(raw)
        const msg = parts.filter(Boolean).join(' \n ')
        const error = new Error(`API Error ${response.status} ${response.statusText}${msg ? `: ${msg}` : ''}`)
        errorTracker.captureApiError(endpoint, method, response.status, error, {
          service: this.constructor.name,
          errorData
        })
        throw error
      }

      const blob = await response.blob()
      const duration = performanceMonitor.end(metricName, {
        service: this.constructor.name,
        method,
        endpoint,
        statusCode: response.status,
        success: true
      })
      logger.info('API Blob Request succeeded', {
        service: this.constructor.name,
        method,
        url,
        endpoint,
        statusCode: response.status,
        duration,
        size: blob.size
      })
      return blob
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      const duration = performanceMonitor.end(metricName, {
        service: this.constructor.name,
        method,
        endpoint,
        success: false,
        error: err
      })
      logger.error('API Blob Request exception', {
        service: this.constructor.name,
        method,
        url,
        endpoint,
        duration,
        error: err
      })

      errorTracker.captureException(err, {
        service: this.constructor.name,
        action: `${method} ${endpoint}`,
        url
      })

      throw err
    }
  }

  protected async requestText(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<string> {
    const baseURL = this.getBaseURL()
    const url = endpoint.startsWith('http') ? endpoint : `${baseURL}${endpoint}`
    const method = options.method || 'GET'
    const metricName = `${this.constructor.name}.${method}.${endpoint}.text`

    performanceMonitor.start(metricName)
    logger.debug('API Text Request initiated', {
      service: this.constructor.name,
      method,
      url,
      endpoint
    })

    try {
      const response = await httpInterceptor.request(url, options)
      if (!response.ok) {
        const raw = await response.text().catch(() => '')
        let errorData: any = {}
        if (raw) {
          try {
            errorData = JSON.parse(raw)
          } catch {
            errorData = { message: raw }
          }
        }
        const errorDuration = performanceMonitor.end(metricName, {
          service: this.constructor.name,
          method,
          endpoint,
          statusCode: response.status,
          success: false
        })

        logger.error('API Text Request failed', {
          service: this.constructor.name,
          method,
          url,
          endpoint,
          statusCode: response.status,
          statusText: response.statusText,
          duration: errorDuration,
          errorData
        })

        const parts: string[] = []
        const push = (v?: unknown) => {
          if (!v) return
          const s = typeof v === 'string' ? v : JSON.stringify(v)
          if (s && !parts.includes(s)) parts.push(s)
        }
        if (errorData?.message) push(errorData.message)
        if (errorData?.error) push(errorData.error)
        if (Array.isArray(errorData?.errors)) push(errorData.errors.join('\n'))
        if (errorData?.Errors && typeof errorData.Errors === 'object') {
          for (const [k, v] of Object.entries(errorData.Errors)) {
            push(`${k}: ${(Array.isArray(v) ? v.join(', ') : String(v))}`)
          }
        }
        if (errorData?.ModelState && typeof errorData.ModelState === 'object') {
          for (const [k, v] of Object.entries(errorData.ModelState)) {
            push(`${k}: ${(Array.isArray(v) ? v.join(', ') : String(v))}`)
          }
        }
        push(errorData?.title)
        push(errorData?.detail)
        if (parts.length === 0 && raw) push(raw)

        const msg = parts.filter(Boolean).join(' \n ')
        const error = new Error(`API Error ${response.status} ${response.statusText}${msg ? `: ${msg}` : ''}`)
        errorTracker.captureApiError(endpoint, method, response.status, error, {
          service: this.constructor.name,
          errorData
        })
        throw error
      }

      const text = await response.text()
      const duration = performanceMonitor.end(metricName, {
        service: this.constructor.name,
        method,
        endpoint,
        statusCode: response.status,
        success: true
      })
      logger.info('API Text Request succeeded', {
        service: this.constructor.name,
        method,
        url,
        endpoint,
        statusCode: response.status,
        duration,
        contentLength: text.length
      })
      return text
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      const duration = performanceMonitor.end(metricName, {
        service: this.constructor.name,
        method,
        endpoint,
        success: false,
        error: err
      })
      logger.error('API Request exception', {
        service: this.constructor.name,
        method,
        url,
        endpoint,
        duration,
        error: err
      })

      errorTracker.captureException(err, {
        service: this.constructor.name,
        action: `${method} ${endpoint}`,
        url
      })

      throw err
    }
  }

  protected getBaseURL(): string {
    // Lazy load chỉ khi cần và chưa có baseURL
    if (!this.baseURL) {
      // Gọi useRuntimeConfig trực tiếp, không cache global
      const config = useRuntimeConfig()
      this.baseURL = config.public.apiBaseUrl
    }
    return this.baseURL
  }

  private getBodyForLogging(body: BodyInit | null | undefined): unknown {
    if (!body) return undefined
    if (body instanceof FormData) return '[FormData]'
    if (typeof body === 'string') {
      try {
        return JSON.parse(body)
      } catch {
        return body
      }
    }
    return body
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const baseURL = this.getBaseURL()
    const url = endpoint.startsWith('http') ? endpoint : `${baseURL}${endpoint}`
    const method = options.method || 'GET'
    const metricName = `${this.constructor.name}.${method}.${endpoint}`
    
    // Start performance monitoring
    performanceMonitor.start(metricName)

    // Structured logging for API request
    logger.debug('API Request initiated', {
      service: this.constructor.name,
      method,
      url,
      endpoint,
      requestBody: this.getBodyForLogging(options.body)
    })

    try {
      const response = await httpInterceptor.request(url, options)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // End performance monitoring for error case
        const errorDuration = performanceMonitor.end(metricName, {
          service: this.constructor.name,
          method,
          endpoint,
          statusCode: response.status,
          success: false
        })
        
        // Structured error logging
        logger.error('API Request failed', {
          service: this.constructor.name,
          method,
          url,
          endpoint,
          statusCode: response.status,
          statusText: response.statusText,
          duration: errorDuration,
          errorData
        })

        // Build detailed error message from common shapes
        const parts: string[] = []
        const push = (v?: unknown) => {
          if (!v) return
          const s = typeof v === 'string' ? v : JSON.stringify(v)
          if (s && !parts.includes(s)) parts.push(s)
        }
        // Our typical API envelope
        // { code, success, message, data }
        if (errorData?.message) push(errorData.message)
        if (errorData?.error) push(errorData.error)
        if (Array.isArray(errorData?.errors)) push(errorData.errors.join('\n'))
        // ASP.NET model state style
        if (errorData?.Errors && typeof errorData.Errors === 'object') {
          for (const [k, v] of Object.entries(errorData.Errors)) {
            push(`${k}: ${(Array.isArray(v) ? v.join(', ') : String(v))}`)
          }
        }
        if (errorData?.ModelState && typeof errorData.ModelState === 'object') {
          for (const [k, v] of Object.entries(errorData.ModelState)) {
            push(`${k}: ${(Array.isArray(v) ? v.join(', ') : String(v))}`)
          }
        }
        // ProblemDetails style
        push(errorData?.title)
        push(errorData?.detail)
        if (parts.length === 0) push(errorData)

        const msg = parts.filter(Boolean).join(' \n ')
        const error = new Error(`API Error ${response.status} ${response.statusText}${msg ? `: ${msg}` : ''}`)
        
        // Track error in monitoring system
        errorTracker.captureApiError(endpoint, method, response.status, error, {
          service: this.constructor.name,
          errorData
        })
        
        throw error
      }

      // Handle empty response body (e.g. for DELETE)
      let data: unknown
      const contentLength = response.headers.get('content-length')
      if (contentLength === '0') {
        data = { success: true }
      } else {
        const text = await response.text()
        if (!text) {
          data = { success: true }
        } else {
          data = JSON.parse(text)
        }
      }
      // End performance monitoring
      const duration = performanceMonitor.end(metricName, {
        service: this.constructor.name,
        method,
        endpoint,
        statusCode: response.status,
        success: true
      })
      
      // Log successful response
      logger.info('API Request succeeded', {
        service: this.constructor.name,
        method,
        url,
        endpoint,
        statusCode: response.status,
        duration,
        ...(process.dev && { body: data })
      })
      
      return data as ApiResponse<T>
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      const duration = performanceMonitor.end(metricName, {
        service: this.constructor.name,
        method,
        endpoint,
        success: false,
        error: err
      })

      // Log and track unexpected errors
      logger.error('API Request exception', {
        service: this.constructor.name,
        method,
        url,
        endpoint,
        duration,
        error: err
      })

      errorTracker.captureException(err, {
        service: this.constructor.name,
        action: `${method} ${endpoint}`,
        url
      })

      throw err
    }
  }

  protected get<T>(endpoint: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const url = params
      ? `${endpoint}?${new URLSearchParams(
        Object.fromEntries(
          Object.entries(params).map(([k, v]) => [k, v == null ? '' : String(v)])
        )
      )}`
      : endpoint
    return this.request<T>(url, { method: 'GET' })
  }

  /**
   * GET request with caching support
   */
  protected async getCached<T>(
    endpoint: string,
    params?: Record<string, unknown>,
    cacheTTL?: number
  ): Promise<ApiResponse<T>> {
    const url = params
      ? `${endpoint}?${new URLSearchParams(
        Object.fromEntries(
          Object.entries(params).map(([k, v]) => [k, v == null ? '' : String(v)])
        )
      )}`
      : endpoint
    
    const cacheKey = `${this.constructor.name}:GET:${url}`
    
    return apiCache.getOrSet(
      cacheKey,
      () => this.request<T>(url, { method: 'GET' }),
      cacheTTL
    )
  }

  /**
   * Invalidate cache for this service
   */
  protected invalidateCache(pattern?: string): void {
    const prefix = pattern || `${this.constructor.name}:`
    apiCache.invalidatePattern(prefix)
    logger.info('Cache invalidated', { service: this.constructor.name, pattern: prefix })
  }

  protected post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  protected put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  protected delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  protected patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  // Helper method to create standard request body for list endpoints
  protected createListRequestBody(options?: {
    pagination?: Partial<{ start: number, number: number, numberOfPages: number }>
    search?: Record<string, unknown>
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
