export * from './common'
export * from './user'

export interface ApiResponse {
  code: string
  success: boolean
  message: string
  data: Admission[]
}
