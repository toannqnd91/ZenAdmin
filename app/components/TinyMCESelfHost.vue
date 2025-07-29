<template>
  <div class="tinymce-selfhost-wrapper">
    <ClientOnly>
      <div
        :id="editorId"
        ref="editorElement"
        class="editor-container"
      />
      <template #fallback>
        <div class="loading-container">
          <div class="loading-spinner" />
          <p>Đang khởi tạo trình soạn thảo...</p>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { fileService } from '@/services'

interface Props {
  modelValue?: string
  placeholder?: string
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Nhập nội dung...',
  height: 400
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorElement = ref<HTMLElement>()
const editorId = ref(`tinymce-selfhost-${Date.now()}`)
let editor: TinyMCEEditor | null = null
const isReady = ref(false)

// Types for TinyMCE
interface TinyMCEEditor {
  getContent: () => string
  setContent: (content: string) => void
  insertContent: (content: string) => void
  destroy: () => void
  on: (event: string, callback: () => void) => void
  ui: {
    registry: {
      addButton: (name: string, config: { text: string, onAction: () => void }) => void
    }
  }
}

interface TinyMCE {
  init: (config: TinyMCEConfig) => Promise<TinyMCEEditor[]>
  baseURL: string
  suffix: string
}

interface TinyMCEConfig {
  target: HTMLElement
  height: number
  base_url: string
  suffix: string
  menubar: string
  toolbar_mode: string
  plugins: string[]
  toolbar: string
  content_style: string
  placeholder: string
  branding: boolean
  resize: string
  elementpath: boolean
  statusbar: boolean
  paste_data_images: boolean
  paste_as_text: boolean
  paste_retain_style_properties: string
  automatic_uploads: boolean
  file_picker_types: string
  images_upload_handler: (blobInfo: { blob: () => Blob, base64: () => string }, progress: unknown) => Promise<string>
  promotion: boolean
  convert_urls: boolean
  relative_urls: boolean
  remove_script_host: boolean
  setup: (editor: TinyMCEEditor) => void
}

declare global {
  interface Window {
    tinymce?: TinyMCE
  }
}

// Load TinyMCE từ local files
const loadLocalTinyMCE = async (): Promise<TinyMCE | null> => {
  if (typeof window === 'undefined') return null
  
  // Kiểm tra nếu đã load
  if (window.tinymce) {
    return window.tinymce
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    
    // Load từ thư mục public/tinymce
    script.src = '/tinymce/tinymce.min.js'
    script.async = true
    
    script.onload = () => {
      // Cấu hình base URL cho TinyMCE
      if (window.tinymce) {
        const tinymce = window.tinymce
        
        // Set base URL
        tinymce.baseURL = '/tinymce'
        tinymce.suffix = '.min'
        
        resolve(tinymce)
      } else {
        reject(new Error('TinyMCE không thể load'))
      }
    }
    
    script.onerror = () => {
      console.error('Không thể load TinyMCE từ /tinymce/tinymce.min.js')
      showFallback()
      reject(new Error('Failed to load local TinyMCE'))
    }
    
    document.head.appendChild(script)
  })
}

