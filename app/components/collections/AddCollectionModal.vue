<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { collectionsService } from '@/services/collections.service'
import type { Collection } from '@/composables/useCollectionsService'
import { fileService } from '@/services'

interface Props {
  modelValue: boolean
  collection?: Partial<Collection> | null
}
const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'saved', col: { id: number | string, name: string }): void
}>()

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const isEdit = computed(() => !!props.collection?.id)

// Form state
const name = ref('')
const description = ref('')
const imageUrl = ref<string>('')

// Keep originals to detect changes on edit
const originalName = ref('')
const originalDescription = ref('')
const originalImageUrl = ref('')

const loading = ref(false)
const touched = ref(false)
const error = ref('')

// Image preview & input
const imagePreview = ref<string>('')
const isUploadingImage = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

function resolveImageUrl(fileName: string) {
  if (!fileName) return ''
  if (/^https?:\/\//.test(fileName) || /^data:/.test(fileName)) return fileName
  try {
    const cfg = useRuntimeConfig()
    // try standard image path helper from fileService if available
    return fileService.getFileUrl(fileName) || `${cfg.public.imageBaseUrl}/image/${fileName}`
  } catch {
    return fileName
  }
}

watch(open, (v) => {
  if (v) {
    if (isEdit.value && props.collection) {
      name.value = props.collection.name || ''
      description.value = props.collection.description || ''
      imageUrl.value = props.collection.imageUrl || ''
      imagePreview.value = imageUrl.value ? resolveImageUrl(imageUrl.value) : ''
      originalName.value = name.value
      originalDescription.value = description.value
      originalImageUrl.value = imageUrl.value
      touched.value = false
      loading.value = false
      error.value = ''
      if (fileInput.value) fileInput.value.value = ''
    } else {
      reset()
    }
  }
})

function reset() {
  name.value = ''
  description.value = ''
  imageUrl.value = ''
  imagePreview.value = ''
  originalName.value = ''
  originalDescription.value = ''
  originalImageUrl.value = ''
  touched.value = false
  loading.value = false
  error.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

const nameError = computed(() => touched.value && !name.value.trim() ? 'Tên bộ sưu tập là bắt buộc' : '')
const isDirty = computed(() => {
  if (!isEdit.value) return true
  return name.value.trim() !== originalName.value.trim()
    || (description.value || '') !== (originalDescription.value || '')
    || (imageUrl.value || '') !== (originalImageUrl.value || '')
})
const canSave = computed(() => {
  const ok = !!name.value.trim()
  return isEdit.value ? ok && isDirty.value : ok
})

function clickFileInput() {
  fileInput.value?.click()
}
function removeImage() {
  imageUrl.value = ''
  imagePreview.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) await uploadImage(file)
}

async function onDrop(e: DragEvent) {
  e.preventDefault()
  const file = e.dataTransfer?.files?.[0]
  if (file) await uploadImage(file)
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
}

async function uploadImage(file: File) {
  const okType = /^(image)\//.test(file.type)
  if (!okType) return
  if (file.size > 2 * 1024 * 1024) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    imagePreview.value = String(ev.target?.result || '')
  }
  reader.readAsDataURL(file)
  try {
    isUploadingImage.value = true
    const res = await fileService.uploadFile(file, 'collections')
    const data = Array.isArray(res?.data) ? res.data[0] : res?.data
    if (res?.success && data?.fileName) imageUrl.value = String(data.fileName)
  } finally {
    isUploadingImage.value = false
  }
}

async function save() {
  touched.value = true
  if (!canSave.value) return
  loading.value = true
  error.value = ''
  try {
    if (isEdit.value && props.collection?.id) {
      const resp = await collectionsService.updateCollection({
        id: Number(props.collection.id),
        name: name.value.trim(),
        description: description.value || undefined,
        imageUrl: imageUrl.value || undefined,
        isPublished: props.collection.isPublished ?? true
      })
      if (!resp?.success) throw new Error(resp?.message || 'Cập nhật thất bại')
      emit('saved', { id: props.collection.id, name: name.value.trim() })
    } else {
      const resp = await collectionsService.createCollection({
        name: name.value.trim(),
        description: description.value || undefined,
        imageUrl: imageUrl.value || undefined,
        isPublished: true
      })
      const newId = resp?.data?.id ?? Date.now()
      emit('saved', { id: newId, name: name.value.trim() })
    }
    open.value = false
  } catch (err) {
    const msg = (err as Error)?.message || 'Lỗi không xác định'
    error.value = isEdit.value ? (msg || 'Cập nhật thất bại') : (msg || 'Tạo thất bại')
  } finally {
    loading.value = false
  }
}

function close() {
  if (!loading.value) open.value = false
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-4"
      @keydown.esc="close"
    >
      <div
        class="bg-white w-full max-w-xl rounded-lg shadow-lg flex flex-col"
        role="dialog"
        aria-modal="true"
        @click.stop
      >
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold">
            {{ isEdit ? 'Cập nhật bộ sưu tập' : 'Thêm bộ sưu tập' }}
          </h3>
          <button
            class="text-gray-400 hover:text-gray-600"
            @click="close"
          >
            &times;
          </button>
        </div>
        <div class="px-6 py-5 space-y-4 text-sm">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Tên bộ sưu tập <span class="text-red-500">*</span></label>
            <input
              v-model="name"
              type="text"
              class="w-full h-9 px-3 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              :class="nameError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'"
              placeholder="Nhập tên bộ sưu tập"
              @blur="touched = true"
            >
            <p
              v-if="nameError"
              class="text-xs text-red-600 mt-1"
            >
              {{ nameError }}
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Mô tả</label>
            <textarea
              v-model="description"
              rows="3"
              class="w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border-gray-300 bg-white"
              placeholder="Mô tả ngắn"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Ảnh</label>
            <input
              ref="fileInput"
              type="file"
              class="hidden"
              accept="image/*"
              @change="onFileChange"
            >
            <div
              v-if="!imagePreview"
              class="border border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-[120px] bg-white cursor-pointer"
              @click="clickFileInput"
              @dragover.prevent="onDragOver"
              @drop="onDrop"
            >
              <div class="flex items-center justify-center gap-2 mb-1">
                <UButton label="Tải ảnh" size="sm" />
              </div>
              <div class="text-gray-500 text-xs">
                Kéo thả ảnh vào đây hoặc bấm để chọn
              </div>
            </div>
            <div v-else class="relative inline-block">
              <img
                :src="imagePreview"
                alt="Preview"
                class="w-32 h-32 rounded-lg border border-gray-200 object-cover"
              >
              <button
                type="button"
                class="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                @click="removeImage"
              >
                <UIcon name="i-lucide-x" class="h-4 w-4 text-gray-600" />
              </button>
              <div
                v-if="isUploadingImage"
                class="absolute inset-0 bg-white/60 flex items-center justify-center rounded-lg"
              >
                <svg
                  class="animate-spin h-6 w-6 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              </div>
            </div>
          </div>
          <p
            v-if="error"
            class="text-xs text-red-600"
          >
            {{ error }}
          </p>
        </div>
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            type="button"
            class="h-9 px-4 rounded-md border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50"
            @click="close"
          >
            Hủy
          </button>
          <button
            type="button"
            class="h-9 px-5 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-60"
            :disabled="loading || !canSave"
            @click="save"
          >
            <span v-if="!loading">{{ isEdit ? 'Cập nhật' : 'Lưu' }}</span>
            <span v-else>Đang xử lý...</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
</style>
