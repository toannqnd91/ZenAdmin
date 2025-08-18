<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { useBrandsService } from '@/composables/useBrandsService'
import { useSuppliersService } from '@/composables/useSuppliersService'
import { useCollectionsService } from '@/composables/useCollectionsService'
import { useProductForm } from '@/composables/useProductForm'
import type { ProductFormData as BaseProductFormData } from '@/composables/useProductForm'
import type { ProductCategory } from '@/composables/useProductsCategoriesService'

// Extend formData type locally to include supplierId, collectionIds and optional tags
type ExtendedProductFormData = BaseProductFormData & {
  supplierId: number | null
  collectionIds: number[]
  tags?: string[]
}

const productForm = useProductForm()
const formData = productForm.formData as Ref<ExtendedProductFormData>
const errors = productForm.errors as Ref<Record<string, string>>
const categories = productForm.categories as Ref<ProductCategory[] | undefined>
const isUploadingImage = productForm.isUploadingImage as Ref<boolean>
const imagePreviews = productForm.imagePreviews as Ref<string[]>
const handleImageUpload = productForm.handleImageUpload as (e: Event) => Promise<void> | void
const removeImage = productForm.removeImage as (index: number) => void
const submitForm = productForm.submitForm as () => Promise<boolean | undefined>
const selectedCategories = productForm.selectedCategories as ComputedRef<ProductCategory[]>
const removeCategory = productForm.removeCategory as (id: number) => void

// Defaults for optional fields
formData.value.supplierId ??= null
formData.value.collectionIds ??= []

// Suppliers and collections for dropdowns
const { data: suppliers, loading: suppliersLoading } = useSuppliersService()
const { collections, loading: collectionsLoading } = useCollectionsService()

// v-models for dropdowns
const selectedSupplier = ref<number | null>(formData.value.supplierId ?? null)
const selectedCollections = ref<number[]>(formData.value.collectionIds ?? [])

watch(selectedSupplier, (val) => {
  formData.value.supplierId = val
})
watch(selectedCollections, (val) => {
  formData.value.collectionIds = val
})

definePageMeta({
  layout: 'default'
})

useHead({
  title: 'New product - Cơ Khí Tam Long'
})

// Options for category dropdown styled like "Bộ sưu tập"
const categoryOptions = computed(() => {
  const cats = (categories.value ?? []) as ProductCategory[]
  return cats.map(c => ({ id: c.id, label: c.name }))
})

const { data: brands, loading: brandsLoading, error: brandsError } = useBrandsService()
const trademark = ref<string>('')
const status = ref<'Public' | 'Draft'>('Public')
const pageTemplate = ref<string>('Default product')
const markAsSoldOut = ref<boolean>(false)
const uniqueSkuPerVariant = ref<boolean>(false)
const membersOnly = ref<boolean>(false)

// Derive a simple slug from product name
const slug = computed(() => {
  const s = (formData.value.name || 'new-product')
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
  return s || 'new-product'
})

// const _previewUrl = computed(() => `test.mehub.space/${slug.value}`)

// Keep submit wrapper for header buttons if needed
const _onSubmit = async () => {
  const ok = await submitForm()
  if (ok) navigateTo('/products')
}

// Removed unused selectedCategoryId

// Keep formData.isInStock in sync with "Mark as sold out"
watch(markAsSoldOut, (v) => {
  formData.value.isInStock = !v
})

// Ensure price-related fields exist on formData
formData.value.compareAtPrice ??= 0
formData.value.importPrice ??= 0
formData.value.chargeTax ??= false

// Computed for profit and margin
const profitDisplay = computed(() => {
  const price = Number(formData.value.price) || 0
  const cost = Number(formData.value.importPrice) || 0
  if (!price || !cost) return ''
  return (price - cost).toLocaleString('vi-VN')
})
const marginDisplay = computed(() => {
  const price = Number(formData.value.price) || 0
  const cost = Number(formData.value.importPrice) || 0
  if (!price || !cost) return ''
  const margin = ((price - cost) / price) * 100
  return margin ? margin.toFixed(0) : ''
})