// Khởi tạo editor
const initializeEditor = async () => {
  if (!import.meta.client || !editorElement.value || isReady.value) return

  try {
    const tinymce = await loadLocalTinyMCE()
    if (!tinymce) throw new Error('TinyMCE not available')

    await nextTick()

    // Cấu hình TinyMCE với paths tự host
    const _editors = await tinymce.init({
      target: editorElement.value,
      height: props.height,
      
      // Cấu hình paths cho self-hosted
      base_url: '/tinymce',
      suffix: '.min',
      
      // UI Configuration
      menubar: 'file edit view insert format tools table help',
      toolbar_mode: 'sliding',
      
      // Plugins - chỉ sử dụng các plugin có sẵn
      plugins: [
        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
        'insertdatetime', 'media', 'table', 'help', 'wordcount'
      ],
      
      // Toolbar configuration - with custom image upload button
      toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | '
        + 'forecolor backcolor | link image customImageUpload media table | align lineheight | '
        + 'numlist bullist indent outdent | emoticons charmap | removeformat | '
        + 'code fullscreen help',
      
      // Content styling
      content_style: `
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
          font-size: 14px; 
          line-height: 1.6; 
          color: #1f2937; 
          margin: 1rem;
          background: white;
        }
        p { margin: 0 0 1rem 0; }
        h1, h2, h3, h4, h5, h6 { 
          margin: 0 0 1rem 0; 
          font-weight: 600; 
          line-height: 1.3;
        }
        h1 { font-size: 2.25rem; }
        h2 { font-size: 1.875rem; }
        h3 { font-size: 1.5rem; }
        h4 { font-size: 1.25rem; }
        h5 { font-size: 1.125rem; }
        h6 { font-size: 1rem; }
        ul, ol { margin: 0 0 1rem 0; padding-left: 2rem; }
        li { margin-bottom: 0.25rem; }
        blockquote { 
          margin: 1.5rem 0; 
          padding: 1rem 1.5rem; 
          border-left: 4px solid #3b82f6; 
          background-color: #f8fafc; 
          font-style: italic;
        }
        img { max-width: 100%; height: auto; border-radius: 4px; }
        table { 
          border-collapse: collapse; 
          width: 100%; 
          margin: 1rem 0;
        }
        th, td { 
          border: 1px solid #e5e7eb; 
          padding: 0.75rem; 
          text-align: left; 
        }
        th { 
          background-color: #f9fafb; 
          font-weight: 600; 
        }
        code { 
          background-color: #f3f4f6; 
          padding: 0.125rem 0.25rem; 
          border-radius: 0.25rem; 
          font-family: 'Courier New', monospace; 
          font-size: 0.875rem;
        }
        pre { 
          background-color: #1f2937; 
          color: #f9fafb; 
          padding: 1rem; 
          border-radius: 0.5rem; 
          overflow-x: auto;
        }
        pre code { 
          background: none; 
          padding: 0; 
          color: inherit;
        }
      `,
      
      // Editor settings
      placeholder: props.placeholder,
      branding: false,
      resize: 'both',
      elementpath: false,
      statusbar: true,
      
      // Content settings
      paste_data_images: true,
      paste_as_text: false,
      paste_retain_style_properties: 'font-weight font-style color text-decoration',
      
      // Image handling with API integration
      automatic_uploads: true,
      file_picker_types: 'image',
      images_upload_handler: async (blobInfo: { blob: () => Blob, base64: () => string }, progress: unknown) => {
        try {
          const blob = blobInfo.blob()
          
          // Convert blob to File object
          const file = new File([blob], `image-${Date.now()}.${blob.type.split('/')[1]}`, {
            type: blob.type
          })
          
          // Validate file
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml']
          if (!allowedTypes.includes(file.type)) {
            throw new Error('Chỉ hỗ trợ file ảnh (JPG, PNG, GIF, SVG)')
          }
          
          // Validate file size (max 5MB for editor)
          if (file.size > 5 * 1024 * 1024) {
            throw new Error('Kích thước file không được vượt quá 5MB')
          }
          
          // Show progress if available
          if (typeof progress === 'function') {
            progress(10)
          }
          
          // Upload using fileService
          const response = await fileService.uploadFile(file, 'editor')
          
          if (typeof progress === 'function') {
            progress(90)
          }
          
          // Handle API response
          if (response && response.success && response.data) {
            const fileData = Array.isArray(response.data) ? response.data[0] : response.data
            
            if (fileData && fileData.fileName) {
              if (typeof progress === 'function') {
                progress(100)
              }
              // Return the full URL for the uploaded image
              return fileService.getFileUrl(fileData.fileName)
            } else {
              throw new Error('Không nhận được thông tin file từ server')
            }
          } else {
            throw new Error('Upload thất bại')
          }
        } catch (error) {
          console.error('Lỗi upload ảnh trong editor:', error)
          // Fallback to base64 if upload fails
          return `data:${blobInfo.blob().type};base64,${blobInfo.base64()}`
        }
      },
      
      // Advanced settings
      promotion: false,
      convert_urls: false,
      relative_urls: false,
      remove_script_host: false,
      
      // Setup callback
      setup: (ed: TinyMCEEditor) => {
        editor = ed
        
        ed.on('init', () => {
          console.log('TinyMCE Self-Hosted khởi tạo thành công')
          isReady.value = true
          
          if (props.modelValue) {
            ed.setContent(props.modelValue)
          }
        })
        
        ed.on('change', () => {
          const content = ed.getContent()
          emit('update:modelValue', content)
        })
        
        ed.on('keyup paste', () => {
          const content = ed.getContent()
          emit('update:modelValue', content)
        })
        
        // Custom button for image upload from server
        // ed.ui.registry.addButton('customImageUpload', {
        //   text: 'Upload Ảnh',
        //   onAction: () => {
        //     // Create file input
        //     const input = document.createElement('input')
        //     input.type = 'file'
        //     input.accept = 'image/*'
        //     input.style.display = 'none'
            
        //     input.onchange = async (e) => {
        //       const file = (e.target as HTMLInputElement).files?.[0]
        //       if (!file) return
              
        //       try {
        //         // Show loading message
        //         ed.insertContent('<p><em>Đang tải ảnh lên...</em></p>')
                
        //         // Upload file
        //         const response = await fileService.uploadFile(file, 'editor')
                
        //         if (response && response.success && response.data) {
        //           const fileData = Array.isArray(response.data) ? response.data[0] : response.data
                  
        //           if (fileData && fileData.fileName) {
        //             const imageUrl = fileService.getFileUrl(fileData.fileName)
                    
        //             // Remove loading message and insert image
        //             const content = ed.getContent().replace('<p><em>Đang tải ảnh lên...</em></p>', '')
        //             ed.setContent(content)
        //             ed.insertContent(`<img src="${imageUrl}" alt="Uploaded image" style="max-width: 100%; height: auto;" />`)
        //           }
        //         }
        //       } catch (error) {
        //         console.error('Lỗi upload ảnh:', error)
        //         // Remove loading message
        //         const content = ed.getContent().replace('<p><em>Đang tải ảnh lên...</em></p>', '')
        //         ed.setContent(content)
        //         ed.insertContent('<p><em>Lỗi tải ảnh lên. Vui lòng thử lại.</em></p>')
        //       }
        //     }
            
        //     document.body.appendChild(input)
        //     input.click()
        //     document.body.removeChild(input)
        //   }
        // })
      }
    })
  } catch (error) {
    console.error('Lỗi khởi tạo TinyMCE Self-Hosted:', error)
    showFallback()
  }
}

