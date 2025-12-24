import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'
import type { FileUploadResponse, ApiFileUploadResponse } from '@/types/common'

export class FileService extends BaseService {
  /**
   * Upload single file
   */
  /**
   * Upload single file
   */
  async uploadFile(file: File, folder: string = 'uploads') {
    const formData = new FormData()
    formData.append('file', file)
    
    // UPLOAD_FILE endpoint expects 'folder' in query string
    const url = `${API_ENDPOINTS.UPLOAD_FILE}?folder=${encodeURIComponent(folder)}`

    try {
      const response = await this.request<any>(url, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': ''
        }
      })

      // Response format: { success: true, url: "...", ... }
      // Return consistent success/data structure
      return {
          success: true,
          data: response
      }
    } catch (error: unknown) {
        throw error
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
