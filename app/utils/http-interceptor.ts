
import type { ApiResponse } from '@/types/common'
import { getApiEndpoints } from '@/utils/api'

/**
 * HTTP interceptor for handling authentication and automatic token refresh
 */
export class HttpInterceptor {
  private isRefreshing = false
  private refreshPromise: Promise<any> | null = null

  async request(url: string, options: RequestInit = {}): Promise<Response> {
    // Add auth headers
    const headers = await this.addAuthHeaders(options.headers)
    
    const response = await fetch(url, {
      ...options,
      headers
    })

    // Handle 401 - token expired
    if (response.status === 401) {
      const refreshedResponse = await this.handleUnauthorized(url, options)
      if (refreshedResponse) {
        return refreshedResponse
      }
    }

    return response
  }

  private async addAuthHeaders(existingHeaders?: HeadersInit): Promise<Headers> {
    const headers = new Headers(existingHeaders)
    
    // Set default content type with UTF-8 charset if not exists,
    // but skip if explicitly set to empty (for FormData uploads)
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json; charset=utf-8')
    } else if (headers.get('Content-Type') === '') {
      // Remove empty Content-Type to let browser set it for FormData
      headers.delete('Content-Type')
    }

    try {
      // Get access token from cookie (consistent with useAuth)
      const accessTokenCookie = useCookie('access_token')
      if (accessTokenCookie.value) {
        // Decode the token if it's encoded
        let token = accessTokenCookie.value
        try {
          // Try to decode if it's base64 encoded
          const decoded = process.client ? atob(token) : Buffer.from(token, 'base64').toString('utf8')
          token = decoded
        } catch {
          // If decode fails, use as is
        }
        headers.set('Authorization', `Bearer ${token}`)
      }
    } catch (error) {
      console.debug('Could not get auth token:', error)
    }

    return headers
  }

  private async handleUnauthorized(
    originalUrl: string, 
    originalOptions: RequestInit
  ): Promise<Response | null> {
    try {
      // Prevent multiple refresh attempts
      if (this.isRefreshing) {
        await this.refreshPromise
        // Retry with new token
        return this.retryWithNewToken(originalUrl, originalOptions)
      }

      this.isRefreshing = true
      this.refreshPromise = this.refreshToken()
      
      await this.refreshPromise
      
      // Retry original request with new token
      return this.retryWithNewToken(originalUrl, originalOptions)
    } catch (error) {
      console.error('Token refresh failed:', error)
      
      // Clear tokens and redirect to login
      await this.handleRefreshFailure()
      return null
    } finally {
      this.isRefreshing = false
      this.refreshPromise = null
    }
  }

  private async refreshToken(): Promise<void> {
    const refreshTokenCookie = useCookie('refresh_token')
    
    if (!refreshTokenCookie.value) {
      throw new Error('No refresh token available')
    }

    const endpoints = getApiEndpoints()
    const response = await fetch(endpoints.refreshToken, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        refreshToken: refreshTokenCookie.value
      })
    })

    if (!response.ok) {
      throw new Error('Token refresh failed')
    }

    const data: ApiResponse<any> = await response.json()
    
    if (!data.success) {
      throw new Error(data.message)
    }

    // Update tokens (consistent with useAuth)
    const accessTokenCookie = useCookie('access_token')
    // Encode the token like useAuth does
    const encodedToken = process.client ? btoa(data.data.accessToken) : Buffer.from(data.data.accessToken).toString('base64')
    accessTokenCookie.value = encodedToken
    
    if (data.data.refreshToken) {
      refreshTokenCookie.value = data.data.refreshToken
    }
  }

  private async retryWithNewToken(
    url: string, 
    options: RequestInit
  ): Promise<Response> {
    const headers = await this.addAuthHeaders(options.headers)
    
    return fetch(url, {
      ...options,
      headers
    })
  }

  private async handleRefreshFailure(): Promise<void> {
    // Clear all auth-related cookies (consistent with useAuth)
    const accessTokenCookie = useCookie('access_token')
    const refreshTokenCookie = useCookie('refresh_token')
    
    accessTokenCookie.value = null
    refreshTokenCookie.value = null

    // Show notification
    const toast = useToast()
    toast.add({
      title: 'Phiên đăng nhập hết hạn',
      description: 'Vui lòng đăng nhập lại',
      color: 'error'
    })

    // Redirect to login
    const router = useRouter()
    await router.push('/login')
  }
}

// Create singleton instance
export const httpInterceptor = new HttpInterceptor()
