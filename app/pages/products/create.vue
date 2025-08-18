<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { useBrandsService } from '@/composables/useBrandsService'
import { useSuppliersService } from '@/composables/useSuppliersService'
import { useCollectionsService } from '@/composables/useCollectionsService'
import { useProductForm } from '@/composables/useProductForm'
import type { ProductFormData as BaseProductFormData } from '@/composables/useProductForm'
import type { ProductCategory } from '@/composables/useProductsCategoriesService'
import CustomCheckbox from '@/components/CustomCheckbox.vue'

// Extend formData type locally to include supplierId, collectionIds and optional tags
type ExtendedProductFormData = BaseProductFormData & {
  supplierId: number | null
  collectionIds: number[]
  tags?: string[]
  // Inventory fields
  warehouseId?: number | null
  manageInventory?: boolean
  allowNegativeStock?: boolean
  manageByBatch?: boolean
  warehouseStocks?: Record<number, number>
  hasSkuOrBarcode?: boolean
  sku?: string
  barcode?: string
}

// Local helper types (avoid DOM Attr name clash)
// Note: Avoid complex TS types in SFC to prevent parser hiccups.

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
// const uniqueSkuPerVariant = ref<boolean>(false)
// const membersOnly = ref<boolean>(false)

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

// Inventory defaults
formData.value.warehouseId ??= 1
formData.value.manageInventory ??= false
formData.value.allowNegativeStock ??= false
formData.value.manageByBatch ??= false
formData.value.warehouseStocks ??= { 1: 0 }
formData.value.hasSkuOrBarcode ??= false
formData.value.sku ??= ''
formData.value.barcode ??= ''

// Warehouses list (can be replaced with a service later)
const warehouses = ref([
  { id: 101, name: 'Kho Nam Định' },
  { id: 102, name: 'Kho Ninh Bình' }
])
// Ensure stocks object has keys for all warehouses
for (const w of warehouses.value) {
  if (formData.value.warehouseStocks?.[w.id] === undefined) {
    formData.value.warehouseStocks = {
      ...(formData.value.warehouseStocks || {}),
      [w.id]: 0
    }
  }
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

// Tags input logic
const tagInput = ref<string>('')
if (!('tags' in formData.value)) {
  ; (formData.value as unknown as { tags: string[] }).tags = []
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

// Drag & drop reordering for image previews
const dragSrcIndex = ref<number | null>(null)

const onDragStart = (e: DragEvent, idx: number) => {
  if (isUploadingImage.value) {
    e.preventDefault()
    return
  }
  dragSrcIndex.value = idx
  try {
    e.dataTransfer?.setData('text/plain', String(idx))
    e.dataTransfer!.effectAllowed = 'move'
  } catch {
    // ignore for browsers that restrict setData in some contexts
  }
}

const onDragOver = (e: DragEvent) => {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
}

const onDrop = (e: DragEvent, idx: number) => {
  e.preventDefault()
  const srcRaw = dragSrcIndex.value ?? Number(e.dataTransfer?.getData('text/plain'))
  const srcIdx = Number(srcRaw)
  const toIdx = Number(idx)
  if (isNaN(srcIdx) || srcIdx === toIdx) {
    dragSrcIndex.value = null
    return
  }

  const previews = imagePreviews.value || []
  const urls = formData.value.imageUrls || []
  if (srcIdx < 0 || srcIdx >= previews.length || toIdx < 0 || toIdx > previews.length) {
    dragSrcIndex.value = null
    return
  }

  // Move preview (assert non-null because we've validated indices above)
  const p = previews.splice(srcIdx, 1)[0] as string
  previews.splice(toIdx, 0, p)

  // Move url in the same way
  const u = urls.splice(srcIdx, 1)[0] as string
  urls.splice(toIdx, 0, u)

  // Ensure reactivity by assigning new arrays
  imagePreviews.value = [...previews]
  formData.value.imageUrls = [...urls]

  dragSrcIndex.value = null
}

const onDragEnd = () => {
  dragSrcIndex.value = null
}

// ----- Attribute logic -----
// Keep typing minimal to avoid SFC parser hiccups
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const attributes = ref([] as any[])
const showAttributesEditor = ref(false)
const startAttributes = () => {
  showAttributesEditor.value = true
  if (!attributes.value.length) {
    attributes.value.push({ name: '', values: [], input: '' })
  }
}
const addAttribute = () => {
  attributes.value.push({ name: '', values: [], input: '' })
}
const removeAttribute = (idx: number) => {
  attributes.value.splice(idx, 1)
  if (attributes.value.length === 0) {
    showAttributesEditor.value = false
  }
}
const addAttrValue = (attrIdx: number) => {
  const attr = attributes.value[attrIdx]
  if (!attr) return
  const val = (attr.input || '').trim()
  if (val && !attr.values.includes(val)) {
    attr.values.push(val)
  }
  attr.input = ''
}
const removeAttrValue = (attrIdx: number, valIdx: number) => {
  const attr = attributes.value[attrIdx]
  if (!attr) return
  attr.values.splice(valIdx, 1)
}

// ----- Variants computed from attributes -----
const activeAttributes = computed(() => {
  const list = (attributes.value as unknown[]).map((raw) => {
    const a = raw as Record<string, unknown>
    const name = String((a && a.name) ?? '').trim()
    const values = Array.isArray(a && (a as { values?: unknown[] }).values)
      ? ((a as { values?: unknown[] }).values ?? []).filter(Boolean).map(v => String(v))
      : []
    return { name, values }
  })
  return list.filter(a => a.name && a.values.length > 0)
})

const variants = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attrs = activeAttributes.value as unknown as any[]
  if (!Array.isArray(attrs) || attrs.length === 0) return []
  // Build lists of values
  const lists = attrs.map((a) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vs = (a && (a as any).values) as unknown
    return Array.isArray(vs) ? vs : []
  }) as unknown as unknown[]
  // Cartesian product
  let product: string[][] = []
  for (const listAny of lists) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const list = (listAny as any[]).map(v => String(v))
    if (product.length === 0) {
      product = list.map(v => [v])
    } else {
      const next: string[][] = []
      for (const combo of product) {
        for (const v of list) next.push([...combo, String(v)])
      }
      product = next
    }
  }
  // Map to rows
  return product.map((vals) => {
    const options: Record<string, string> = {}
    for (let i = 0; i < attrs.length; i += 1) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const a = attrs[i] as any
      const name = String((a && a.name) || '')
      if (name) options[name] = String(vals[i] || '')
    }
    return {
      key: vals.join(' / '),
      name: vals.join(' / '),
      options,
      price: Number(formData.value.price) || 0,
      stock: 0
    }
  })
})

