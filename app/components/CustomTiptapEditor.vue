<template>
  <div class="tiptap-editor-wrapper">
    <!-- Toolbar -->
    <div class="flex justify-between items-center p-2 bg-white dark:bg-gray-800">
      <!-- Left Section - Main Tools -->
      <div class="flex items-center space-x-1">
        <!-- Bold -->
        <button
          type="button"
          title="Bold"
          :disabled="isSourceMode"
          :class="{ 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300': editor?.isActive('bold') }"
          class="p-2 toolbar-button hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          @click="editor?.chain().focus().toggleBold().run()"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h8a4 4 0 0 1 4 4 3.5 3.5 0 0 1-1.26 2.69A4 4 0 0 1 18 18H6V4zm2 2v5h6a2 2 0 1 0 0-4H8zm0 7v5h8a2 2 0 1 0 0-4H8z" />
          </svg>
        </button>
        
        <!-- Italic -->
        <button
          type="button"
          title="Italic"
          :disabled="isSourceMode"
          :class="{ 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300': editor?.isActive('italic') }"
          class="p-2 toolbar-button hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          @click="editor?.chain().focus().toggleItalic().run()"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4h-8z" />
          </svg>
        </button>
        
        <!-- Underline -->
        <button
          type="button"
          title="Underline"
          :disabled="isSourceMode"
          :class="{ 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300': editor?.isActive('underline') }"
          class="p-2 toolbar-button hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          @click="editor?.chain().focus().toggleUnderline().run()"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 3v7a2 2 0 1 0 4 0V3a1 1 0 1 1 2 0v7a4 4 0 1 1-8 0V3a1 1 0 0 1 2 0zM4 15h12v2H4v-2z" />
          </svg>
        </button>
        
        <div class="border-l border-gray-300 dark:border-gray-600 h-6 mx-2" />
        
        <!-- H1 -->
        <button
          type="button"
          title="Heading 1"
          :disabled="isSourceMode"
          :class="{ 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300': editor?.isActive('heading', { level: 1 }) }"
          class="p-2 toolbar-button hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 4v3h5.5v12h3V7H19V4z" />
          </svg>
        </button>
        
        <!-- H2 -->
        <button
          type="button"
          title="Heading 2"
          :disabled="isSourceMode"
          :class="{ 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300': editor?.isActive('heading', { level: 2 }) }"
          class="p-2 toolbar-button hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 4v3h5v12h3V7h5V4H3zm14 8v8h3v-6h2v-2h-5z" />
          </svg>
        </button>
        
        <div class="border-l border-gray-300 dark:border-gray-600 h-6 mx-2" />
        
        <!-- Bullet List -->
        <button
          type="button"
          title="Bullet List"
          :disabled="isSourceMode"
          :class="{ 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300': editor?.isActive('bulletList') }"
          class="p-2 toolbar-button hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          @click="editor?.chain().focus().toggleBulletList().run()"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4zM8 8h12v2H8V8zm-2 4a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm2 2h12v2H8v-2zm-2 4a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm2 2h12v2H8v-2z" />
          </svg>
        </button>
        
        <!-- Ordered List -->
        <button
          type="button"
          title="Ordered List"
          :disabled="isSourceMode"
          :class="{ 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300': editor?.isActive('orderedList') }"
          class="p-2 toolbar-button hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          @click="editor?.chain().focus().toggleOrderedList().run()"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 4v2h2V4H3zm0 4v2h2V8H3zm0 4v2h2v-2H3zm4-8h12v2H7V4zm0 4h12v2H7V8zm0 4h12v2H7v-2z" />
          </svg>
        </button>
        
        <div class="border-l border-gray-300 dark:border-gray-600 h-6 mx-2" />
        
        <!-- Link -->
        <button
          type="button"
          title="Add Link"
          :disabled="isSourceMode"
          :class="{ 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300': editor?.isActive('link') }"
          class="p-2 toolbar-button hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          @click="addLink"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" />
          </svg>
        </button>
        
        <div class="border-l border-gray-300 dark:border-gray-600 h-6 mx-2" />
        
        <!-- Text Align Left -->
        <button
          type="button"
          title="Align Left"
          :disabled="isSourceMode"
          :class="{ 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300': editor?.isActive({ textAlign: 'left' }) }"
          class="p-2 toolbar-button hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          @click="editor?.chain().focus().setTextAlign('left').run()"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 3h18v2H3V3zm0 4h12v2H3V7zm0 4h18v2H3v-2zm0 4h12v2H3v-2z" />
          </svg>
        </button>
        
        <!-- Text Align Center -->
        <button
          type="button"
          title="Align Center"
          :disabled="isSourceMode"
          :class="{ 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300': editor?.isActive({ textAlign: 'center' }) }"
          class="p-2 toolbar-button hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          @click="editor?.chain().focus().setTextAlign('center').run()"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 3h18v2H3V3zm3 4h12v2H6V7zm-3 4h18v2H3v-2zm3 4h12v2H6v-2z" />
          </svg>
        </button>
        
        <!-- Text Align Right -->
        <button
          type="button"
          title="Align Right"
          :disabled="isSourceMode"
          :class="{ 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300': editor?.isActive({ textAlign: 'right' }) }"
          class="p-2 toolbar-button hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          @click="editor?.chain().focus().setTextAlign('right').run()"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 3h18v2H3V3zm6 4h12v2H9V7zm-6 4h18v2H3v-2zm6 4h12v2H9v-2z" />
          </svg>
        </button>
        
        <!-- Text Align Justify -->
        <button
          type="button"
          title="Justify"
          :disabled="isSourceMode"
          :class="{ 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300': editor?.isActive({ textAlign: 'justify' }) }"
          class="p-2 toolbar-button hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          @click="editor?.chain().focus().setTextAlign('justify').run()"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 3h18v2H3V3zm0 4h18v2H3V7zm0 4h18v2H3v-2zm0 4h18v2H3v-2z" />
          </svg>
        </button>
        
        <div class="border-l border-gray-300 dark:border-gray-600 h-6 mx-2" />
        
        <!-- View Source -->
        <button
          type="button"
          title="View Source"
          :class="{ 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300': isSourceMode }"
          class="p-2 toolbar-button hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          @click="toggleSourceMode"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" />
          </svg>
        </button>
      </div>
      
      <!-- Right Section - Fullscreen -->
      <div class="flex items-center">
        <button
          type="button"
          title="Fullscreen"
          :class="{ 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300': isFullscreen }"
          class="p-2 toolbar-button hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          @click="toggleFullscreen"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Editor Content -->
    <div class="bg-white dark:bg-gray-800 min-h-[300px] p-4">
      <div v-if="!isSourceMode" class="editor-container">
        <EditorContent
          v-if="editor"
          :editor="(editor as any)"
          class="prose prose-gray dark:prose-invert max-w-none focus:outline-none"
        />
      </div>
      <div v-else>
        <textarea
          v-model="sourceContent"
          class="w-full h-80 p-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm border-0 resize-none focus:outline-none"
          placeholder="HTML source code..."
          @input="handleSourceChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'

