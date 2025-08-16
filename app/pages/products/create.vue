<script setup lang="ts">
import { ref, computed, watch } from 'vue'

definePageMeta({
  layout: 'default'
})

useHead({
  title: 'New product - Cơ Khí Tam Long'
})

const {
  formData,
  errors,
  categories,
  isUploadingImage,
  imagePreviews,
  handleImageUpload,
  removeImage,
  submitForm
} = useProductForm()

// Local UI-only state to match the screenshot
const trademark = ref<string>('')
const status = ref<'Public' | 'Draft'>('Public')
const pageTemplate = ref<string>('Default product')

const addCompareAtPrice = ref<boolean>(false)

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

// Simple helper to set single category id (instead of old multi-select)
const selectedCategoryId = computed({
  get: () => formData.value.categoryIds[0] || '',
  set: (val: string | number) => {
    const n = typeof val === 'string' ? Number(val) : val
    formData.value.categoryIds = Number.isFinite(n) && n > 0 ? [n] : []
  }
})

// Keep formData.isInStock in sync with "Mark as sold out"
watch(markAsSoldOut, (v) => {
  formData.value.isInStock = !v
})

// Ensure price-related fields exist on formData
if (!('compareAtPrice' in formData.value)) {
  formData.value.compareAtPrice = 0
}
if (!('importPrice' in formData.value)) {
  formData.value.importPrice = 0
}
if (!('chargeTax' in formData.value)) {
  formData.value.chargeTax = false
}

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
            <UPageCard title="Thông tin sản phẩm" variant="soft" class="overflow-hidden bg-white rounded-lg">
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <form class="space-y-4" @submit.prevent="submitForm">
                  <!-- Product name -->
                  <div>
                    <label
                      for="name"
                      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
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

                  <!-- Trademark -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Thương hiệu
                    </label>
                    <select
                      v-model="trademark"
                      class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white pr-[34px]"
                      style="appearance: none; background-image: url('data:image/svg+xml;utf8,<svg fill=\'none\' stroke=\'%236B7280\' stroke-width=\'2\' viewBox=\'0 0 24 24\' xmlns=\'http://www.w3.org/2000/svg\'><path stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'M19 9l-7 7-7-7\'/></svg>'); background-repeat: no-repeat; background-position: right 10px center; background-size: 18px 18px;"
                    >
                      <option value="" disabled>
                        Chọn thương hiệu
                      </option>
                      <option value="brand-a">
                        Thương hiệu A
                      </option>
                      <option value="brand-b">
                        Thương hiệu B
                      </option>
                    </select>
                  </div>

                  <!-- Category (single select) -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Danh mục
                    </label>
                    <select
                      v-model="selectedCategoryId"
                      class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white pr-[34px]"
                      style="appearance: none; background-image: url('data:image/svg+xml;utf8,<svg fill=\'none\' stroke=\'%236B7280\' stroke-width=\'2\' viewBox=\'0 0 24 24\' xmlns=\'http://www.w3.org/2000/svg\'><path stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'M19 9l-7 7-7-7\'/></svg>'); background-repeat: no-repeat; background-position: right 10px center; background-size: 18px 18px;"
                    >
                      <option value="">
                        Chọn danh mục
                      </option>
                      <option
                        v-for="c in categories"
                        :key="c.id"
                        :value="c.id"
                      >
                        {{ c.name }}
                      </option>
                    </select>
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
            <UPageCard title="Liên kết sản phẩm" variant="soft" class="overflow-hidden bg-white rounded-lg">
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
            <UPageCard title="Giá bán" variant="soft" class="overflow-hidden bg-white rounded-lg">
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
            <UPageCard title="Hình ảnh & Thiết kế" variant="soft" class="overflow-hidden bg-white rounded-lg">
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <div class="space-y-4">
                  <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-white dark:bg-gray-800 text-center">
                    <input
                      ref="fileInput"
                      type="file"
                      class="hidden"
                      accept="image/*"
                      multiple
                      :disabled="isUploadingImage"
                      @change="handleImageUpload"
                    >
                    <div class="flex flex-col items-center gap-2">
                      <UButton label="Tải lên" />
                      <div class="text-sm text-gray-500">
                        hoặc kéo thả tại đây
                      </div>
                    </div>
                  </div>
                  <div v-if="imagePreviews.length" class="flex flex-wrap gap-2">
                    <div v-for="(img, idx) in imagePreviews" :key="idx" class="relative group">
                      <img :src="img" class="w-24 h-24 object-cover rounded border">
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
                </div>
              </div>
            </UPageCard>

            <!-- Inventory and variants was moved to full-width below -->
          </div>

          <!-- Right column -->
          <div class="w-full lg:w-80 space-y-6">
            <!-- Settings -->
            <UPageCard title="Cài đặt" variant="soft" class="overflow-hidden bg-white rounded-lg">
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Trạng thái
                    </label>
                    <select
                      v-model="status"
                      class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white pr-[34px]"
                      style="appearance: none; background-image: url('data:image/svg+xml;utf8,<svg fill=\'none\' stroke=\'%236B7280\' stroke-width=\'2\' viewBox=\'0 0 24 24\' xmlns=\'http://www.w3.org/2000/svg\'><path stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'M19 9l-7 7-7-7\'/></svg>'); background-repeat: no-repeat; background-position: right 10px center; background-size: 18px 18px;"
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
                      style="appearance: none; background-image: url('data:image/svg+xml;utf8,<svg fill=\'none\' stroke=\'%236B7280\' stroke-width=\'2\' viewBox=\'0 0 24 24\' xmlns=\'http://www.w3.org/2000/svg\'><path stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'M19 9l-7 7-7-7\'/></svg>'); background-repeat: no-repeat; background-position: right 10px center; background-size: 18px 18px;"
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
            <UPageCard title="Kênh bán" variant="soft" class="overflow-hidden bg-white rounded-lg">
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
            <UPageCard variant="soft" class="overflow-hidden bg-white rounded-lg">
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
                    <input type="text" class="w-full px-3 h-[36px] text-base rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500" placeholder="">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Bộ sưu tập</label>
                    <div class="relative">
                      <input type="text" class="w-full px-3 h-[36px] text-base rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 pl-10" placeholder="">
                      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
                        </svg>
                      </span>
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <input type="text" class="w-full px-3 h-[36px] text-base rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500" placeholder="">
                  </div>
                </div>
              </div>
            </UPageCard>
          </div>
        </div>

        <!-- Inventory and variants (full-width) -->
        <div class="mt-6">
          <UPageCard variant="soft" class="overflow-hidden bg-white rounded-lg">
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
