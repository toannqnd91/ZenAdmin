import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'
import type { FileUploadResponse, ApiFileUploadResponse } from '@/types/common'

export class FileService extends BaseService {
  /**
   * Upload single file
   */
  async uploadFile(file: File, folder?: string) {
    const formData = new FormData()
    formData.append('file', file)
    if (folder) {
      formData.append('folder', folder)
    }

    try {
      console.log('Starting file upload:', { fileName: file.name, fileSize: file.size, folder })
      console.log('API Base URL:', this.getBaseURL())
      
      const response = await this.request<ApiFileUploadResponse>(API_ENDPOINTS.UPLOAD_FILE, {
        method: 'POST',
        body: formData,
        headers: {
          // Set empty Content-Type to let browser handle multipart/form-data
          'Content-Type': ''
        }
      })
      
      console.log('Upload successful:', response)
      // Return the full API response (not just data) for component compatibility
      return response
    } catch (error: unknown) {
      const err = error as Error
      console.error('Upload error details:', {
        error,
        fileName: file.name,
        fileSize: file.size,
        folder,
        errorMessage: err?.message || 'Unknown error',
        errorStack: err?.stack,
        errorName: err?.name,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
      })
      
      // Check if it's a network error
      if (err?.message?.includes('fetch')) {
        throw new Error(`Network error uploading "${file.name}": Check internet connection and server availability`)
      }
      
      // Check if it's an API error
      if (err?.message?.includes('API Error:')) {
        throw new Error(`Server error uploading "${file.name}": ${err.message}`)
      }
      
      // Re-throw with more context
      const errorMsg = err?.message || String(error) || 'Unknown error'
      throw new Error(`File upload failed for "${file.name}": ${errorMsg}`)
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(files: File[], folder?: string) {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })
    if (folder) {
      formData.append('folder', folder)
    }

    try {
      const response = await this.request<FileUploadResponse[]>(API_ENDPOINTS.UPLOAD_MULTIPLE_FILES, {
        method: 'POST',
        body: formData,
        headers: {
          // Set empty Content-Type to let browser handle multipart/form-data
          'Content-Type': ''
        }
      })
      
      // Return the full API response (not just data) for component compatibility
      return response
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileName: string) {
    return this.delete(API_ENDPOINTS.DELETE_FILE(fileName))
  }

  /**
   * Get file URL
   */
  getFileUrl(fileName: string | null | undefined): string | null {
    // If fileName is null, return null
    if (fileName === null) {
      return null
    }
    
    // If fileName is undefined, empty, or "string", return default image
    if (!fileName || fileName === '' || fileName === 'string') {
      return '/no-image.svg'
    }
    
    // If fileName is already a full URL, return it directly
    if (fileName.startsWith('http://') || fileName.startsWith('https://')) {
      return fileName
    }
    
    // Get image base URL from runtime config
    const config = useRuntimeConfig()
    const imageBaseUrl = config.public.imageBaseUrl
    
    // If it's just a filename, construct the full URL
    return `${imageBaseUrl}/image/${fileName}`
  }
}

// Export singleton instance
export const fileService = new FileService()
