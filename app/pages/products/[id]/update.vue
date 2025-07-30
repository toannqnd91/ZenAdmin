<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductForm } from '@/composables/useProductForm'
import { productService } from '@/services/product.service'
import { fileService } from '@/services/file.service'

// Route & Router
const route = useRoute()
const router = useRouter()
const productId = Number(route.params.id)

// Form composable
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

// Fetch product detail
const loadingDetail = ref(true)
const fetchError = ref('')

onMounted(async () => {
  try {
    loadingDetail.value = true
    const res = await productService.getProductById(productId)
    if (res?.data) {
      // Fill formData
      formData.value = {
        name: res.data.name || '',
        price: res.data.price ?? null,
        sku: res.data.sku || '',
        description: res.data.description || '',
        content: res.data.content || '',
        imageUrls: res.data.imageUrls || [],
        categoryIds: (res.data.categories || []).map((c: any) => c.id),
        url: res.data.url || '',
        isFeatured: !!res.data.isFeatured,
        isInStock: !!res.data.isInStock
      }
      // Preview images
      imagePreviews.value = (res.data.imageUrls || []).map((img: string) => fileService.getFileUrl(img))
    }
  } catch (e: any) {
    fetchError.value = e.message || 'Không lấy được thông tin sản phẩm'
  } finally {
    loadingDetail.value = false
  }
})

const cancel = () => {
  router.push('/products')
}

const onSubmit = async () => {
  errors.value = {}
  isSubmitting.value = true
  try {
    // Validate
    if (!formData.value.name) errors.value.name = 'Tên sản phẩm là bắt buộc'
    if (!formData.value.content) errors.value.content = 'Nội dung là bắt buộc'
    if (Object.keys(errors.value).length) return
    // Gọi API update
    await productService.updateProduct({
      id: productId,
      ...formData.value,
      price: formData.value.price || 0,
      categoryIds: formData.value.categoryIds,
      imageUrls: formData.value.imageUrls
    })
    router.push('/products')
  } catch (e: any) {
    errors.value.form = e.message || 'Đã có lỗi xảy ra'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="update-product">
    <template #header>
      <UDashboardNavbar title="Cập nhật sản phẩm">
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
              @click="onSubmit"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full">
        <div v-if="loadingDetail" class="text-center py-10 text-gray-500">Đang tải dữ liệu sản phẩm...</div>
        <div v-else-if="fetchError" class="text-error py-10">{{ fetchError }}</div>
        <div v-else>
          <!-- Copy toàn bộ layout form từ create.vue, chỉ đổi submit -->
          <div class="flex flex-col lg:flex-row gap-6">
            <!-- Left Column - Main Form -->
            <div class="flex-1">
              <UPageCard
                title="Thông tin sản phẩm"
                variant="soft"
                class="overflow-hidden"
              >
                <!-- Form -->
                <form class="space-y-6" @submit.prevent="onSubmit">
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
      </div>
    </template>
  </UDashboardPanel>
</template>
