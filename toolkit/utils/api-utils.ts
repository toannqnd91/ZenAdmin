/**
 * API Utilities
 */

export interface ApiResponse<T = any> {
  success: boolean
  data: T | null
  message?: string
  code?: string
}

export interface PaginationParams {
  start: number
  number: number
  numberOfPages?: number
}

export interface SearchParams {
  [key: string]: any
}

export interface SortParams {
  field: string
  reverse: boolean
}

export interface ListRequestBody {
  Pagination: {
    Start: number
    TotalItemCount?: number
    Number: number
    NumberOfPages?: number
  }
  Search?: {
    QueryObject?: SearchParams
  }
  Sort?: SortParams
}

export function createListRequestBody(options: {
  pagination: PaginationParams
  search?: SearchParams
  sort?: SortParams
}): ListRequestBody {
  return {
    Pagination: {
      Start: options.pagination.start,
      Number: options.pagination.number,
      NumberOfPages: options.pagination.numberOfPages || 10
    },
    Search: options.search ? {
      QueryObject: options.search
    } : undefined,
    Sort: options.sort
  }
}

export function buildQueryString(params: Record<string, any>): string {
  const query = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      query.append(key, String(value))
    }
  })
  
  const queryString = query.toString()
  return queryString ? `?${queryString}` : ''
}

export function parseQueryString(queryString: string): Record<string, string> {
  const params = new URLSearchParams(queryString)
  const result: Record<string, string> = {}
  
  params.forEach((value, key) => {
    result[key] = value
  })
  
  return result
}

export function handleApiError(error: any): string {
  if (error?.response?.data?.message) {
    return error.response.data.message
  }
  if (error?.message) {
    return error.message
  }
  return 'An unexpected error occurred'
}

export function isSuccessResponse<T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: true, data: T } {
  return response.success && response.data !== null
}

export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message
  }
}

export function createErrorResponse(message: string, code?: string): ApiResponse<null> {
  return {
    success: false,
    data: null,
    message,
    code
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number
    delay?: number
    onRetry?: (error: any, attempt: number) => void
  } = {}
): Promise<T> {
  const { retries = 3, delay = 1000, onRetry } = options
  
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === retries - 1) {
        throw error
      }
      
      if (onRetry) {
        onRetry(error, i + 1)
      }
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw new Error('Retry failed')
}
