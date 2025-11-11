<script setup lang="ts">
import { ref, computed } from 'vue'
import { brandService } from '@/services/brand.service'
import { fileService } from '@/services'

const form = ref({
  name: '',
  logoUrl: '' as string | null
})

const errors = ref<{ name?: string }>({})
const isSubmitting = ref(false)

// Image upload
const isUploadingImage = ref(false)
const imagePreview = ref<string>('')
const fileInput = ref<HTMLInputElement>()

function clickFileInput() {
  fileInput.value?.click()
}
function removeImage() {
  form.value.logoUrl = ''
  imagePreview.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

async function handleImageUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'].includes(file.type)) {
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
    const res = await fileService.uploadFile(file, 'brand')
    const data = Array.isArray(res?.data) ? res?.data[0] : res?.data
    if (res?.success && data?.fileName) {
      form.value.logoUrl = data.fileName
    }
  } finally {
    isUploadingImage.value = false
  }
}

const canSubmit = computed(() => form.value.name.trim().length > 0)

async function submit() {
  errors.value = {}
  if (!canSubmit.value) {
    errors.value.name = 'Tên thương hiệu là bắt buộc'
    return
  }
  isSubmitting.value = true
  try {
    const res = await brandService.createBrand({
      name: form.value.name.trim(),
      isPublished: true,
      logoUrl: form.value.logoUrl || undefined
    })
    const toast = useToast()
    if (res?.success) {
      toast.add({ title: 'Đã tạo thương hiệu', description: form.value.name, color: 'success' })
      navigateTo('/brands')
    } else {
      toast.add({ title: 'Tạo thất bại', description: res?.message || 'Có lỗi xảy ra', color: 'error' })
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-3xl mx-auto">
    <UPageCard title="Thông tin thương hiệu" variant="soft" class="bg-white rounded-lg">
      <form class="space-y-5" @submit.prevent="submit">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tên thương hiệu <span class="text-red-500">*</span></label>
          <input
            v-model="form.name"
            type="text"
            placeholder="Nhập tên thương hiệu"
            :class="{ 'border-red-500': errors.name }"
            class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
          <p v-if="errors.name" class="mt-1 text-sm text-red-600">
            {{ errors.name }}
          </p>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Logo</label>
          <div class="space-y-3">
            <div v-if="imagePreview" class="relative">
              <img :src="imagePreview" alt="Preview" class="w-40 h-40 object-cover rounded-lg border border-gray-200">
              <button type="button" class="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:bg-gray-100" @click="removeImage">
                <UIcon name="i-lucide-x" class="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div v-else class="upload-area border border-dashed border-gray-300 rounded-xl p-6 text-center bg-white hover:border-primary-500 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500 transition-colors cursor-pointer" @click="clickFileInput">
              <div class="text-sm text-gray-600">
                <span class="font-medium text-primary-600">Click để tải logo</span> hoặc kéo thả vào đây
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
        
        <div class="pt-2 flex items-center gap-3">
          <UButton
            type="submit"
            :loading="isSubmitting"
            label="Lưu"
            :disabled="!canSubmit"
          />
          <span v-if="!canSubmit" class="text-xs text-gray-500">Điền tên để lưu</span>
        </div>
      </form>
    </UPageCard>
  </div>
</template>

<style scoped>
.upload-area { border: 1px dashed #d1d5db !important; }
</style>