// Tags input logic
const tagInput = ref<string>('')
if (!('tags' in formData.value)) {
  ;(formData.value as unknown as { tags: string[] }).tags = []
}
const getTags = () => (formData.value as unknown as { tags: string[] }).tags
const commitTag = () => {
  const raw = tagInput.value.trim()
  if (!raw) return
  const value = raw.replace(/[,]+$/g, '').trim()
  if (!value) return
  const list = getTags()
  if (!list.includes(value)) list.push(value)
  tagInput.value = ''
}
const onTagKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    commitTag()
  } else if (e.key === 'Backspace' && tagInput.value === '') {
    const list = getTags()
    if (list.length) list.pop()
  }
}
const onTagPaste = (e: ClipboardEvent) => {
  const text = e.clipboardData?.getData('text') || ''
  if (!text) return
  const parts = text.split(/[\n\t,]/).map(s => s.trim()).filter(Boolean)
  if (!parts.length) return
  e.preventDefault()
  const list = getTags()
  for (const p of parts) {
    if (!list.includes(p)) list.push(p)
  }
}
const removeTag = (idx: number) => {
  const list = getTags()
  if (idx >= 0 && idx < list.length) list.splice(idx, 1)
}

// Expose tags list for template without typing issues
const tagsList = computed(() => getTags())
</script>

