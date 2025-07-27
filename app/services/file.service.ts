import { BaseService } from './base.service'
import type { FileUploadResponse } from '@/types/common'

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

    return response.json() as Promise<FileUploadResponse>
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
  getFileUrl(fileName: string) {
    return `https://dongtrunghathaophunhan.vn/image/${fileName}`
  }
}

// Export singleton instance
export const fileService = new FileService()
