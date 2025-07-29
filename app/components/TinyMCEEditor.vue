<template>
  <div class="tinymce-editor-wrapper">
    <ClientOnly>
      <div
        :id="editorId"
        ref="editorContainer"
        class="tinymce-editor-target"
      />
      <template #fallback>
        <div class="animate-pulse bg-gray-200 dark:bg-gray-700 h-96 rounded-md flex items-center justify-center">
          <div class="text-gray-500 dark:text-gray-400">Đang tải trình soạn thảo...</div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

// Props & Emits
interface Props {
  modelValue?: string
  placeholder?: string
  height?: number
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Nhập nội dung...',
  height: 400
})

const emit = defineEmits<Emits>()

// Reactive state
const content = ref(props.modelValue)
const editorContainer = ref<HTMLDivElement | null>(null)
const editorId = ref(`tinymce-editor-${Math.random().toString(36).substr(2, 9)}`)
let tinymceEditor: any = null

// Watch props changes
watch(() => props.modelValue, (newValue) => {
  if (newValue !== content.value) {
    content.value = newValue
    if (tinymceEditor && tinymceEditor.getContent() !== newValue) {
      tinymceEditor.setContent(newValue || '')
    }
  }
})

// Initialize TinyMCE only on client side
const initializeTinyMCE = async () => {
  if (!import.meta.client || !editorContainer.value) return
  
  try {
    // Wait for container to be in DOM
    await nextTick()
    
    // Import TinyMCE dynamically to avoid SSR issues
    const tinymceModule = await import('tinymce/tinymce')
    const tinymce = tinymceModule.default
    
    // Import required components using dynamic imports
    const importPromises = [
      'tinymce/themes/silver',
      'tinymce/models/dom',
      'tinymce/icons/default',
      'tinymce/plugins/advlist',
      'tinymce/plugins/autolink',
      'tinymce/plugins/lists',
      'tinymce/plugins/link',
      'tinymce/plugins/image',
      'tinymce/plugins/charmap',
      'tinymce/plugins/preview',
      'tinymce/plugins/anchor',
      'tinymce/plugins/searchreplace',
      'tinymce/plugins/visualblocks',
      'tinymce/plugins/code',
      'tinymce/plugins/fullscreen',
      'tinymce/plugins/insertdatetime',
      'tinymce/plugins/media',
      'tinymce/plugins/table',
      'tinymce/plugins/wordcount'
    ].map(module => import(module).catch(() => null))
    
    await Promise.all(importPromises)
    
    // Initialize editor
    await tinymce.init({
      selector: `#${editorId.value}`,
      height: props.height,
      menubar: 'file edit view insert format tools',
      plugins: [
        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
        'insertdatetime', 'media', 'table', 'wordcount'
      ],
      toolbar: 'undo redo | blocks | '
        + 'bold italic underline forecolor backcolor | alignleft aligncenter '
        + 'alignright alignjustify | bullist numlist outdent indent | '
        + 'removeformat | link image media | code fullscreen',
      content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px; }',
      skin: 'oxide',
      skin_url: '/tinymce/skins/ui/oxide',
      icons: 'default',
      placeholder: props.placeholder,
      branding: false,
      resize: 'both',
      contextmenu: 'link image table',
      image_advtab: true,
      link_context_toolbar: true,
      automatic_uploads: true,
      file_picker_types: 'image',
      promotion: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setup: (editor: any) => {
        tinymceEditor = editor
        
        editor.on('init', () => {
          console.log('TinyMCE Editor initialized')
          if (props.modelValue) {
            editor.setContent(props.modelValue)
            content.value = props.modelValue
          }
        })
        
        editor.on('change keyup paste', () => {
          const newContent = editor.getContent()
          if (newContent !== content.value) {
            content.value = newContent
            emit('update:modelValue', newContent)
          }
        })
      }
    })
  } catch (error) {
    console.error('Failed to load TinyMCE:', error)
  }
}

onMounted(() => {
  if (import.meta.client) {
    setTimeout(initializeTinyMCE, 100)
  }
})

onBeforeUnmount(() => {
  if (tinymceEditor) {
    try {
      tinymceEditor.destroy()
      tinymceEditor = null
    } catch (error) {
      console.error('Error destroying TinyMCE editor:', error)
    }
  }
})
</script>

<style scoped>
.tinymce-editor-wrapper {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
}

.dark .tinymce-editor-wrapper {
  border-color: #374151;
}

.tinymce-editor-target {
  min-height: 200px;
}

:deep(.tox) {
  border: none !important;
}

:deep(.tox-tinymce) {
  border: none !important;
  border-radius: 0.5rem;
}

:deep(.tox-editor-header) {
  border-bottom: 1px solid #e5e7eb !important;
}

.dark :deep(.tox-editor-header) {
  border-bottom-color: #374151 !important;
}

:deep(.tox-edit-area) {
  border: none !important;
}

:deep(.tox-statusbar) {
  border-top: 1px solid #e5e7eb !important;
}

.dark :deep(.tox-statusbar) {
  border-top-color: #374151 !important;
}

/* Custom styles for better integration */
:deep(.tox .tox-menubar) {
  background: #f9fafb;
}

.dark :deep(.tox .tox-menubar) {
  background: #374151;
}

:deep(.tox .tox-toolbar) {
  background: #f9fafb;
}

.dark :deep(.tox .tox-toolbar) {
  background: #374151;
}
</style>