const totalVariantStock = computed(() => {
  const list = variants.value as unknown as Array<{ stock?: number }>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (Array.isArray(list) ? list : []).reduce((sum, v) => sum + (Number((v as any)?.stock) || 0), 0)
})
</script>

<template>
  <!-- eslint-disable vue/max-attributes-per-line, vue/html-closing-bracket-newline, vue/singleline-html-element-content-newline, vue/html-indent, vue/first-attribute-linebreak -->
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
            <span
              class="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">Công
              khai</span>
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
                    <input id="name" v-model="formData.name" type="text" placeholder="Nhập tên sản phẩm"
                      :class="{ 'border-red-500': errors.name }"
                      class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <p v-if="errors.name" class="mt-1 text-sm text-red-600">
                      {{ errors.name }}
                    </p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Thương hiệu
                    </label>
                    <BaseDropdownSelect v-model="trademark"
                      :options="(brands || []).map(b => ({ id: b.id, label: b.name }))" :loading="brandsLoading"
                      placeholder="Chọn thương hiệu" add-new-label="Thêm thương hiệu"
                      class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500" />
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
                    <BaseDropdownSelect v-model="formData.categoryIds" :options="categoryOptions"
                      placeholder="Chọn danh mục" add-new-label="Thêm danh mục" multiple
                      class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    <div v-if="selectedCategories && selectedCategories.length > 0" class="flex flex-wrap gap-1 mt-2">
                      <span v-for="category in selectedCategories" :key="category.id"
                        class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                        {{ category.name }}
                        <button type="button"
                          class="ml-1 inline-flex items-center justify-center w-3 h-3 rounded-full text-primary-600 hover:bg-primary-200 hover:text-primary-800 focus:outline-none"
                          @click="removeCategory(category.id)">
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
                    <div
                      class="rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden bg-white dark:bg-gray-800">
                      <TinyMCESelfHost v-model="formData.content" placeholder="Nhập mô tả sản phẩm" :height="300" />
                    </div>
                    <p v-if="errors.content" class="mt-1 text-sm text-red-600">
                      {{ errors.content }}
                    </p>
                  </div>

                  <!-- Additional sections link -->
                  <div>
                    <NuxtLink to="#" class="text-sm text-primary-600 hover:underline">Chỉnh sửa các phần bổ sung
                    </NuxtLink>
                  </div>
                </form>
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
                      <input id="price" v-model.number="formData.price" type="number" min="0" step="0.01"
                        placeholder="0.00"
                        class="w-full px-3 h-[36px] text-base rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 pr-12">
                      <span
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-base pointer-events-none">đ</span>
                    </div>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center justify-between">
                      <label class="block text-sm font-medium text-gray-700 mb-1">Giá so sánh</label>
                      <span class="ml-1" title="Giá so sánh là giá gốc trước khi giảm giá.">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 inline" fill="none"
                          viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                        </svg>
                      </span>
                    </div>
                    <div class="relative">
                      <input id="compareAtPrice" v-model.number="formData.compareAtPrice" type="number" min="0"
                        step="0.01" placeholder="0.00"
                        class="w-full px-3 h-[36px] text-base rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 pr-12">
                      <span
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-base pointer-events-none">đ</span>
                    </div>
                  </div>
                </div>
                <!-- Charge tax -->
                <div class="flex items-center mt-4">
                  <CustomCheckbox class="mr-2" :model-value="!!formData.chargeTax"
                    @update:model-value="formData.chargeTax = $event">
                    <span class="text-base text-gray-900 select-none">Tính thuế cho sản phẩm này</span>
                  </CustomCheckbox>
                </div>
                <!-- Divider -->
                <div class="my-4 border-t border-gray-200" />
                <!-- Bottom row: Cost, Profit, Margin -->
                <div class="flex flex-col md:flex-row gap-4">
                  <div class="flex-1">
                    <div class="flex items-center justify-between">
                      <label class="block text-sm font-medium text-gray-700 mb-1">Giá nhập</label>
                      <span class="ml-1" title="Giá nhập là giá bạn mua vào.">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 inline" fill="none"
                          viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                        </svg>
                      </span>
                    </div>
                    <div class="relative">
                      <input id="importPrice" v-model.number="formData.importPrice" type="number" min="0" step="0.01"
                        placeholder="0.00"
                        class="w-full px-3 h-[36px] text-base rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 pr-12">
                      <span
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-base pointer-events-none">đ</span>
                    </div>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center justify-between">
                      <label class="block text-sm font-medium text-gray-700 mb-1">Lợi nhuận</label>
                      <div class="flex items-center gap-1">
                        <span class="text-gray-500 text-xs" title="Lợi nhuận = Giá bán - Giá nhập">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 inline" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                          </svg>
                        </span>
                      </div>
                    </div>
                    <div class="relative">
                      <input id="profit" :value="profitDisplay" readonly
                        class="w-full px-3 h-[36px] text-base rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 pr-12">
                      <span
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-base pointer-events-none">đ</span>
                    </div>
                  </div>
                  <div class="flex-1">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tỉ suất lợi nhuận</label>
                    <div class="relative">
                      <input id="margin" :value="marginDisplay" readonly
                        class="w-full px-3 h-[36px] text-base rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 pr-8">
                      <span
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-base pointer-events-none">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </UPageCard>

            <UPageCard title="Tồn kho" variant="soft" class="bg-white rounded-lg">
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <div class="space-y-4">
                  <!-- Track quantity -->
                  <div class="pt-1">
                    <CustomCheckbox :model-value="!!formData.manageInventory"
                      @update:model-value="formData.manageInventory = $event">
                      <span class="text-gray-900">Quản lý số lượng tồn kho</span>
                    </CustomCheckbox>
                  </div>

                  <!-- Quantity per location -->
                  <div class="pt-1">
                    <div class="flex items-center justify-between mb-2">
                      <div class="text-sm text-gray-700 dark:text-gray-300 font-medium">
                        Số lượng theo kho
                      </div>
                      <NuxtLink to="#" class="text-sm text-primary-600 hover:underline">
                        Chỉnh sửa kho
                      </NuxtLink>
                    </div>
                    <div class="border-t border-gray-200 pb-[5px]" />
                    <div v-for="w in warehouses" :key="w.id" class="grid grid-cols-2 gap-2 py-1">
                      <div class="text-gray-800 flex items-center h-9">
                        {{ w.name }}
                      </div>
                      <div class="text-right flex items-center justify-end h-9">
                        <template v-if="formData.manageInventory">
                          <input :value="(formData.warehouseStocks && formData.warehouseStocks[w.id]) ?? 0"
                            type="number" min="0"
                            class="w-24 px-3 h-9 text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 text-right appearance-none no-spinner"
                            :placeholder="'Nhập số lượng'" @input="(e: Event) => {
                              const v = Number((e.target as HTMLInputElement).value || 0)
                              const id = w.id
                              const next = { ...(formData.warehouseStocks || {}) }
                              next[id] = v
                              formData.warehouseStocks = next
                            }">
                        </template>
                        <template v-else>
                          <span class="text-sm text-gray-500 inline-flex items-center h-9">Không theo dõi</span>
                        </template>
                      </div>
                    </div>
                  </div>

                  <!-- Continue selling when out of stock -->
                  <div>
                    <CustomCheckbox class="items-start" :model-value="!!formData.allowNegativeStock"
                      @update:model-value="formData.allowNegativeStock = $event">
                      <span class="text-gray-900">
                        Cho phép bán khi hết hàng
                        <div v-if="formData.allowNegativeStock" class="text-gray-500 text-xs">
                          Nhân viên vẫn có thể bán khi tồn kho bằng 0 hoặc âm. (Không ảnh hưởng đến POS)
                        </div>
                      </span>
                    </CustomCheckbox>
                  </div>

                  <!-- SKU / Barcode toggle and fields -->
                  <div class="space-y-2">
                    <CustomCheckbox :model-value="!!formData.hasSkuOrBarcode"
                      @update:model-value="formData.hasSkuOrBarcode = $event">
                      <span class="text-gray-900">Sản phẩm có mã SKU hoặc mã vạch</span>
                    </CustomCheckbox>
                    <div v-if="formData.hasSkuOrBarcode" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Mã SKU (Stock Keeping Unit)</label>
                        <input v-model="formData.sku" type="text"
                          class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                          placeholder="Nhập mã SKU">
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Mã vạch (ISBN, UPC, GTIN,
                          ...)</label>
                        <input v-model="formData.barcode" type="text"
                          class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                          placeholder="Nhập mã vạch">
                      </div>
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
                    <input ref="fileInput" type="file" class="hidden" accept="image/*,video/*,model/*" multiple
                      :disabled="isUploadingImage" @change="handleImageUpload">
                    <div v-if="!imagePreviews.length"
                      class="border border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center min-h-[120px] bg-white">
                      <div class="flex items-center justify-center gap-2 mb-2">
                        <UButton label="Upload new" size="sm"
                          @click="$refs.fileInput && ($refs.fileInput as HTMLInputElement).click()" />
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
                        <div :class="[
                          'relative flex items-center justify-center border border-gray-300 rounded-md bg-white overflow-hidden',
                          idx === 0 ? 'row-span-2 col-span-2 h-52 w-full' : 'h-24 w-full'
                        ]" draggable="true" @dragstart="(e) => onDragStart(e, idx)" @dragover.prevent="onDragOver"
                          @drop="(e) => onDrop(e, idx)" @dragend="onDragEnd">
                          <img v-if="!isUploadingImage" :src="img" class="object-cover w-full h-full">
                          <!-- Overlay 'Ảnh đại diện' cho ảnh đầu tiên -->
                          <div v-if="!isUploadingImage && idx === 0"
                            class="absolute bottom-0 left-0 w-full bg-black bg-opacity-60 text-white text-base font-semibold text-center py-1 select-none rounded-b-md">
                            Ảnh đại diện
                          </div>
                          <div v-else-if="isUploadingImage"
                            class="flex flex-col items-center justify-center w-full h-full">
                            <svg class="animate-spin h-8 w-8 text-gray-400 mx-auto" xmlns="http://www.w3.org/2000/svg"
                              fill="none" viewBox="0 0 24 24">
                              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                stroke-width="4" />
                              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            <span class="text-gray-500 text-sm mt-2">Uploading...</span>
                          </div>
                          <button v-if="!isUploadingImage" type="button"
                            class="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                            @click="removeImage(idx)">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" fill="none"
                              viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </template>
                      <!-- Nút thêm ảnh -->
                      <div
                        class="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-white cursor-pointer h-24"
                        @click="$refs.fileInput && ($refs.fileInput as HTMLInputElement).click()"
                        @dragover.prevent="onDragOver" @drop="(e) => onDrop(e, imagePreviews.length)">
                        <span class="text-2xl text-gray-400">+</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </UPageCard>

            <!-- Inventory and variants was moved to full-width below -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <div class="flex items-center justify-between">
                <div class="font-semibold text-base">
                  Thuộc tính
                </div>
                <button v-if="!showAttributesEditor" type="button" class="text-primary-600 hover:underline"
                  @click="startAttributes">
                  Thêm thuộc tính
                </button>
              </div>
              <div v-if="!showAttributesEditor"
                class="-mx-6 px-6 pt-2 pb-4 border-t-1 border-gray-200 dark:border-gray-700 flex flex-col justify-center min-h-[64px]">
                <p class="text-gray-600 w-full">
                  Sản phẩm có nhiều thuộc tính khác nhau. Ví dụ: kích thước, màu sắc.
                </p>
              </div>
              <div v-else class="-mx-6 px-6 pt-2 pb-4 border-t-1 border-gray-200 dark:border-gray-700">
                <div class="grid grid-cols-2 gap-4 items-center mb-2">
                  <div class="font-medium text-gray-700">
                    Tên thuộc tính
                  </div>
                  <div class="font-medium text-gray-700">
                    Giá trị
                  </div>
                </div>
                <div v-for="(attr, idx) in attributes" :key="idx" class="grid grid-cols-2 gap-4 items-center mb-2">
                  <input v-model="attr.name" type="text"
                    class="w-full px-3 h-10 text-base rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                    placeholder="Tên thuộc tính">
                  <div class="flex items-center gap-2">
                    <div class="flex flex-wrap gap-1 flex-1">
                      <span v-for="(val, vIdx) in attr.values" :key="vIdx"
                        class="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-sm">
                        {{ val }}
                        <button type="button" class="ml-1 text-blue-400 hover:text-blue-700"
                          @click="removeAttrValue(idx, vIdx)">×</button>
                      </span>
                      <input v-model="attr.input" type="text"
                        class="border-none outline-none flex-1 min-w-[80px] bg-transparent text-gray-700"
                        placeholder="Nhập ký tự và ấn enter" @keydown.enter.prevent="addAttrValue(idx)">
                    </div>
                    <button type="button" class="text-gray-400 hover:text-red-500" @click="removeAttribute(idx)">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <button type="button" class="flex items-center text-primary-600 hover:underline mt-2"
                  @click="addAttribute">
                  <span class="text-xl mr-1">+</span> Thêm thuộc tính khác
                </button>
              </div>
            </UPageCard>

            <!-- Variants generated from attributes (moved below Attributes section) -->
            <UPageCard v-if="variants && variants.length" title="Phiên bản" variant="soft" class="bg-white rounded-lg">
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <!-- Warehouse select -->
                <div class="mb-3">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Kho hàng</label>
                  <select class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900">
                    <option>Cửa hàng chính</option>
                  </select>
                </div>

                <!-- Filters by attribute names -->
                <div class="flex flex-wrap items-center gap-3 mb-3">
                  <span class="text-sm text-gray-700">Bộ lọc:</span>
                  <template v-for="(a, i) in activeAttributes" :key="i">
                    <button type="button"
                      class="inline-flex items-center gap-1 text-sm text-primary-600 bg-primary-50 px-2 py-1 rounded-md hover:underline">
                      {{ a.name }}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        class="h-4 w-4">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                  </template>
                </div>

                <!-- Header row with bulk check and count -->
                <div class="flex items-center gap-2 py-2 border-y border-gray-200">
                  <input type="checkbox">
                  <span class="font-medium">{{ variants.length }} phiên bản</span>
                </div>

                <!-- Variants list -->
                <div>
                  <div v-for="(v, vi) in variants" :key="v.key || vi"
                    class="flex items-center justify-between py-4 border-b border-gray-100">
                    <div class="flex items-center gap-3">
                      <input type="checkbox">
                      <div class="text-gray-900">{{ v.name }}</div>
                    </div>
                    <div class="text-right">
                      <div class="text-gray-900">Giá bán: {{ (v.price || 0).toLocaleString('vi-VN') }}đ</div>
                      <div class="text-gray-500 text-sm">Có thể bán {{ v.stock || 0 }} tại 1 kho</div>
                    </div>
                  </div>
                </div>

                <!-- Footer summary -->
                <div class="flex items-center justify-between py-3">
                  <div class="text-gray-700">Tổng tồn kho</div>
                  <div class="text-gray-900 font-medium">Có thể bán: {{ totalVariantStock }}</div>
                </div>
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
                    <div class="flex items-center w-full rounded-md border border-gray-300 bg-gray-50 px-4"
                      style="height:36px;">
                      <span class="text-gray-400 select-none mr-1">web.vnnsoft.com/</span>
                      <span class="text-gray-900 flex-1">{{ slug }}</span>
                      <button type="button" class="ml-2 text-gray-400 hover:text-gray-600">
                        <UIcon name="i-lucide-link-2" class="h-5 w-5" />
                      </button>
                    </div>
                    <UButton label="Rút gọn link" icon="i-lucide-zap" variant="soft" class="w-fit mt-1" />
                  </div>
                </div>
              </div>
            </UPageCard>
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
                    <select v-model="status"
                      class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white pr-[34px]">
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
                    <select v-model="pageTemplate"
                      class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white pr-[34px]">
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
                      <UAvatar size="xl" class="bg-gray-200 dark:bg-gray-700 text-gray-600"
                        :alt="'Cửa hàng trực tuyến'">
                        <UIcon name="i-heroicons-building-storefront-20-solid" class="w-6 h-6" />
                      </UAvatar>
                      <div class="text-sm text-gray-800 dark:text-gray-200">
                        Cửa hàng trực tuyến
                        <span class="text-gray-500">đã bán</span>
                      </div>
                    </div>
                    <UButton label="Quản lý" variant="ghost" icon="i-lucide-external-link" />
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
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                    </svg>
                  </span>
                </div>
              </template>
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Loại</label>
                    <input type="text"
                      class="w-full px-3 h-[36px] text-base rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                      placeholder="">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nhà cung cấp</label>
                    <BaseDropdownSelect v-model="selectedSupplier"
                      :options="(suppliers || []).map(s => ({ id: s.id, label: s.name }))" :loading="suppliersLoading"
                      placeholder="Chọn nhà cung cấp" add-new-label="Thêm nhà cung cấp"
                      class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Bộ sưu tập</label>
                    <BaseDropdownSelect v-model="selectedCollections"
                      :options="(collections || []).map(c => ({ id: c.id, label: c.name }))"
                      :loading="collectionsLoading" placeholder="Chọn bộ sưu tập" multiple-display="labels"
                      selected-count-text="Đã chọn" selected-count-suffix="giá trị" :count-when-at-least="2"
                      add-new-label="Thêm bộ sưu tập" multiple
                      class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <div class="w-full">
                      <input v-model="tagInput" type="text" placeholder="Nhập tag rồi nhấn Enter hoặc dấu phẩy"
                        class="w-full px-3 h-[36px] text-base rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        @keydown="onTagKeydown" @blur="commitTag" @paste="onTagPaste">
                      <div v-if="tagsList.length" class="flex flex-wrap gap-2 mt-2">
                        <span v-for="(tag, idx) in tagsList" :key="`${tag}-${idx}`"
                          class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-normal bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                          {{ tag }}
                          <button type="button"
                            class="inline-flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                            @click="removeTag(idx)">
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

      </div>
    </template>
  </UDashboardPanel>
</template>
