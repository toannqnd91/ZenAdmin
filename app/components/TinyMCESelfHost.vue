<template>
  <div class="tinymce-selfhost-wrapper">
    <ClientOnly>
      <div :id="localEditorId" ref="editorElement" class="editor-container" />
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
import { nextTick, computed } from 'vue'

interface Props {
  modelValue?: string
  placeholder?: string
  height?: number
  editorId?: string
  plainText?: boolean
  entityEncoding?: 'named' | 'numeric' | 'raw'
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Nhập nội dung...',
  height: 400,
  editorId: undefined,
  plainText: false,
  entityEncoding: 'raw'
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const editorElement = ref<HTMLElement>()
const generatedId = `tinymce-selfhost-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
const localEditorId = computed(() => props.editorId || generatedId)
let editor: TinyMCEEditor | null = null
const isReady = ref(false)
let lastEmittedPlainText = ''

type GetContentOptions = { format?: 'text' | 'raw' | 'html' }

interface TinyMCEEditor {
  getContent: (opts?: GetContentOptions) => string
  setContent: (content: string, opts?: GetContentOptions) => void
  insertContent: (content: string) => void
  destroy: () => void
  on: (event: string, callback: () => void) => void
}

interface TinyMCEConfig {
  target: HTMLElement
  height: number
  entity_encoding: 'named' | 'numeric' | 'raw'
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
  automatic_uploads: boolean
  file_picker_types: string
  images_upload_handler: (blobInfo: { blob: () => Blob, base64: () => string }, progress?: (p: number) => void) => Promise<string>
  promotion: boolean
  convert_urls: boolean
  relative_urls: boolean
  remove_script_host: boolean
  setup: (ed: TinyMCEEditor) => void
}

interface TinyMCE {
  init: (config: TinyMCEConfig) => Promise<TinyMCEEditor[]>
  baseURL: string
  suffix: string
}

// Global window extension removed (handled elsewhere by TinyMCE types if present)

let __tinyLoaderPromise: Promise<TinyMCE | null> | null = null
const loadLocalTinyMCE = async (): Promise<TinyMCE | null> => {
  if (typeof window === 'undefined') return null
  if (window.tinymce) return window.tinymce
  if (__tinyLoaderPromise) return __tinyLoaderPromise
  __tinyLoaderPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-tinymce-selfhost]') as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve(window.tinymce || null), { once: true })
      existing.addEventListener('error', () => reject(new Error('TinyMCE script error')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = '/tinymce/tinymce.min.js'
    script.async = true
    script.setAttribute('data-tinymce-selfhost', 'true')
    script.onload = () => {
      if (window.tinymce) {
        window.tinymce.baseURL = '/tinymce'
        window.tinymce.suffix = '.min'
        resolve(window.tinymce)
      } else reject(new Error('TinyMCE không thể load'))
    }
    script.onerror = () => {
      console.error('[TinyMCESelfHost] load lỗi')
      showFallback()
      reject(new Error('Failed to load TinyMCE'))
    }
    document.head.appendChild(script)
  })
  return __tinyLoaderPromise
}

const initializeEditor = async () => {
  if (!import.meta.client || !editorElement.value || isReady.value) return
  try {
    const tinymce = await loadLocalTinyMCE()
    if (!tinymce) throw new Error('TinyMCE not available')
    await nextTick()
    await tinymce.init({
      target: editorElement.value,
      height: props.height,
      entity_encoding: props.entityEncoding,
      base_url: '/tinymce',
      suffix: '.min',
      menubar: 'file edit view insert format tools table help',
      toolbar_mode: 'sliding',
      plugins: [
        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
        'insertdatetime', 'media', 'table', 'help', 'wordcount'
      ],
      // Đơn giản toolbar để giữ nút Fullscreen luôn hiển thị cạnh nút 3 chấm (overflow)
      toolbar: 'undo redo | blocks fontsize | fullscreen | bold italic underline | fontfamily forecolor backcolor | align | bullist numlist | link image table | code',
      content_style: 'body { font-family: system-ui, sans-serif; font-size:14px; line-height:1.6; margin:1rem; }',
      placeholder: props.placeholder,
      branding: false,
      resize: 'both',
      elementpath: false,
      statusbar: true,
      paste_data_images: true,
      paste_as_text: false,
      automatic_uploads: true,
      file_picker_types: 'image',
      images_upload_handler: async (blobInfo: { blob: () => Blob, base64: () => string }) => {
        try {
          const blob = blobInfo.blob()
          const file = new File([blob], `image-${Date.now()}.${blob.type.split('/')[1]}`, { type: blob.type })
          const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml']
          if (!allowed.includes(file.type)) throw new Error('Định dạng ảnh không hỗ trợ')
          if (file.size > 5 * 1024 * 1024) throw new Error('Ảnh >5MB')
          const response = await fileService.uploadFile(file, 'editor')
          if (response?.success && response.data?.url) {
            return response.data.url
          }
          throw new Error('Upload thất bại')
        } catch (e) {
          console.error('Upload ảnh lỗi:', e)
          return `data:${blobInfo.blob().type};base64,${blobInfo.base64()}`
        }
      },
      promotion: false,
      convert_urls: false,
      relative_urls: false,
      remove_script_host: false,
      setup: (ed: TinyMCEEditor) => {
        editor = ed
        ed.on('init', () => {
          isReady.value = true
          if (props.modelValue) {
            ed.setContent(props.plainText ? props.modelValue.replace(/\n/g, '<br>') : props.modelValue)
          }
        })
        const emitContent = () => {
          if (props.plainText) {
            const text = ed.getContent({ format: 'text' }) || ''
            if (text !== lastEmittedPlainText) {
              lastEmittedPlainText = text
              emit('update:modelValue', text)
            }
          } else {
            emit('update:modelValue', ed.getContent())
          }
        }
        ed.on('change', emitContent)
        ed.on('keyup paste input', emitContent)
      }
    })
  } catch (e) {
    console.error('TinyMCE init lỗi:', e)
    showFallback()
  }
}

const showFallback = () => {
  if (!editorElement.value) return
  editorElement.value.innerHTML = `<textarea style="width:100%;height:${props.height - 10}px;padding:12px;border:1px solid #d1d5db;border-radius:6px;">${props.modelValue || ''}</textarea>`
  const ta = editorElement.value.querySelector('textarea') as HTMLTextAreaElement | null
  if (ta) {
    ta.addEventListener('input', (e) => {
      emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
    })
  }
}

watch(() => props.modelValue, (val) => {
  if (!editor || !isReady.value) return
  if (props.plainText) {
    const current = editor.getContent({ format: 'text' }) || ''
    const target = val || ''
    if (current !== target) {
      editor.setContent(target.replace(/\n/g, '<br>'))
      lastEmittedPlainText = target
    }
  } else if (editor.getContent() !== val) {
    editor.setContent(val || '')
  }
})

onMounted(() => {
  if (import.meta.client) {
    setTimeout(initializeEditor, 30)
  }
})
onBeforeUnmount(() => {
  if (editor) {
    try {
      editor.destroy()
    } catch (err) {
      console.warn('TinyMCE destroy error', err)
    }
    editor = null
    isReady.value = false
  }
})
</script>

<style scoped>
.tinymce-selfhost-wrapper {
  width: 100%;
  background: white;
}

.dark .tinymce-selfhost-wrapper {
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
  gap: 1rem;
  padding: 2rem;
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
  0% {
    transform: rotate(0);
  }

  100% {
    transform: rotate(360deg);
  }
}

:deep(.tox-tinymce) {
  border: none !important;
}

:deep(.tox-editor-header),
:deep(.tox-menubar),
:deep(.tox-toolbar),
:deep(.tox-statusbar) {
  background: #f9fafb;
  border-color: #e5e7eb;
}

.dark :deep(.tox-editor-header),
.dark :deep(.tox-menubar),
.dark :deep(.tox-toolbar),
.dark :deep(.tox-statusbar) {
  background: #374151;
  border-color: #4b5563;
}

:deep(.tox-edit-area) {
  background: white;
}

.dark :deep(.tox-edit-area) {
  background: #1f2937;
}
</style>
