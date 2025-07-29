<template>
  <div class="tinymce-editor-wrapper">
    <ClientOnly>
      <div ref="editorContainer" />
      <template #fallback>
        <div class="animate-pulse bg-gray-200 dark:bg-gray-700 h-96 rounded-md" />
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
let tinymceEditor: any = null

// Watch props changes
watch(() => props.modelValue, (newValue) => {
  if (tinymceEditor && tinymceEditor.getContent() !== newValue) {
    tinymceEditor.setContent(newValue || '')
    content.value = newValue
  }
})

// Watch content changes
watch(content, (newValue) => {
  emit('update:modelValue', newValue)
})

onMounted(async () => {
  // Only initialize on client side
  if (typeof window !== 'undefined' && editorContainer.value) {
    try {
      // Dynamic import TinyMCE
      const tinymce = await import('tinymce/tinymce')
      
      // Import theme and model
      await import('tinymce/themes/silver')
      await import('tinymce/models/dom')
      
      // Import plugins
      await import('tinymce/plugins/advlist')
      await import('tinymce/plugins/autolink')
      await import('tinymce/plugins/lists')
      await import('tinymce/plugins/link')
      await import('tinymce/plugins/image')
      await import('tinymce/plugins/charmap')
      await import('tinymce/plugins/preview')
      await import('tinymce/plugins/anchor')
      await import('tinymce/plugins/searchreplace')
      await import('tinymce/plugins/visualblocks')
      await import('tinymce/plugins/code')
      await import('tinymce/plugins/fullscreen')
      await import('tinymce/plugins/insertdatetime')
      await import('tinymce/plugins/media')
      await import('tinymce/plugins/table')
      await import('tinymce/plugins/wordcount')
      
      // Initialize editor
      const editorInstances = await tinymce.default.init({
        target: editorContainer.value,
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
        icons_url: '/tinymce/icons/default/icons.js',
        placeholder: props.placeholder,
        branding: false,
        resize: 'both',
        contextmenu: 'link image table',
        image_advtab: true,
        link_context_toolbar: true,
        automatic_uploads: true,
        file_picker_types: 'image',
        setup: (editor: any) => {
          editor.on('init', () => {
            console.log('TinyMCE Editor initialized')
            if (props.modelValue) {
              editor.setContent(props.modelValue)
            }
          })
          
          editor.on('change keyup', () => {
            const newContent = editor.getContent()
            content.value = newContent
            emit('update:modelValue', newContent)
          })
        }
      })
      
      // Get the first editor instance
      if (Array.isArray(editorInstances)) {
        tinymceEditor = editorInstances[0]
      } else {
        tinymceEditor = editorInstances
      }
      
    } catch (error) {
      console.error('Failed to load TinyMCE:', error)
    }
  }
})

onBeforeUnmount(() => {
  if (tinymceEditor) {
    tinymceEditor.destroy()
    tinymceEditor = null
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
