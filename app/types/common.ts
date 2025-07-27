// Common API response types
export interface ApiResponse<T = any> {
  code: string
  success: boolean
  message: string
  data: T
}

// Common pagination types
export interface PaginationParams {
  Start: number
  TotalItemCount: number
  Number: number
  NumberOfPages: number
}

export interface SearchParams {
  QueryObject: Record<string, any>
}

export interface SortParams {
  Field: string
  Reverse: boolean
}

export interface ApiRequestBody {
  Pagination: PaginationParams
  Search: SearchParams
  Sort: SortParams
}

// Login types
export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: number
    username: string
    email: string
    fullName: string
  }
}

// File upload types
export interface FileUploadResponse {
  fileName: string
  url: string
  size: number
  contentType: string
}
