<script setup lang="ts">
import { ref, computed } from 'vue'
import { collectionsService } from '@/services/collections.service'
import { fileService } from '@/services'

const form = ref({
  name: '',
  description: '',
  isPublished: true,
  imageUrl: '' as string | null
})

const errors = ref<{ name?: string }>({})
const isSubmitting = ref(false)

// Image upload state
const isUploadingImage = ref(false)
const imagePreview = ref<string>('')
const fileInput = ref<HTMLInputElement>()

function clickFileInput() {
  fileInput.value?.click()
}
function removeImage() {
  form.value.imageUrl = ''
  imagePreview.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

async function handleImageUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'].includes(file.type)) {
    input.value = ''
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    input.value = ''
    return
  }
  const reader = new FileReader()
  reader.onload = (ev) => {
    imagePreview.value = ev.target?.result as string
  }
  reader.readAsDataURL(file)
  try {
    isUploadingImage.value = true
    const res = await fileService.uploadFile(file, 'collection')
    const data = Array.isArray(res?.data) ? res?.data[0] : res?.data
    if (res?.success && data?.fileName) {
      form.value.imageUrl = data.fileName
    }
  } finally {
    isUploadingImage.value = false
  }
}

const canSubmit = computed(() => form.value.name.trim().length > 0)

async function submit() {
  errors.value = {}
  if (!canSubmit.value) {
    errors.value.name = 'Tên bộ sưu tập là bắt buộc'
    return
  }
  isSubmitting.value = true
  try {
    await collectionsService.createCollection({
      name: form.value.name.trim(),
      description: form.value.description?.trim() || undefined,
      imageUrl: form.value.imageUrl || undefined,
      isPublished: form.value.isPublished
    })
    navigateTo('/collections')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-3xl mx-auto">
    <UPageCard title="Thông tin bộ sưu tập" variant="soft" class="bg-white rounded-lg">
      <form class="space-y-5" @submit.prevent="submit">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tên bộ sưu tập <span class="text-red-500">*</span></label>
          <input
            v-model="form.name"
            type="text"
            placeholder="Nhập tên bộ sưu tập"
            :class="{ 'border-red-500': errors.name }"
            class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
          <p v-if="errors.name" class="mt-1 text-sm text-red-600">
            {{ errors.name }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
          <textarea
            v-model="form.description"
            rows="4"
            placeholder="Mô tả ngắn cho bộ sưu tập (tuỳ chọn)"
            class="w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Ảnh đại diện</label>
          <div class="space-y-3">
            <div v-if="imagePreview" class="relative">
              <img :src="imagePreview" alt="Preview" class="w-40 h-40 object-cover rounded-lg border border-gray-200">
              <button type="button" class="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:bg-gray-100" @click="removeImage">
                <UIcon name="i-lucide-x" class="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div v-else class="upload-area border border-dashed border-gray-300 rounded-xl p-6 text-center bg-white hover:border-primary-500 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500 transition-colors cursor-pointer" @click="clickFileInput">
              <div class="text-sm text-gray-600">
                <span class="font-medium text-primary-600">Click để tải ảnh</span> hoặc kéo thả vào đây
              </div>
            </div>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleImageUpload"
            >
            <div v-if="isUploadingImage" class="text-sm text-primary-600">
              Đang tải lên...
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <UCheckbox v-model="form.isPublished" label="Hiển thị" />
        </div>

        <div class="pt-2">
          <UButton type="submit" :loading="isSubmitting" label="Lưu" />
        </div>
      </form>
    </UPageCard>
  </div>
</template>

<style scoped>
.upload-area { border: 1px dashed #d1d5db !important; }
</style>
