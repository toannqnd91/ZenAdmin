<template>
  <div class="simple-editor-wrapper">
    <!-- Toolbar -->
    <div class="toolbar p-2 bg-gray-50 dark:bg-gray-800">
      <div class="flex items-center space-x-2">
        <button
          type="button"
          title="Bold"
          class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
          @click="formatText('bold')"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          title="Italic"
          class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded italic"
          @click="formatText('italic')"
        >
          I
        </button>
        <button
          type="button"
          title="Underline"
          class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded underline"
          @click="formatText('underline')"
        >
          U
        </button>
        <div class="border-l border-gray-300 h-6 mx-2" />
        <button
          type="button"
          title="Heading"
          class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded font-bold"
          @click="formatText('formatBlock', 'h3')"
        >
          H
        </button>
        <button
          type="button"
          title="Paragraph"
          class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
          @click="formatText('formatBlock', 'p')"
        >
          P
        </button>
        <div class="border-l border-gray-300 h-6 mx-2" />
        <button
          type="button"
          title="Bullet List"
          class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
          @click="formatText('insertUnorderedList')"
        >
          •
        </button>
        <button
          type="button"
          title="Link"
          class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
          @click="insertLink"
        >
          🔗
        </button>
      </div>
    </div>
    
    <!-- Editor -->
    <div
      ref="editorRef"
      contenteditable="true"
      class="w-full px-4 py-3 min-h-[300px] focus:outline-none bg-white dark:bg-gray-900 dark:text-white"
      @input="updateContent"
      @paste="handlePaste"
    />
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

const editorRef = ref<HTMLDivElement | null>(null)

// Format text
const formatText = (command: string, value?: string) => {
  document.execCommand(command, false, value || '')
  updateContent()
}

// Insert link
const insertLink = () => {
  const url = prompt('Nhập URL:')
  if (url) {
    formatText('createLink', url)
  }
}

// Update content
const updateContent = () => {
  if (editorRef.value) {
    emit('update:modelValue', editorRef.value.innerHTML)
  }
}

// Handle paste
const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault()
  const text = event.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text)
  updateContent()
}

// Set initial content
onMounted(() => {
  if (editorRef.value && props.modelValue) {
    editorRef.value.innerHTML = props.modelValue
  }
})

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (editorRef.value && editorRef.value.innerHTML !== newValue) {
    editorRef.value.innerHTML = newValue || ''
  }
})
</script>

<style scoped>
.simple-editor-wrapper {
  border-radius: 0.375rem;
  overflow: hidden;
}

.toolbar button:hover {
  background-color: #f3f4f6;
}

.dark .toolbar button:hover {
  background-color: #374151;
}
</style>
