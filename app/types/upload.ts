export interface UploadFileResult {
  url: string
  name: string
}

export interface UploadMultipleResponse {
  code: string
  success: boolean
  message: string
  data: UploadFileResult[]
}
