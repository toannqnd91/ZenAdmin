<script setup lang="ts">
import { newsService } from '@/services'
import type { CreateNewsRequest } from '@/services'

definePageMeta({
  layout: 'default'
})

useHead({
  title: 'Thêm tin tức mới - Đông Trùng Hạ Thảo Phú Nhân'
})

// Form data
const formData = ref<CreateNewsRequest>({
  title: '',
  desc: '',
  content: '',
  imageUrl: '',
  tags: [],
  categoryIds: []
})

// Form states
const isSubmitting = ref(false)
const errors = ref<Record<string, string>>({})

// Tags input
const tagInput = ref('')
const addTag = (event?: Event) => {
  // Prevent form submission if called from Enter key
  if (event) {
    event.preventDefault()
  }
  
  const tag = tagInput.value.trim()
  if (tag && !formData.value.tags?.includes(tag)) {
    if (!formData.value.tags) formData.value.tags = []
    formData.value.tags.push(tag)
    tagInput.value = ''
  }
}

const removeTag = (index: number) => {
  if (formData.value.tags) {
    formData.value.tags.splice(index, 1)
  }
}

// Fetch categories
const { data: categoriesResponse } = await useAsyncData('news-categories', async () => {
  const response = await newsService.getCategories()
  return response
})

const categories = computed(() => {
  if (!categoriesResponse.value?.success || !categoriesResponse.value.data) return []
  return categoriesResponse.value.data
})

// Form validation
const validateForm = () => {
  errors.value = {}
  
  if (!formData.value.title.trim()) {
    errors.value.title = 'Tiêu đề là bắt buộc'
  }
  
  if (!formData.value.desc.trim()) {
    errors.value.desc = 'Mô tả ngắn là bắt buộc'
  }
  
  if (!formData.value.content.trim()) {
    errors.value.content = 'Nội dung là bắt buộc'
  }
  
  if (!formData.value.categoryIds.length) {
    errors.value.categoryIds = 'Vui lòng chọn ít nhất một danh mục'
  }
  
  return Object.keys(errors.value).length === 0
}

// Submit form
const submitForm = async () => {
  if (!validateForm()) return
  
  isSubmitting.value = true
  
  try {
    const response = await newsService.createNews(formData.value)
    
    if (response.success) {
      // Show success notification
      console.log('Tạo tin tức thành công!')
      
      // Redirect to news list
      await navigateTo('/news')
    } else {
      console.error('Lỗi tạo tin tức:', response.message)
    }
  } catch (error) {
    console.error('Lỗi:', error)
  } finally {
    isSubmitting.value = false
  }
}

// Cancel and go back
const cancel = () => {
  navigateTo('/news')
}
</script>

