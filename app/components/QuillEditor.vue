<template>
  <div class="quill-editor-wrapper">
    <div ref="editorContainer" />
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: ''
})

const emit = defineEmits<Emits>()

const editorContainer = ref<HTMLDivElement | null>(null)
let quillEditor: any = null

// Load Quill from CDN
const loadQuill = () => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && (window as any).Quill) {
      resolve((window as any).Quill)
      return
    }

    // Load CSS
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css'
    document.head.appendChild(link)

    // Load JS
    const script = document.createElement('script')
    script.src = 'https://cdn.quilljs.com/1.3.6/quill.min.js'
    script.onload = () => {
      resolve((window as any).Quill)
    }
    script.onerror = reject
    document.head.appendChild(script)
  })
}

onMounted(async () => {
  if (editorContainer.value) {
    try {
      const Quill = await loadQuill()
      
      quillEditor = new (Quill as any)(editorContainer.value, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ 'align': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link'],
            ['clean']
          ]
        },
        placeholder: 'Nhập nội dung...'
      })

      // Set initial content
      if (props.modelValue) {
        quillEditor.clipboard.dangerouslyPasteHTML(props.modelValue)
      }

      // Listen for changes
      quillEditor.on('text-change', () => {
        const html = quillEditor.root.innerHTML
        emit('update:modelValue', html)
      })

    } catch (error) {
      console.error('Quill initialization failed:', error)
    }
  }
})

onBeforeUnmount(() => {
  if (quillEditor) {
    quillEditor = null
  }
})

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  if (quillEditor && quillEditor.root.innerHTML !== newValue) {
    quillEditor.clipboard.dangerouslyPasteHTML(newValue || '')
  }
})
</script>

<style scoped>
.quill-editor-wrapper {
  width: 100%;
}

:deep(.ql-editor) {
  min-height: 300px;
}

:deep(.ql-toolbar) {
  border-top: 1px solid #ccc;
  border-left: 1px solid #ccc;
  border-right: 1px solid #ccc;
}

:deep(.ql-container) {
  border-bottom: 1px solid #ccc;
  border-left: 1px solid #ccc;
  border-right: 1px solid #ccc;
}
</style>