// Fallback textarea
const showFallback = () => {
  if (!editorElement.value) return
  
  editorElement.value.innerHTML = `
    <div style="border: 1px solid #d1d5db; border-radius: 8px; overflow: hidden;">
      <div style="background: #f3f4f6; padding: 8px 12px; border-bottom: 1px solid #d1d5db; font-size: 12px; color: #6b7280;">
        Trình soạn thảo văn bản (TinyMCE Self-Hosted không khả dụng)
      </div>
      <textarea
        style="width: 100%; height: ${props.height - 40}px; padding: 12px; border: none; outline: none; font-family: inherit; font-size: 14px; line-height: 1.5; resize: vertical;"
        placeholder="${props.placeholder}"
      >${props.modelValue || ''}</textarea>
    </div>
  `
  
  const textarea = editorElement.value.querySelector('textarea')
  if (textarea) {
    textarea.addEventListener('input', (e) => {
      emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
    })
  }
}

// Watch props changes
watch(() => props.modelValue, (newValue) => {
  if (editor && isReady.value && editor.getContent() !== newValue) {
    editor.setContent(newValue || '')
  }
})

// Lifecycle
onMounted(() => {
  if (import.meta.client) {
    setTimeout(initializeEditor, 100)
  }
})

onBeforeUnmount(() => {
  if (editor) {
    try {
      editor.destroy()
      editor = null
      isReady.value = false
    } catch (error) {
      console.warn('Lỗi khi hủy TinyMCE Self-Hosted:', error)
    }
  }
})
</script>

<style scoped>
.tinymce-selfhost-wrapper {
  width: 100%;
  border: none;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.dark .tinymce-selfhost-wrapper {
  border: none;
  background: #1f2937;
}

.editor-container {
  width: 100%;
  min-height: 200px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
  color: #6b7280;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* TinyMCE Self-Hosted Styles */
:deep(.tox) {
  border: none !important;
  font-family: inherit;
}

:deep(.tox-tinymce) {
  border: none !important;
  border-radius: 0;
}

:deep(.tox-editor-header) {
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

:deep(.tox-menubar) {
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

:deep(.tox-toolbar) {
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

:deep(.tox-statusbar) {
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

:deep(.tox-edit-area) {
  background: white;
}

/* Dark mode support */
.dark :deep(.tox-editor-header),
.dark :deep(.tox-menubar),
.dark :deep(.tox-toolbar),
.dark :deep(.tox-statusbar) {
  background: #374151;
  border-color: #4b5563;
}

.dark :deep(.tox-edit-area) {
  background: #1f2937;
}

.dark :deep(.tox-tbtn) {
  color: #d1d5db;
}

.dark :deep(.tox-tbtn:hover) {
  background: #4b5563;
}

.dark :deep(.tox-mbtn) {
  color: #d1d5db;
}

.dark :deep(.tox-mbtn:hover) {
  background: #4b5563;
}

/* Custom scrollbar for toolbar */
:deep(.tox-toolbar__overflow) {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}

:deep(.tox-toolbar__overflow::-webkit-scrollbar) {
  height: 6px;
}

:deep(.tox-toolbar__overflow::-webkit-scrollbar-track) {
  background: #f1f5f9;
}

:deep(.tox-toolbar__overflow::-webkit-scrollbar-thumb) {
  background: #cbd5e1;
  border-radius: 3px;
}

:deep(.tox-toolbar__overflow::-webkit-scrollbar-thumb:hover) {
  background: #94a3b8;
}
</style>
