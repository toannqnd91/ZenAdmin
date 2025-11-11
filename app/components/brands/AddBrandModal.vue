<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { brandService, type Brand } from '@/services/brand.service'
import { fileService } from '@/services'

interface Props { modelValue: boolean; brand?: Partial<Brand> | null }
const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'saved', brand: { id: number | string, name: string }): void
}>()

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

// Mode: edit if brand has id
const isEdit = computed(() => !!props.brand?.id)

// Form state
const name = ref('')
// Keep original values to detect changes in edit mode
const originalName = ref('')
const originalLogoUrl = ref('')
// slug & isPublished handled by backend; omit from UI
const touched = ref(false)
const loading = ref(false)
const error = ref('')

// Image state
const logoUrl = ref<string>('')
const isUploadingImage = ref(false)
const imagePreview = ref<string>('')
const fileInput = ref<HTMLInputElement | null>(null)

// Helpers
watch(open, (v) => {
  if (v) {
    if (isEdit.value && props.brand) {
      // Prefill for edit
      name.value = props.brand.name || ''
      logoUrl.value = props.brand.logoUrl || ''
      imagePreview.value = props.brand.logoUrl ? resolveImageUrl(props.brand.logoUrl) : ''
      // snapshot originals for dirty check
      originalName.value = name.value
      originalLogoUrl.value = logoUrl.value
      touched.value = false
      loading.value = false
      error.value = ''
      if (fileInput.value) fileInput.value.value = ''
    } else {
      reset()
    }
  }
})

function resolveImageUrl(fileName: string) {
  // Simple heuristic: if already absolute or data URL, return as-is; else use runtime image base URL
  if (!fileName) return ''
  if (/^https?:\/\//.test(fileName) || /^data:/.test(fileName)) return fileName
  try {
    const cfg = useRuntimeConfig()
    return `${cfg.public.imageBaseUrl || ''}/${fileName}`.replace(/\/+/, '/').replace(':/', '://')
  } catch {
    return fileName
  }
}

function reset() {
  name.value = ''
  originalName.value = ''
  touched.value = false
  loading.value = false
  error.value = ''
  logoUrl.value = ''
  originalLogoUrl.value = ''
  imagePreview.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

const nameError = computed(() => touched.value && !name.value.trim() ? 'Tên thương hiệu là bắt buộc' : '')
// Dirty check for edit mode: disable update if nothing changed
const isDirty = computed(() => {
  if (!isEdit.value) return true
  const currentName = name.value.trim()
  const origName = originalName.value.trim()
  return currentName !== origName || (logoUrl.value || '') !== (originalLogoUrl.value || '')
})
const canSave = computed(() => {
  const hasName = !!name.value.trim()
  return isEdit.value ? (hasName && isDirty.value) : hasName
})

function getIdFromResponse(res: unknown): string | number | undefined {
  const obj = (res as Record<string, unknown>) || {}
  const data = (obj.data as Record<string, unknown> | undefined) || obj
  const id = (data && (data as { id?: string | number }).id)
  return typeof id === 'string' || typeof id === 'number' ? id : undefined
}

async function save() {
  touched.value = true
  if (!canSave.value) return
  loading.value = true
  error.value = ''
  try {
    let res: unknown
    if (isEdit.value && props.brand?.id) {
      res = await brandService.updateBrand({
        id: Number(props.brand.id),
        name: name.value.trim(),
        logoUrl: logoUrl.value || undefined,
        isPublished: props.brand.isPublished ?? true
      })
    } else {
      res = await brandService.createBrand({
        name: name.value.trim(),
        isPublished: true,
        logoUrl: logoUrl.value || undefined
      })
    }
    const id = isEdit.value && props.brand?.id ? props.brand.id : (getIdFromResponse(res) ?? Date.now())
    emit('saved', { id, name: name.value.trim() })
    open.value = false
  } catch (e) {
    console.error(e)
    error.value = isEdit.value ? 'Cập nhật thương hiệu thất bại' : 'Tạo thương hiệu thất bại'
  } finally {
    loading.value = false
  }
}

function close() {
  if (!loading.value) {
    open.value = false
  }
}
function clickFileInput() {
  fileInput.value?.click()
}
function onDragOver(e: DragEvent) {
  e.preventDefault()
}
async function onDrop(e: DragEvent) {
  e.preventDefault()
  const file = e.dataTransfer?.files?.[0]
  if (file) {
    await uploadImage(file)
  }
}
async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    await uploadImage(file)
  }
}
function removeImage() {
  logoUrl.value = ''
  imagePreview.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
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
    const res = await fileService.uploadFile(file, 'brand')
    const data = Array.isArray(res?.data) ? res.data[0] : res?.data
    if (res?.success && data?.fileName) logoUrl.value = String(data.fileName)
  } catch {
    // ignore
  } finally {
    isUploadingImage.value = false
  }
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
            {{ isEdit ? 'Cập nhật thương hiệu' : 'Thêm thương hiệu' }}
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
            <label class="block text-xs font-medium text-gray-600 mb-1">Tên thương hiệu <span class="text-red-500">*</span></label>
            <input
              v-model="name"
              type="text"
              class="w-full h-9 px-3 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              :class="nameError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'"
              placeholder="Nhập tên thương hiệu"
              @blur="touched = true"
            >
            <p v-if="nameError" class="text-xs text-red-600 mt-1">
              {{ nameError }}
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Logo</label>
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
                <UButton label="Tải logo" size="sm" />
              </div>
              <div class="text-gray-500 text-xs">
                Kéo thả ảnh vào đây hoặc bấm để chọn
              </div>
            </div>
            <div v-else class="relative inline-block">
              <img :src="imagePreview" alt="Preview" class="w-32 h-32 rounded-lg border border-gray-200 object-cover">
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
          <!-- Slug & Hiển thị removed: handled by backend defaults -->
          <p v-if="error" class="text-xs text-red-600">
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
