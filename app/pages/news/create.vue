<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

useHead({
  title: 'Thêm tin tức mới - Đông Trùng Hạ Thảo Phú Nhân'
})

// Use the news form composable
const {
  // Form data
  formData,
  isSubmitting,
  errors,
  
  // Publication
  publicationStatus,
  statusItems,
  
  // Tags
  tagInput,
  addTag,
  removeTag,
  
  // Categories
  isDropdownOpen,
  searchTerm,
  filteredCategories,
  selectedCategories,
  toggleCategory,
  removeCategory,
  
  // Image upload
  isUploadingImage,
  imagePreview,
  fileInput,
  handleImageUpload,
  removeImage,
  clickFileInput,
  
  // Form methods
  submitForm
} = await useNewsForm()

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

        <template #right>
          <div class="flex items-center gap-1.5">
            <UButton
              label="Hủy"
              variant="ghost"
              color="neutral"
              @click="cancel"
            />
            <UButton
              label="Lưu"
              :loading="isSubmitting"
              @click="submitForm"
            />
          </div>
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
        <div class="flex flex-col lg:flex-row gap-6">
          <!-- Left Column - Main Form -->
          <div class="flex-1">
            <UPageCard
              title="Thông tin bài viết"
              variant="soft"
              class="overflow-hidden"
            >
              <!-- Form -->
              <form class="space-y-6" @submit.prevent="submitForm">
                <!-- Title -->
                <div>
                  <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tiêu đề <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="title"
                    v-model="formData.title"
                    type="text"
                    placeholder="Nhập tiêu đề"
                    :class="{ 'border-red-500': errors.title }"
                    class="w-full px-3 py-2.5 text-sm rounded-md border-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                  <p v-if="errors.title" class="mt-1 text-sm text-red-600">
                    {{ errors.title }}
                  </p>
                </div>

                <!-- Content Editor -->
                <div>
                  <label for="content" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nội dung bài viết <span class="text-red-500">*</span>
                  </label>
                  <TinyMCESelfHost
                    v-model="formData.content"
                    placeholder="Nhập nội dung bài viết..."
                    :height="500"
                  />
                  <p v-if="errors.content" class="mt-1 text-sm text-red-600">
                    {{ errors.content }}
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
                    placeholder="Nhập mô tả ngắn"
                    :class="{ 'border-red-500': errors.desc }"
                    class="w-full px-3 py-2.5 text-sm rounded-md border-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                  <p v-if="errors.desc" class="mt-1 text-sm text-red-600">
                    {{ errors.desc }}
                  </p>
                </div>

              </form>
            </UPageCard>
          </div>

          <!-- Right Column - Sidebar -->
          <div class="w-full lg:w-80 space-y-6">
            <!-- Publication Status -->
            <UPageCard
              title="Trạng thái"
              variant="soft"
            >
              <URadioGroup
                v-model="publicationStatus"
                :items="statusItems"
                class="space-y-2"
              />
              <div>
                <button type="button" class="text-primary-600 hover:text-primary-700 text-sm">
                  Đặt lịch hiển thị
                </button>
              </div>
            </UPageCard>

            <!-- Featured Image -->
            <UPageCard
              title="Ảnh bài viết"
              variant="soft"
            >
              <div class="space-y-4">
                <!-- Image Preview -->
                <div v-if="imagePreview" class="relative">
                  <img 
                    :src="imagePreview" 
                    alt="Preview" 
                    class="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                  <button
                    type="button"
                    class="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    @click="removeImage"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <!-- Upload Area -->
                <div
                  v-else
                  class="upload-area border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center bg-white dark:bg-gray-800 hover:border-primary-500 dark:hover:border-primary-400 focus-within:border-primary-500 dark:focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-500 transition-colors cursor-pointer"
                  @click="clickFileInput"
                >
                  <div class="space-y-2">
                    <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <div class="text-sm text-gray-600 dark:text-gray-400">
                      <span class="font-medium text-primary-600 dark:text-primary-400">Click để tải lên ảnh</span>
                      hoặc kéo thả vào đây
                    </div>
                    <!-- <p class="text-xs text-gray-500">SVG, PNG, JPG or GIF (max. 2MB)</p> -->
                  </div>
                </div>
                
                <!-- Hidden File Input -->
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleImageUpload"
                >
                
                <!-- Loading State -->
                <div v-if="isUploadingImage" class="text-center">
                  <div class="inline-flex items-center px-4 py-2 text-sm text-primary-600 dark:text-primary-400">
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang tải lên...
                  </div>
                </div>
              </div>
            </UPageCard>

            <!-- Categories -->
            <!-- <UPageCard
              title="Khung giao diện"
              variant="soft"
            >
              <select
                v-model="selectedLayout"
                class="w-full px-3 py-2.5 text-sm rounded-md border-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="" disabled>
                  Chọn khung giao diện
                </option>
                <option v-for="option in layoutOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </UPageCard> -->

            <!-- Additional Info -->
            <UPageCard
              title="Thông tin khác"
              variant="soft"
            >
              <!-- Author -->
              <!-- <div class="mb-4">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tác giả</label>
                <select
                  v-model="selectedAuthor"
                  class="w-full px-3 py-2.5 text-sm rounded-md border-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="" disabled>
                    Chọn tác giả
                  </option>
                  <option v-for="option in authorOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </div> -->

              <!-- Categories -->
              <div class="mb-4">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Danh mục bài viết</label>
                
                <!-- Dropdown Container -->
                <div class="relative dropdown-container">
                  <button
                    type="button"
                    class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-left flex items-center justify-between"
                    @click="isDropdownOpen = !isDropdownOpen"
                  >
                    <span class="text-gray-500">
                      {{ selectedCategories.length > 0 ? `Đã chọn ${selectedCategories.length} danh mục` : 'Chọn danh mục bài viết' }}
                    </span>
                    <svg
                      class="w-4 h-4 transform transition-transform"
                      :class="{ 'rotate-180': isDropdownOpen }"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  <!-- Dropdown Menu -->
                  <div
                    v-if="isDropdownOpen"
                    class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md"
                  >
                    <!-- Search Input -->
                    <div class="p-2 border-b border-gray-200 dark:border-gray-700">
                      <input
                        v-model="searchTerm"
                        type="text"
                        placeholder="Tìm kiếm"
                        class="w-full px-3 py-2 text-sm rounded-md border-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                    </div>

                    <!-- Categories List -->
                    <div class="max-h-40 overflow-y-auto">
                      <div v-if="filteredCategories.length === 0" class="p-3 text-sm text-gray-500">
                        {{ searchTerm ? 'Không tìm thấy danh mục' : 'Đang tải danh mục...' }}
                      </div>
                      <label
                        v-for="category in filteredCategories"
                        :key="category.id"
                        class="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      >
                        <UCheckbox
                          :model-value="formData.categoryIds.includes(category.id)"
                          @update:model-value="toggleCategory(category.id)"
                        />
                        <span class="text-sm text-gray-700 dark:text-gray-300">{{ category.name }}</span>
                      </label>
                    </div>
                  </div>
                </div>

                <!-- Selected Categories Tags -->
                <div v-if="selectedCategories.length > 0" class="flex flex-wrap gap-1 mt-2">
                  <span
                    v-for="category in selectedCategories"
                    :key="category.id"
                    class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                  >
                    {{ category.name }}
                    <button
                      type="button"
                      class="ml-1 inline-flex items-center justify-center w-3 h-3 rounded-full text-primary-600 hover:bg-primary-200 hover:text-primary-800 focus:outline-none"
                      @click="removeCategory(category.id)"
                    >
                      ×
                    </button>
                  </span>
                </div>

                <p v-if="errors.categoryIds" class="mt-1 text-sm text-red-600">
                  {{ errors.categoryIds }}
                </p>
                <p class="mt-1 text-xs text-gray-500">
                  Chọn một hoặc nhiều danh mục cho bài viết
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
                    placeholder="Tìm kiếm hoặc thêm mới"
                    class="flex-1 px-3 py-2.5 text-sm rounded-md border-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            </UPageCard>
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
input[type="checkbox"] {
  color: var(--color-primary-600);
  border-color: var(--color-gray-300);
}

