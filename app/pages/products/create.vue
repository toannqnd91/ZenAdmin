<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

useHead({
  title: 'Thêm sản phẩm mới - Cơ Khí Tam Long'
})

const {
  formData,
  isSubmitting,
  errors,
  categories,
  loadingCategories,
  selectedCategories,
  toggleCategory,
  isDropdownOpen,
  searchTerm,
  filteredCategories,
  removeCategory,
  isUploadingImage,
  imagePreviews,
  handleImageUpload,
  removeImage,
  submitForm
} = useProductForm()

const cancel = () => {
  navigateTo('/products')
}

const onSubmit = async () => {
  const ok = await submitForm()
  if (ok) navigateTo('/products')
}
</script>

<template>
  <UDashboardPanel id="add-product">
    <template #header>
      <UDashboardNavbar title="Thêm sản phẩm mới">
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
              <NuxtLink to="/products" class="hover:text-primary-600 dark:hover:text-primary-400">
                Quản lý sản phẩm
              </NuxtLink>
            </li>
            <li class="flex items-center">
              <svg class="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
              </svg>
              <span class="text-gray-900 dark:text-white font-medium">Thêm sản phẩm mới</span>
            </li>
          </ol>
        </nav>

        <!-- Main Layout - 2 columns -->
        <div class="flex flex-col lg:flex-row gap-6">
          <!-- Left Column - Main Form -->
          <div class="flex-1">
            <UPageCard
              title="Thông tin sản phẩm"
              variant="soft"
              class="overflow-hidden"
            >
              <!-- Form -->
              <form class="space-y-6" @submit.prevent="submitForm">
                <!-- Name -->
                <div>
                  <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tên sản phẩm <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    v-model="formData.name"
                    type="text"
                    placeholder="Nhập tên sản phẩm"
                    :class="{ 'border-red-500': errors.name }"
                    class="w-full px-3 py-2.5 text-sm rounded-md border-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                  <p v-if="errors.name" class="mt-1 text-sm text-red-600">
                    {{ errors.name }}
                  </p>
                </div>

                <!-- Content Editor -->
                <div>
                  <label for="content" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nội dung chi tiết <span class="text-red-500">*</span>
                  </label>
                  <TinyMCESelfHost
                    v-model="formData.content"
                    placeholder="Nhập nội dung chi tiết..."
                    :height="500"
                  />
                  <p v-if="errors.content" class="mt-1 text-sm text-red-600">
                    {{ errors.content }}
                  </p>
                </div>

                <!-- Description -->
                <div>
                  <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mô tả
                  </label>
                  <textarea
                    id="description"
                    v-model="formData.description"
                    rows="3"
                    class="w-full px-3 py-2.5 text-sm rounded-md border-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>

                <!-- Price -->
                <div>
                  <label for="price" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Giá
                  </label>
                  <input
                    id="price"
                    v-model.number="formData.price"
                    type="number"
                    placeholder="Nhập giá"
                    class="w-full px-3 py-2.5 text-sm rounded-md border-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                </div>

                <!-- SKU -->
                <div>
                  <label for="sku" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SKU
                  </label>
                  <input
                    id="sku"
                    v-model="formData.sku"
                    type="text"
                    placeholder="SKU"
                    class="w-full px-3 py-2.5 text-sm rounded-md border-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                </div>

              </form>
            </UPageCard>
          </div>

          <!-- Right Column - Sidebar -->
          <div class="w-full lg:w-80 space-y-6">
            <!-- Featured Image -->
            <UPageCard
              title="Ảnh sản phẩm"
              variant="soft"
            >
              <div class="space-y-4">
                <!-- Image Previews -->
                <div v-if="imagePreviews.length" class="flex flex-wrap gap-2">
                  <div v-for="(img, idx) in imagePreviews" :key="idx" class="relative group">
                    <img :src="img" class="w-24 h-24 object-cover rounded border" />
                    <UButton
                      icon="i-lucide-x"
                      size="xs"
                      color="error"
                      variant="soft"
                      class="absolute top-1 right-1 opacity-80 group-hover:opacity-100"
                      @click="removeImage(idx)"
                    />
                  </div>
                </div>
                <!-- Upload Area -->
                <label class="w-full flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center bg-white dark:bg-gray-800 hover:border-primary-500 dark:hover:border-primary-400 focus-within:border-primary-500 dark:focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-500 transition-colors cursor-pointer">
                  <input
                    type="file"
                    class="hidden"
                    accept="image/*"
                    multiple
                    :disabled="isUploadingImage"
                    @change="handleImageUpload"
                  />
                  <span v-if="!isUploadingImage" class="text-xs text-gray-500">+ Thêm ảnh</span>
                  <span v-else class="text-xs text-gray-400">Đang tải...</span>
                </label>
              </div>
            </UPageCard>

            <!-- Categories (Dropdown multi-select, giống news/create) -->
            <UPageCard
              title="Danh mục sản phẩm"
              variant="soft"
            >
              <div v-if="loadingCategories">Đang tải danh mục...</div>
              <div v-else>
                <!-- Dropdown Container -->
                <div class="relative dropdown-container mb-2">
                  <button
                    type="button"
                    class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-left flex items-center justify-between"
                    @click="isDropdownOpen = !isDropdownOpen"
                  >
                    <span class="text-gray-500">
                      {{ selectedCategories.length > 0 ? `Đã chọn ${selectedCategories.length} danh mục` : 'Chọn danh mục sản phẩm' }}
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
                  Chọn một hoặc nhiều danh mục cho sản phẩm
                </p>
              </div>
            </UPageCard>

            <!-- Options -->
            <UPageCard
              title="Tùy chọn khác"
              variant="soft"
            >
              <div class="flex gap-4">
                <UCheckbox v-model="formData.isFeatured" label="Nổi bật" />
                <UCheckbox v-model="formData.isInStock" label="Còn hàng" />
              </div>
            </UPageCard>

            <div v-if="errors.form" class="text-error">{{ errors.form }}</div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
