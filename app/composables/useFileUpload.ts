import { useApiFetch } from '@/composables/useApiFetch'
import { getApiEndpoints } from '@/utils/api'
import type { UploadMultipleResponse } from '@/types/upload'

export function useFileUpload(endpoint: string = getApiEndpoints().uploadFiles) {
  async function upload(files: File[]) {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })

    return await useApiFetch<UploadMultipleResponse>(endpoint, {
      method: 'POST',
      body: formData
    })
  }

  return { upload }
}