<template>
  <UDashboardPanel id="add-news">
    <template #header>
      <UDashboardNavbar title="Thêm tin tức mới">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full">
        <!-- Breadcrumb -->
        <nav class="mb-6" aria-label="Breadcrumb">
          <ol class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <li>
              <NuxtLink to="/news" class="hover:text-primary-600 dark:hover:text-primary-400">
                Quản lý tin tức
              </NuxtLink>
            </li>
            <li class="flex items-center">
              <svg class="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
              </svg>
              <span class="text-gray-900 dark:text-white font-medium">Thêm tin tức mới</span>
            </li>
          </ol>
        </nav>

        <!-- Main Layout - 2 columns -->
        <div class="flex gap-6">
          <!-- Left Column - Main Form -->
          <div class="flex-1">
            <div class="bg-white dark:bg-gray-900 shadow rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
              <!-- Header Section -->
              <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                <h1 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Thông tin bài viết
                </h1>
              </div>

              <!-- Form -->
              <form class="p-6 space-y-6" @submit.prevent="submitForm">
                <!-- Title -->
                <div>
                  <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tiêu đề <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="title"
                    v-model="formData.title"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
                    :class="{ 'border-red-500': errors.title }"
                    placeholder="Nhập tiêu đề"
                  >
                  <p v-if="errors.title" class="mt-1 text-sm text-red-600">
                    {{ errors.title }}
                  </p>
                </div>

                <!-- Content Editor -->
                <div>
                  <label for="content" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nội dung bài viết
                  </label>
                  <div class="border border-gray-300 dark:border-gray-600 rounded-md">
                    <!-- Toolbar -->
                    <div class="border-b border-gray-200 dark:border-gray-700 p-2 flex items-center space-x-2 bg-gray-50 dark:bg-gray-800">
                      <select class="text-sm border-0 bg-transparent">
                        <option>Đoạn</option>
                      </select>
                      <div class="border-l border-gray-300 h-6 mx-2" />
                      <button
                        type="button"
                        class="p-1 text-gray-600 hover:text-gray-900"
                      >
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 4h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        class="p-1 text-gray-600 hover:text-gray-900 font-bold"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        class="p-1 text-gray-600 hover:text-gray-900 italic"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        class="p-1 text-gray-600 hover:text-gray-900 underline"
                      >
                        U
                      </button>
                    </div>
                    
                    <!-- Editor Area -->
                    <textarea
                      id="content"
                      v-model="formData.content"
                      rows="12"
                      class="w-full px-4 py-3 border-0 focus:outline-none focus:ring-0 resize-none dark:bg-gray-900 dark:text-white"
                      :class="{ 'border-red-500': errors.content }"
                      placeholder="Nhập nội dung bài viết..."
                    />
                  </div>
                  <p v-if="errors.content" class="mt-1 text-sm text-red-600">
                    {{ errors.content }}
                  </p>
                  <p class="mt-1 text-xs text-gray-500">
                    HTML: 0/100000
                  </p>
                </div>

                <!-- Description -->
                <div>
                  <label for="desc" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tóm tắt
                  </label>
                  <textarea
                    id="desc"
                    v-model="formData.desc"
                    rows="3"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
                    :class="{ 'border-red-500': errors.desc }"
                    placeholder="Nhập mô tả ngắn"
                  />
                  <p v-if="errors.desc" class="mt-1 text-sm text-red-600">
                    {{ errors.desc }}
                  </p>
                </div>

                <!-- Form Actions -->
                <div class="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    @click="cancel"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    :disabled="isSubmitting"
                    class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span v-if="isSubmitting">Đang lưu...</span>
                    <span v-else>Lưu</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Right Column - Sidebar -->
          <div class="w-80 space-y-6">
            <!-- Publication Status -->
            <div class="bg-white dark:bg-gray-900 shadow rounded-lg border border-gray-200 dark:border-gray-800 p-4">
              <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Trạng thái
              </h3>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="published"
                    class="text-primary-600 focus:ring-primary-500"
                    checked
                  >
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Hiện</span>
                </label>
                <label class="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="draft"
                    class="text-primary-600 focus:ring-primary-500"
                  >
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Ẩn</span>
                </label>
              </div>
              <div class="mt-3">
                <button type="button" class="text-primary-600 hover:text-primary-700 text-sm">
                  Đặt lịch hiển thị
                </button>
              </div>
            </div>

            <!-- Featured Image -->
            <div class="bg-white dark:bg-gray-900 shadow rounded-lg border border-gray-200 dark:border-gray-800 p-4">
              <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Ảnh bài viết
              </h3>
              <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <div class="space-y-2">
                  <svg
                    class="mx-auto h-8 w-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <div class="text-sm">
                    <button type="button" class="text-primary-600 hover:text-primary-700">
                      Kéo thả hoặc thêm ảnh từ URL
                    </button>
                  </div>
                  <div class="text-sm">
                    <button type="button" class="text-primary-600 hover:text-primary-700">
                      Tải ảnh từ thiết bị
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Image URL Input -->
              <div class="mt-3">
                <input
                  v-model="formData.imageUrl"
                  type="url"
                  class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
                  placeholder="https://example.com/image.jpg"
                >
              </div>
            </div>

            <!-- Categories -->
            <div class="bg-white dark:bg-gray-900 shadow rounded-lg border border-gray-200 dark:border-gray-800 p-4">
              <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Khung giao diện
              </h3>
              <select class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white">
                <option value="article">
                  article
                </option>
              </select>
            </div>

            <!-- Additional Info -->
            <div class="bg-white dark:bg-gray-900 shadow rounded-lg border border-gray-200 dark:border-gray-800 p-4">
              <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Thông tin khác
              </h3>
              
              <!-- Author -->
              <div class="mb-4">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tác giả</label>
                <select class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white">
                  <option>Phạm Văn Toàn</option>
                </select>
              </div>

              <!-- Categories -->
              <div class="mb-4">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Danh mục bài viết</label>
                <select class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white">
                  <option>Chọn danh mục bài viết</option>
                  <option v-for="category in categories" :key="category.id" :value="category.id">
                    {{ category.name }}
                  </option>
                </select>
                <p v-if="errors.categoryIds" class="mt-1 text-sm text-red-600">
                  {{ errors.categoryIds }}
                </p>
              </div>

              <!-- Tags -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">Tag</label>
                  <button type="button" class="text-xs text-primary-600 hover:text-primary-700">
                    Danh sách tag
                  </button>
                </div>
                <div class="flex space-x-2">
                  <input
                    id="tagInput"
                    v-model="tagInput"
                    type="text"
                    class="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Tìm kiếm hoặc thêm mới"
                    @keydown.enter="addTag($event)"
                  >
                </div>
                <div v-if="formData.tags && formData.tags.length > 0" class="flex flex-wrap gap-1 mt-2">
                  <span
                    v-for="(tag, index) in formData.tags"
                    :key="index"
                    class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                  >
                    {{ tag }}
                    <button
                      type="button"
                      class="ml-1 inline-flex items-center justify-center w-3 h-3 rounded-full text-primary-600 hover:bg-primary-200 hover:text-primary-800 focus:outline-none"
                      @click="removeTag(index)"
                    >
                      ×
                    </button>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
/* Custom styles for better form styling */
.max-h-40 {
  max-height: 10rem;
}

/* Checkbox custom styling */
input[type="checkbox"]:checked {
  background-color: var(--color-primary-600);
  border-color: var(--color-primary-600);
}
</style>
