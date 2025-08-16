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
</script>

<template>
  <UDashboardPanel id="add-product">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <div class="flex items-center gap-3">
            <NuxtLink to="/products" class="inline-flex items-center text-gray-600 hover:text-gray-800">
              <svg
                class="w-5 h-5 mr-2"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 19l-7-7 7-7"
                />
              </svg>
            </NuxtLink>
            <UDashboardSidebarCollapse />
            <div>
              <div class="text-lg font-semibold">
                New product
              </div>
            </div>
          </div>
        </template>
        <template #right>
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">Public</span>
            <UButton label="Preview" variant="ghost" icon="i-lucide-external-link" />
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
            <UPageCard title="Product details" variant="soft" class="overflow-hidden bg-white rounded-lg">
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <form class="space-y-4" @submit.prevent="submitForm">
                  <!-- Product name -->
                  <div>
                    <label
                      for="name"
                      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Product name
                    </label>
                    <input
                      id="name"
                      v-model="formData.name"
                      type="text"
                      placeholder="New product"
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
                      Trademark
                    </label>
                    <select
                      v-model="trademark"
                      class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="" disabled>
                        Trademark
                      </option>
                      <option value="brand-a">
                        Brand A
                      </option>
                      <option value="brand-b">
                        Brand B
                      </option>
                    </select>
                  </div>

                  <!-- Category (single select) -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      v-model="selectedCategoryId"
                      class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="">
                        Category
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
                      Description
                    </label>
                    <div class="rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden bg-white dark:bg-gray-800">
                      <TinyMCESelfHost
                        v-model="formData.content"
                        placeholder="Description"
                        :height="300"
                      />
                    </div>
                    <p v-if="errors.content" class="mt-1 text-sm text-red-600">
                      {{ errors.content }}
                    </p>
                  </div>

                  <!-- Additional sections link -->
                  <div>
                    <NuxtLink to="#" class="text-sm text-primary-600 hover:underline">Edit additional sections</NuxtLink>
                  </div>
                </form>
              </div>
            </UPageCard>

            <!-- Product Links -->
            <UPageCard title="Product Links" variant="soft" class="overflow-hidden bg-white rounded-lg">
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <div class="space-y-3">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL
                  </label>
                  <div class="flex gap-2 items-center">
                    <div class="flex-1 flex items-center gap-1">
                      <span class="text-sm text-gray-500 select-none">
                        test.mehub.space/
                      </span>
                      <input
                        :value="slug"
                        readonly
                        class="flex-1 px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                    </div>
                    <UButton
                      label="Shorten URL"
                      variant="soft"
                    />
                  </div>
                </div>
              </div>
            </UPageCard>

            <!-- Selling price -->
            <UPageCard title="Selling price" variant="soft" class="overflow-hidden bg-white rounded-lg">
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <div class="space-y-3">
                  <div class="flex items-start gap-4">
                    <div class="w-64">
                      <label
                        for="price"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        $
                      </label>
                      <input
                        id="price"
                        v-model.number="formData.price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500"
                      >
                    </div>
                    <div class="text-xs text-gray-600 dark:text-gray-400 pt-2">
                      Estimated you'll make $0.00 per sale!
                      <a href="#" class="text-primary-600 hover:underline">Learn more</a>
                    </div>
                  </div>
                  <label class="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input v-model="addCompareAtPrice" type="checkbox">
                    Add compare-at price
                  </label>
                </div>
              </div>
            </UPageCard>
              
            <!-- Photography and design (moved left) -->
            <UPageCard title="Photography and design" variant="soft" class="overflow-hidden bg-white rounded-lg">
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
                      <UButton label="Upload" />
                      <div class="text-sm text-gray-500">
                        or drop here
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

            <!-- Inventory and variants (moved left) -->
            <UPageCard title="Inventory and variants" variant="soft" class="overflow-hidden bg-white rounded-lg">
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <div class="space-y-4">
                  <div class="grid grid-cols-3 text-sm text-gray-500">
                    <div class="col-span-1">
                      Variant
                    </div>
                    <div class="text-center">
                      In stock
                    </div>
                    <div class="text-center">
                      Sold
                    </div>
                  </div>
                  <div class="grid grid-cols-3 items-center text-sm text-gray-800 dark:text-gray-200 border-t pt-3">
                    <div class="col-span-1">
                      {{ formData.name || 'New product' }}
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
                      Mark as sold out
                    </label>
                    <label class="flex items-center gap-2 text-sm">
                      <input v-model="uniqueSkuPerVariant" type="checkbox">
                      Each variant has a unique SKU or UPC code
                    </label>
                    <label class="flex items-center gap-2 text-sm">
                      <input v-model="membersOnly" type="checkbox">
                      Make this a members-only product
                    </label>
                  </div>
                </div>
              </div>
            </UPageCard>
          </div>

          <!-- Right column -->
          <div class="w-full lg:w-80 space-y-6">
            <!-- Settings -->
            <UPageCard title="Settings" variant="soft" class="overflow-hidden bg-white rounded-lg">
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      v-model="status"
                      class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="Public">
                        Public
                      </option>
                      <option value="Draft">
                        Draft
                      </option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Product page template
                    </label>
                    <select
                      v-model="pageTemplate"
                      class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="Default product">
                        Default product
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </UPageCard>

            <!-- Publishing -->
            <UPageCard title="Publishing" variant="soft" class="overflow-hidden bg-white rounded-lg">
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <div class="space-y-3">
                  <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sale Channel
                  </div>
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600">
                        🏬
                      </div>
                      <div class="text-sm text-gray-800 dark:text-gray-200">
                        Online Store
                        <span class="text-gray-500">sold</span>
                      </div>
                    </div>
                    <UButton
                      label="Manage"
                      variant="ghost"
                      icon="i-lucide-external-link"
                    />
                  </div>
                </div>
              </div>
            </UPageCard>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
