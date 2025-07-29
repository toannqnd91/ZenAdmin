import { BaseService } from './base.service'
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

    const response = await fetch(`${this.baseURL}/File/Upload`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`)
    }

    const result = await response.json()
    console.log('Raw upload response:', result)
    
    return result as ApiFileUploadResponse
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(files: File[], folder?: string) {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })
    if (folder) {
      formData.append('folder', folder)
    }

    const response = await fetch(`${this.baseURL}/File/UploadMultiple`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`)
    }

    return response.json() as Promise<FileUploadResponse[]>
  }

  /**
   * Delete file
   */
  async deleteFile(fileName: string) {
    return this.delete(`/File/${fileName}`)
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