input[type="checkbox"]:checked {
  background-color: var(--color-primary-600);
  border-color: var(--color-primary-600);
}

input[type="checkbox"]:focus {
  box-shadow: 0 0 0 2px var(--color-primary-500);
  border-color: var(--color-primary-500);
}

.dark input[type="checkbox"] {
  border-color: var(--color-gray-600);
}

.dark input[type="checkbox"]:checked {
  background-color: var(--color-primary-600);
  border-color: var(--color-primary-600);
}

.dark input[type="checkbox"]:focus {
  box-shadow: 0 0 0 2px var(--color-primary-400);
  border-color: var(--color-primary-400);
}

/* Input dashed border styling */
input[type="text"],
textarea,
select {
  border: 1px dashed #d1d5db !important;
  border-style: dashed !important;
}

.dark input[type="text"],
.dark textarea,
.dark select {
  border: 1px dashed #4b5563 !important;
  border-style: dashed !important;
}

/* Focus state for dashed inputs */
input[type="text"]:focus,
textarea:focus,
select:focus {
  border: none !important;
  border-style: none !important;
  box-shadow: 0 0 0 2px var(--color-primary-500) !important;
}

/* Dropdown button - specific styling */
.dropdown-container button {
  border: 1px dashed #d1d5db !important;
  border-style: dashed !important;
}

.dark .dropdown-container button {
  border: 1px dashed #4b5563 !important;
  border-style: dashed !important;
}

.dropdown-container button:focus {
  border: none !important;
  border-style: none !important;
  box-shadow: 0 0 0 2px var(--color-primary-500) !important;
}

/* Dropdown menu dashed border */
.dropdown-container .absolute {
  border: 1px dashed #d1d5db !important;
  border-style: dashed !important;
}

.dark .dropdown-container .absolute {
  border: 1px dashed #4b5563 !important;
  border-style: dashed !important;
}

/* Upload area dashed border styling */
.upload-area {
  border: 1px dashed #d1d5db !important;
  border-style: dashed !important;
}

.dark .upload-area {
  border: 1px dashed #4b5563 !important;
  border-style: dashed !important;
}

.upload-area:hover {
  border-color: var(--color-primary-500) !important;
}

.dark .upload-area:hover {
  border-color: var(--color-primary-400) !important;
}
</style>