<template>
  <UDashboardPanel id="add-product">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <div class="flex items-center gap-3">
            <UDashboardSidebarCollapse />
            <div>
              <div class="text-lg font-semibold">
                Thêm sản phẩm mới
              </div>
            </div>
          </div>
        </template>
        <template #right>
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">Công khai</span>
            <UButton label="Xem trước" variant="ghost" icon="i-lucide-external-link" />
            <UDropdownMenu :items="[]">
              <UButton icon="i-lucide-more-vertical" variant="ghost" />
            </UDropdownMenu>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full max-w-6xl mx-auto px-4 lg:px-6">
        <!-- Two-column layout -->
        <div class="flex flex-col lg:flex-row gap-6">
          <!-- Left column -->
          <div class="flex-1 space-y-6">
            <UPageCard title="Thông tin sản phẩm" variant="soft" class="bg-white rounded-lg">
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <form class="space-y-4" @submit.prevent="submitForm">
                  <!-- Product name -->

                  <div>
                    <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tên sản phẩm
                    </label>
                    <input
                      id="name"
                      v-model="formData.name"
                      type="text"
                      placeholder="Nhập tên sản phẩm"
                      :class="{ 'border-red-500': errors.name }"
                      class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                    <p v-if="errors.name" class="mt-1 text-sm text-red-600">
                      {{ errors.name }}
                    </p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Thương hiệu
                    </label>
                    <BaseDropdownSelect
                      v-model="trademark"
                      :options="(brands || []).map(b => ({ id: b.id, label: b.name }))"
                      :loading="brandsLoading"
                      placeholder="Chọn thương hiệu"
                      add-new-label="Thêm thương hiệu"
                      class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <div v-if="brandsError" class="text-xs text-red-500 mt-1">
                      Lỗi tải thương hiệu: {{ brandsError }}
                    </div>
                  </div>

                  <!-- Trademark -->
                  <!-- Xoá select thương hiệu tĩnh, chỉ giữ select động phía trên -->

                  <!-- Category (single select) -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Danh mục
                    </label>
                    <BaseDropdownSelect
                      v-model="formData.categoryIds"
                      :options="categoryOptions"
                      placeholder="Chọn danh mục"
                      add-new-label="Thêm danh mục"
                      multiple
                      class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <div v-if="selectedCategories && selectedCategories.length > 0" class="flex flex-wrap gap-1 mt-2">
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

                  <!-- Description (rich text) -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mô tả
                    </label>
                    <div class="rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden bg-white dark:bg-gray-800">
                      <TinyMCESelfHost
                        v-model="formData.content"
                        placeholder="Nhập mô tả sản phẩm"
                        :height="300"
                      />
                    </div>
                    <p v-if="errors.content" class="mt-1 text-sm text-red-600">
                      {{ errors.content }}
                    </p>
                  </div>

                  <!-- Additional sections link -->
                  <div>
                    <NuxtLink to="#" class="text-sm text-primary-600 hover:underline">Chỉnh sửa các phần bổ sung</NuxtLink>
                  </div>
                </form>
              </div>
            </UPageCard>

            <!-- Product Links -->
            <UPageCard title="Liên kết sản phẩm" variant="soft" class="bg-white rounded-lg">
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <div class="space-y-3">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Đường dẫn
                  </label>
                  <div class="flex flex-col gap-3">
                    <div class="flex items-center w-full rounded-md border border-gray-300 bg-gray-50 px-4" style="height:36px;">
                      <span class="text-gray-400 select-none mr-1">web.vnnsoft.com/</span>
                      <span class="text-gray-900 flex-1">{{ slug }}</span>
                      <button type="button" class="ml-2 text-gray-400 hover:text-gray-600">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M8 16h8M8 12h8m-8-4h8M4 6h16M4 18h16"
                          />
                        </svg>
                      </button>
                    </div>
                    <UButton
                      label="Rút gọn link"
                      icon="i-lucide-zap"
                      variant="soft"
                      class="w-fit mt-1"
                    />
                  </div>
                </div>
              </div>
            </UPageCard>

            <!-- Selling price -->
            <UPageCard title="Giá bán" variant="soft" class="bg-white rounded-lg">
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <!-- Top row: Price & Compare-at price -->
                <div class="flex flex-col md:flex-row gap-4">
                  <div class="flex-1">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Giá bán</label>
                    <div class="relative">
                      <input
                        id="price"
                        v-model.number="formData.price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        class="w-full px-3 h-[36px] text-base rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 pr-12"
                      >
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-base pointer-events-none">đ</span>
                    </div>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center justify-between">
                      <label class="block text-sm font-medium text-gray-700 mb-1">Giá so sánh</label>
                      <span class="ml-1" title="Giá so sánh là giá gốc trước khi giảm giá.">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-4 w-4 text-gray-400 inline"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z"
                          />
                        </svg>
                      </span>
                    </div>
                    <div class="relative">
                      <input
                        id="compareAtPrice"
                        v-model.number="formData.compareAtPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        class="w-full px-3 h-[36px] text-base rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 pr-12"
                      >
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-base pointer-events-none">đ</span>
                    </div>
                  </div>
                </div>
                <!-- Charge tax -->
                <div class="flex items-center mt-4">
                  <input
                    id="chargeTax"
                    v-model="formData.chargeTax"
                    type="checkbox"
                    class="mr-2"
                  >
                  <label for="chargeTax" class="text-base text-gray-900 select-none">Tính thuế cho sản phẩm này</label>
                </div>
                <!-- Divider -->
                <div class="my-4 border-t border-gray-200" />
                <!-- Bottom row: Cost, Profit, Margin -->
                <div class="flex flex-col md:flex-row gap-4">
                  <div class="flex-1">
                    <div class="flex items-center justify-between">
                      <label class="block text-sm font-medium text-gray-700 mb-1">Giá nhập</label>
                      <span class="ml-1" title="Giá nhập là giá bạn mua vào.">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-4 w-4 text-gray-400 inline"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z"
                          />
                        </svg>
                      </span>
                    </div>
                    <div class="relative">
                      <input
                        id="importPrice"
                        v-model.number="formData.importPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        class="w-full px-3 h-[36px] text-base rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 pr-12"
                      >
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-base pointer-events-none">đ</span>
                    </div>
                  </div>
                  <div class="flex-1">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Lợi nhuận</label>
                    <div class="relative">
                      <input
                        id="profit"
                        :value="profitDisplay"
                        readonly
                        class="w-full px-3 h-[36px] text-base rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 pr-12"
                      >
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-base pointer-events-none">đ</span>
                    </div>
                  </div>
                  <div class="flex-1">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tỉ suất lợi nhuận</label>
                    <div class="relative">
                      <input
                        id="margin"
                        :value="marginDisplay"
                        readonly
                        class="w-full px-3 h-[36px] text-base rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 pr-8"
                      >
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-base pointer-events-none">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </UPageCard>
              
            <!-- Photography and design (moved left) -->
            <UPageCard title="Hình ảnh & Thiết kế" variant="soft" class="bg-white rounded-lg">
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <div class="space-y-4">
                  <div>
                    <input
                      ref="fileInput"
                      type="file"
                      class="hidden"
                      accept="image/*,video/*,model/*"
                      multiple
                      :disabled="isUploadingImage"
                      @change="handleImageUpload"
                    >
                    <div v-if="!imagePreviews.length" class="border border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center min-h-[120px] bg-white">
                      <div class="flex items-center justify-center gap-2 mb-2">
                        <UButton label="Upload new" size="sm" @click="$refs.fileInput && ($refs.fileInput as HTMLInputElement).click()" />
                        <button type="button" class="ml-2 text-gray-700 hover:underline text-sm font-medium">
                          Select existing
                        </button>
                      </div>
                      <div class="text-gray-500 text-sm">
                        Accepts images, videos, or 3D models
                      </div>
                    </div>
                    <div v-else class="grid grid-cols-5 gap-3">
                      <template v-for="(img, idx) in imagePreviews" :key="idx">
                        <div
                          :class="[
                            'relative flex items-center justify-center border border-gray-300 rounded-xl bg-white overflow-hidden',
                            idx === 0 ? 'row-span-2 col-span-2 h-48 w-full' : 'h-24 w-full'
                          ]"
                        >
                          <img v-if="!isUploadingImage" :src="img" class="object-cover w-full h-full" />
                          <div v-else class="flex flex-col items-center justify-center w-full h-full">
                            <svg class="animate-spin h-8 w-8 text-gray-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                            </svg>
                            <span class="text-gray-500 text-sm mt-2">Uploading...</span>
                          </div>
                          <button
                            v-if="!isUploadingImage"
                            type="button"
                            class="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                            @click="removeImage(idx)"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </template>
                      <!-- Nút thêm ảnh -->
                      <div
                        class="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-white cursor-pointer h-24"
                        @click="$refs.fileInput && ($refs.fileInput as HTMLInputElement).click()"
                      >
                        <span class="text-2xl text-gray-400">+</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </UPageCard>

            <!-- Inventory and variants was moved to full-width below -->
          </div>

          <!-- Right column -->
          <div class="w-full lg:w-80 space-y-6">
            <!-- Settings -->
            <UPageCard title="Cài đặt" variant="soft" class="bg-white rounded-lg">
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Trạng thái
                    </label>
                    <select
                      v-model="status"
                      class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white pr-[34px]"
                    >
                      <option value="Public">
                        Công khai
                      </option>
                      <option value="Draft">
                        Nháp
                      </option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Giao diện trang sản phẩm
                    </label>
                    <select
                      v-model="pageTemplate"
                      class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white pr-[34px]"
                    >
                      <option value="Default product">
                        Sản phẩm mặc định
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </UPageCard>

            <!-- Publishing -->
            <UPageCard title="Kênh bán" variant="soft" class="bg-white rounded-lg">
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <div class="space-y-3">
                  <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Kênh bán
                  </div>
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <UAvatar size="xl" class="bg-gray-200 dark:bg-gray-700 text-gray-600" :alt="'Cửa hàng trực tuyến'">
                        <UIcon name="i-heroicons-building-storefront-20-solid" class="w-6 h-6" />
                      </UAvatar>
                      <div class="text-sm text-gray-800 dark:text-gray-200">
                        Cửa hàng trực tuyến
                        <span class="text-gray-500">đã bán</span>
                      </div>
                    </div>
                    <UButton
                      label="Quản lý"
                      variant="ghost"
                      icon="i-lucide-external-link"
                    />
                  </div>
                </div>
              </div>
            </UPageCard>

            <!-- Product organization -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <template #title>
                <div class="flex items-center gap-1">
                  Tổ chức sản phẩm
                  <span title="Thông tin về cách tổ chức sản phẩm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z"
                      />
                    </svg>
                  </span>
                </div>
              </template>
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Loại</label>
                    <input type="text" class="w-full px-3 h-[36px] text-base rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500" placeholder="">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nhà cung cấp</label>
                    <BaseDropdownSelect
                      v-model="selectedSupplier"
                      :options="(suppliers || []).map(s => ({ id: s.id, label: s.name }))"
                      :loading="suppliersLoading"
                      placeholder="Chọn nhà cung cấp"
                      add-new-label="Thêm nhà cung cấp"
                      class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Bộ sưu tập</label>
                    <BaseDropdownSelect
                      v-model="selectedCollections"
                      :options="(collections || []).map(c => ({ id: c.id, label: c.name }))"
                      :loading="collectionsLoading"
                      placeholder="Chọn bộ sưu tập"
                      multiple-display="labels"
                      selected-count-text="Đã chọn"
                      selected-count-suffix="giá trị"
                      :count-when-at-least="2"
                      add-new-label="Thêm bộ sưu tập"
                      multiple
                      class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <div class="w-full">
                      <input
                        v-model="tagInput"
                        type="text"
                        placeholder="Nhập tag rồi nhấn Enter hoặc dấu phẩy"
                        class="w-full px-3 h-[36px] text-base rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        @keydown="onTagKeydown"
                        @blur="commitTag"
                        @paste="onTagPaste"
                      >
                      <div v-if="tagsList.length" class="flex flex-wrap gap-2 mt-2">
                        <span
                          v-for="(tag, idx) in tagsList"
                          :key="`${tag}-${idx}`"
                          class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-normal bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                        >
                          {{ tag }}
                          <button
                            type="button"
                            class="inline-flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                            @click="removeTag(idx)"
                          >
                            ×
                          </button>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </UPageCard>
          </div>
        </div>

        <!-- Inventory and variants (full-width) -->
        <div class="mt-6">
          <UPageCard variant="soft" class="bg-white rounded-lg">
            <div class="flex items-center justify-between ">
              <div class="font-semibold text-base">
                Tồn kho & Biến thể
              </div>
              <UButton
                label="Chỉnh sửa biến thể"
                variant="solid"
                icon="i-lucide-edit-2"
                class="w-fit"
              />
            </div>
            <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
              <div class="space-y-4">
                <div class="grid grid-cols-3 text-sm text-gray-500">
                  <div class="col-span-1">
                    Biến thể
                  </div>
                  <div class="text-center">
                    Tồn kho
                  </div>
                  <div class="text-center">
                    Đã bán
                  </div>
                </div>
                <div class="grid grid-cols-3 items-center text-sm text-gray-800 dark:text-gray-200 border-t pt-3">
                  <div class="col-span-1">
                    {{ formData.name || 'Sản phẩm mới' }}
                  </div>
                  <div class="text-center text-primary-600">
                    <NuxtLink to="#">Unlimited</NuxtLink>
                  </div>
                  <div class="text-center">
                    0
                  </div>
                </div>
                <div class="space-y-2 pt-2">
                  <label class="flex items-center gap-2 text-sm">
                    <input v-model="markAsSoldOut" type="checkbox">
                    Đánh dấu hết hàng
                  </label>
                  <label class="flex items-center gap-2 text-sm">
                    <input v-model="uniqueSkuPerVariant" type="checkbox">
                    Mỗi biến thể có một mã SKU hoặc mã vạch riêng
                  </label>
                  <label class="flex items-center gap-2 text-sm">
                    <input v-model="membersOnly" type="checkbox">
                    Chỉ dành cho thành viên
                  </label>
                </div>
              </div>
            </div>
          </UPageCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