// Props & Emits
interface Props {
  modelValue?: string
  placeholder?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Nhập nội dung...'
})

const emit = defineEmits<Emits>()

// Reactive state
const editor = ref<Editor | null>(null)
const isSourceMode = ref(false)
const sourceContent = ref('')
const isFullscreen = ref(false)

// Watch props changes
watch(() => props.modelValue, (newValue) => {
  if (editor.value && editor.value.getHTML() !== newValue) {
    editor.value.commands.setContent(newValue)
    sourceContent.value = newValue
  }
})

// Initialize editor
onMounted(() => {
  editor.value = new Editor({
    content: props.modelValue,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph']
      })
    ],
    onUpdate: ({ editor }) => {
      if (!isSourceMode.value) {
        const html = editor.getHTML()
        sourceContent.value = html
        emit('update:modelValue', html)
      }
    },
    editorProps: {
      attributes: {
        'class': 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
        'data-placeholder': props.placeholder
      }
    }
  })
  
  // Initialize source content
  sourceContent.value = props.modelValue
})

// Cleanup
onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy()
  }
})

// Functions
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  // Here you can add logic to make the editor fullscreen
  // For now, just toggle the state
}

const toggleSourceMode = () => {
  if (!isSourceMode.value) {
    // Switch to source mode
    sourceContent.value = editor.value?.getHTML() || ''
    isSourceMode.value = true
  } else {
    // Switch back to visual mode
    editor.value?.commands.setContent(sourceContent.value || '')
    emit('update:modelValue', sourceContent.value)
    isSourceMode.value = false
  }
}

// Handle source content changes
const handleSourceChange = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  sourceContent.value = target.value
  emit('update:modelValue', target.value)
}

// Add link function
const addLink = () => {
  if (!editor.value) return
  
  const previousUrl = editor.value.getAttributes('link').href
  const url = window.prompt('URL', previousUrl)
  
  // cancelled
  if (url === null) {
    return
  }
  
  // empty
  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  
  // update link
  editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}
</script>

<style scoped>
.tiptap-editor-wrapper {
  border: none;
  border-radius: 0.375rem;
  overflow: hidden;
  font-size: 1rem;
  line-height: 1.5rem;
}

.tiptap-editor-wrapper:focus-within {
  border: none;
  box-shadow: none;
}

.dark .tiptap-editor-wrapper {
  border: none;
  box-shadow: none;
}

.dark .tiptap-editor-wrapper:focus-within {
  border: none;
  box-shadow: none;
}

.toolbar button:hover {
  background-color: #e5e7eb;
  color: #202121;
  transition: all 0.2s ease;
}

.dark .toolbar button:hover {
  background-color: #374151;
  color: #f9fafb;
  transition: all 0.2s ease;
}

.toolbar button.active {
  background-color: #dbeafe;
  color: #1d4ed8;
}

.dark .toolbar button.active {
  background-color: #1e3a8a;
  color: #93c5fd;
}

.toolbar button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar button {
  transition: all 0.2s ease;
}

.editor-container {
  min-height: 200px;
}

.ProseMirror {
  outline: none;
  padding: 16px;
  min-height: 200px;
}

.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}

/* Lists */
.ProseMirror ul, .ProseMirror ol {
  padding-left: 1.5rem;
}

.ProseMirror li p {
  margin: 0;
}

/* Headings */
.ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
  font-weight: bold;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.ProseMirror h1 {
  font-size: 1.875rem;
  line-height: 2.25rem;
}

.ProseMirror h2 {
  font-size: 1.5rem;
  line-height: 2rem;
}

.ProseMirror h3 {
  font-size: 1.25rem;
  line-height: 1.75rem;
}

/* Links */
.ProseMirror a {
  color: #3b82f6;
  text-decoration: underline;
}

.ProseMirror a:hover {
  color: #1d4ed8;
}

/* Text alignment */
.ProseMirror .has-text-align-left {
  text-align: left;
}

.ProseMirror .has-text-align-center {
  text-align: center;
}

.ProseMirror .has-text-align-right {
  text-align: right;
}

.ProseMirror .has-text-align-justify {
  text-align: justify;
}
</style>
