
<script setup lang="ts">
import { reactive, ref, computed, nextTick, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCreateProductPage } from '@/composables/useCreateProductPage'
import { productService } from '@/services/product.service'
import { useApiConfig } from '@/composables/useApiConfig'
// Explicit imports for local components (auto-import may not scan app/components path)
import CustomCheckbox from '@/components/CustomCheckbox.vue'
import BaseDropdownSelect from '@/components/BaseDropdownSelect.vue'
import TinyMCESelfHost from '@/components/TinyMCESelfHost.vue'

interface Props { productId?: number | null }
const props = defineProps<Props>()

const isEdit = computed(() => !!props.productId)

// Reuse existing page composable (create/update share same state)
const page = reactive(useCreateProductPage())

// Extra refs for inline variant editing
const priceInputs = ref<HTMLInputElement[]>([])
const stockInputs = ref<HTMLInputElement[]>([])

// Loading + error for edit mode
const isLoading = ref(false)
const fetchError = ref('')
const { imageBaseUrl } = useApiConfig()
const router = useRouter()
const route = useRoute()

// Show banner when redirected after creating a product
const showCreatedBanner = ref(false)

/* eslint-disable @typescript-eslint/no-explicit-any */
type ProductDetail = any
/* eslint-enable @typescript-eslint/no-explicit-any */

const loadDetail = async () => {
  if (!isEdit.value || !props.productId) return
  try {
    isLoading.value = true
    fetchError.value = ''
    const res = await productService.getProductById(props.productId)
    const data: ProductDetail = res?.data as ProductDetail
    if (data) {
      page.state.formData.id = data.id || props.productId
      page.state.trademark = data.brandId || null
      page.state.selectedSupplier = data.supplierId || null
      page.state.formData.name = data.name || ''
      page.state.formData.price = data.price ?? 0
      page.state.formData.compareAtPrice = data.oldPrice ?? 0
      page.state.formData.importPrice = data.costPrice ?? 0
      page.state.formData.chargeTax = false
      page.state.formData.description = data.shortDescription || ''
      page.state.formData.content = data.description || ''
      page.state.formData.sku = data.sku || ''
      page.state.formData.categoryIds = Array.isArray(data.categoryIds) ? data.categoryIds : []
      page.state.selectedCollections = Array.isArray(data.collectionIds) ? data.collectionIds : []
      page.state.formData.isFeatured = !!data.isFeatured
      page.state.formData.isInStock = !!data.isPublished
      page.state.formData.manageInventory = !!data.stockTrackingIsEnabled
      page.state.formData.allowNegativeStock = !!data.allowOutOfStock
      // Set warehouseStocks from inventory if present
      if (Array.isArray(data.inventory)) {
        const stocks: Record<number, number> = {}
        for (const inv of data.inventory) {
          if (inv && typeof inv.warehouseId === 'number') {
            stocks[inv.warehouseId] = Number(inv.quantity) || 0
          }
        }
        page.state.formData.warehouseStocks = stocks
      }
      interface ProductImage { mediaUrl?: string | null }
      const imgs = Array.isArray(data.productImages)
        ? (data.productImages as ProductImage[])
            .map(p => p.mediaUrl)
            .filter((u): u is string => !!u)
        : []
      page.state.productForm.formData.imageUrls = [...imgs]
      page.media.imagePreviews.splice(0, page.media.imagePreviews.length, ...imgs.map((f: string) => `${imageBaseUrl}/image/${f}`))
      const opts = Array.isArray(data.options) ? data.options : []
      page.variants.attributes.splice(0, page.variants.attributes.length)
      for (const o of opts) {
        const values = Array.isArray(o.values)
          ? (o.values as Array<{ key: string }>).map(v => v.key)
          : []
        page.variants.attributes.push({ name: o.name, values, input: '' })
      }
      if (opts.length) page.variants.showAttributesEditor = true
      await nextTick()
      if (Array.isArray(data.variations)) {
        type VariationInventory = { warehouseId: number, quantity: number }
        type VariationItem = {
          id?: number | null
          name: string
          price?: number
          inventory?: VariationInventory[]
        }
        const vdata = page.variants.variantData as unknown as Record<string, { prices: Record<number, { value: number, custom: boolean }>, stocks: Record<number, number> }>
        interface OriginalVariationRef {
          id: number | null | undefined
          name: string
        }
        if (!('originalVariations' in page.state.formData)) {
          ;(page.state.formData as unknown as { originalVariations: OriginalVariationRef[] }).originalVariations = []
        }
        const originals: OriginalVariationRef[] = []
        for (const vRaw of data.variations as VariationItem[]) {
          const key = vRaw.name
          if (!vdata[key]) vdata[key] = { prices: {}, stocks: {} }
          for (const inv of (vRaw.inventory || [])) {
            const wid = inv.warehouseId
            if (!vdata[key].prices[wid]) vdata[key].prices[wid] = { value: Number(vRaw.price) || 0, custom: true }
            vdata[key].stocks[wid] = Number(inv.quantity) || 0
          }
          originals.push({ id: vRaw.id || null, name: vRaw.name })
        }
        ;(page.state.formData as unknown as { originalVariations: OriginalVariationRef[] }).originalVariations = originals
      }
    }
  } catch (e) {
    const err = e as { message?: string }
    fetchError.value = err?.message || 'Không lấy được thông tin sản phẩm'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void loadDetail()
})

onMounted(() => {
  // Show only for edit page and when redirected with ?created=1
  showCreatedBanner.value = isEdit.value && route.query.created === '1'
})

const onSubmit = async () => {
  const newId = await page.actions._onSubmit()
  if (!isEdit.value && newId && newId > 0) {
    await router.push({ path: `/products/${newId}/update`, query: { created: '1' } })
  }
}
const cancel = () => {
  void router.push('/products')
}
</script>

<template>
  <!-- eslint-disable vue/max-attributes-per-line, vue/html-closing-bracket-newline, vue/singleline-html-element-content-newline, vue/html-indent, vue/first-attribute-linebreak -->
  <UDashboardPanel :id="isEdit ? 'update-product' : 'add-product'">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <div class="flex items-center gap-3">
            <UDashboardSidebarCollapse />
            <div>
              <div class="text-lg font-semibold">{{ isEdit ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới' }}</div>
            </div>
          </div>
        </template>
        <template #right>
          <div v-if="!isEdit" class="flex items-center gap-3">
            <span class="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">Công khai</span>
            <UButton label="Xem trước" variant="ghost" icon="i-lucide-external-link" />
          </div>
          <div v-else class="flex items-center gap-3">
            <UButton label="Hủy" variant="ghost" color="neutral" @click="cancel" />
            <UButton label="Lưu" :loading="page.state.productForm.isSubmitting" @click="onSubmit" />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="isEdit && isLoading" class="py-10 text-center text-gray-500">Đang tải...</div>
      <div v-else-if="isEdit && fetchError" class="py-10 text-error">{{ fetchError }}</div>
      <div v-else class="w-full max-w-6xl mx-auto px-4 lg:px-6">
        <!-- Created success banner (full width, top green bar, match sample) -->
        <div v-if="showCreatedBanner" class="relative mb-4 rounded-md bg-emerald-50 text-emerald-800 border-0 border-t-4 border-t-emerald-500 p-4">
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-check-circle" class="h-5 w-5 mt-0.5 text-emerald-600" />
            <div class="text-base font-semibold">
              Sản phẩm "{{ page.state.formData.name || `#${props.productId || ''}` }}" được tạo thành công
            </div>
          </div>
          <button type="button" class="absolute right-3 top-3 text-gray-400 hover:text-gray-600" @click="showCreatedBanner = false">
            <UIcon name="i-lucide-x" class="w-5 h-5" />
          </button>
          <div class="pl-7 mt-3">
            <UButton label="Thêm sản phẩm khác" color="success" variant="soft" @click="router.push('/products/create')" />
          </div>
        </div>

        <div class="flex flex-col lg:flex-row gap-6">
          <!-- Left column -->
          <div class="flex-1 space-y-6">
            <!-- Product info -->
            <UPageCard title="Thông tin sản phẩm" variant="soft" class="bg-white rounded-lg">
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <form class="space-y-4" @submit.prevent="onSubmit">
                  <div>
                    <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tên sản phẩm</label>
                    <input id="name" v-model="page.state.formData.name" type="text" placeholder="Nhập tên sản phẩm" :class="{ 'border-red-500': page.state.errors.name }" class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <p v-if="page.state.errors.name" class="mt-1 text-sm text-red-600">{{ page.state.errors.name }}</p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Thương hiệu</label>
                    <BaseDropdownSelect v-model="page.state.trademark" :options="(page.state.brands || []).map(b => ({ id: b.id, label: b.name }))" :loading="page.state.brandsLoading" placeholder="Chọn thương hiệu" add-new-label="Thêm thương hiệu" class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    <div v-if="page.state.brandsError" class="text-xs text-red-500 mt-1">Lỗi tải thương hiệu: {{ page.state.brandsError }}</div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Danh mục</label>
                    <BaseDropdownSelect v-model="page.state.formData.categoryIds" :options="page.state.categoryOptions" placeholder="Chọn danh mục" add-new-label="Thêm danh mục" multiple class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    <div v-if="page.state.selectedCategories && page.state.selectedCategories.length > 0" class="flex flex-wrap gap-1 mt-2">
                      <span v-for="category in page.state.selectedCategories" :key="category.id" class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                        {{ category.name }}
                        <button type="button" class="ml-1 inline-flex items-center justify-center w-3 h-3 rounded-full text-primary-600 hover:bg-primary-200 hover:text-primary-800 focus:outline-none" @click="page.actions.removeCategory(category.id)">×</button>
                      </span>
                    </div>
                    <p v-if="page.state.errors.categoryIds" class="mt-1 text-sm text-red-600">{{ page.state.errors.categoryIds }}</p>
                    <p class="mt-1 text-xs text-gray-500">Chọn một hoặc nhiều danh mục cho sản phẩm</p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mô tả</label>
                    <div class="rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden bg-white dark:bg-gray-800">
                      <TinyMCESelfHost v-model="page.state.formData.content" placeholder="Nhập mô tả sản phẩm" :height="300" />
                    </div>
                    <p v-if="page.state.errors.content" class="mt-1 text-sm text-red-600">{{ page.state.errors.content }}</p>
                  </div>
                </form>
              </div>
            </UPageCard>

            <!-- Pricing -->
            <UPageCard title="Giá bán" variant="soft" class="bg-white rounded-lg">
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <div class="flex flex-col md:flex-row gap-4">
                  <div class="flex-1">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Giá bán</label>
                    <div class="relative">
                      <input id="price" v-model.number="page.state.formData.price" type="number" min="0" step="0.01" placeholder="0.00" class="w-full px-3 h-[36px] text-base rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 pr-12">
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-base pointer-events-none">đ</span>
                    </div>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center justify-between">
                      <label class="block text-sm font-medium text-gray-700 mb-1">Giá so sánh</label>
                      <span class="ml-1" title="Giá so sánh là giá gốc trước khi giảm giá."><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg></span>
                    </div>
                    <div class="relative">
                      <input id="compareAtPrice" v-model.number="page.state.formData.compareAtPrice" type="number" min="0" step="0.01" placeholder="0.00" class="w-full px-3 h-[36px] text-base rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 pr-12">
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-base pointer-events-none">đ</span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center mt-4">
                  <CustomCheckbox class="mr-2" :model-value="!!page.state.formData.chargeTax" @update:model-value="page.state.formData.chargeTax = $event"><span class="text-base text-gray-900 select-none">Tính thuế cho sản phẩm này</span></CustomCheckbox>
                </div>
                <div class="my-4 border-t border-gray-200" />
                <div class="flex flex-col md:flex-row gap-4">
                  <div class="flex-1">
                    <div class="flex items-center justify-between"><label class="block text-sm font-medium text-gray-700 mb-1">Giá nhập</label><span class="ml-1" title="Giá nhập là giá bạn mua vào."><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg></span></div>
                    <div class="relative"><input id="importPrice" v-model.number="page.state.formData.importPrice" type="number" min="0" step="0.01" placeholder="0.00" class="w-full px-3 h-[36px] text-base rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 pr-12"><span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-base pointer-events-none">đ</span></div>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center justify-between"><label class="block text-sm font-medium text-gray-700 mb-1">Lợi nhuận</label><span class="text-gray-500 text-xs" title="Lợi nhuận = Giá bán - Giá nhập"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg></span></div>
                    <div class="relative"><input id="profit" :value="page.inventory.profitDisplay" readonly class="w-full px-3 h-[36px] text-base rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 pr-12"><span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-base pointer-events-none">đ</span></div>
                  </div>
                  <div class="flex-1">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tỉ suất lợi nhuận</label>
                    <div class="relative"><input id="margin" :value="page.inventory.marginDisplay" readonly class="w-full px-3 h-[36px] text-base rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 pr-8"><span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-base pointer-events-none">%</span></div>
                  </div>
                </div>
              </div>
            </UPageCard>

            <!-- Inventory -->
            <UPageCard title="Tồn kho" variant="soft" class="bg-white rounded-lg">
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <div class="space-y-4">
                  <div class="pt-1"><CustomCheckbox :model-value="!!page.state.formData.manageInventory" @update:model-value="page.state.formData.manageInventory = $event"><span class="text-gray-900">Quản lý số lượng tồn kho</span></CustomCheckbox></div>
                  <div class="pt-1">
                    <div class="flex items-center justify-between mb-2"><div class="text-sm text-gray-700 dark:text-gray-300 font-medium">Số lượng theo kho</div><NuxtLink to="#" class="text-sm text-primary-600 hover:underline">Chỉnh sửa kho</NuxtLink></div>
                    <div class="border-t border-gray-200 pb-[5px]" />
                    <div v-for="w in page.inventory.warehouses" :key="w.id" class="grid grid-cols-2 gap-2 py-1">
                      <div class="text-gray-800 flex items-center h-9">{{ w.name }}</div>
                      <div class="text-right flex items-center justify-end h-9">
                        <template v-if="page.state.formData.manageInventory">
                          <input :value="(page.state.formData.warehouseStocks && page.state.formData.warehouseStocks[w.id]) ?? 0" type="number" min="0" class="w-24 px-3 h-9 text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 text-right appearance-none no-spinner" :placeholder="'Nhập số lượng'" @input="(e: Event) => { const v = Number((e.target as HTMLInputElement).value || 0); const id = w.id; const next = { ...(page.state.formData.warehouseStocks || {}) }; next[id] = v; page.state.formData.warehouseStocks = next }">
                        </template>
                        <template v-else><span class="text-sm text-gray-500 inline-flex items-center h-9">Không theo dõi</span></template>
                      </div>
                    </div>
                  </div>
                  <div v-if="page.state.formData.manageInventory"><CustomCheckbox class="items-start" :model-value="!!page.state.formData.allowNegativeStock" @update:model-value="page.state.formData.allowNegativeStock = $event"><span class="text-gray-900">Cho phép bán khi hết hàng<div v-if="page.state.formData.allowNegativeStock" class="text-gray-500 text-xs">Nhân viên vẫn có thể bán khi tồn kho bằng 0 hoặc âm. (Không ảnh hưởng đến POS)</div></span></CustomCheckbox></div>
                  <div class="space-y-2">
                    <CustomCheckbox :model-value="!!page.state.formData.hasSkuOrBarcode" @update:model-value="page.state.formData.hasSkuOrBarcode = $event"><span class="text-gray-900">Sản phẩm có mã SKU hoặc mã vạch</span></CustomCheckbox>
                    <div v-if="page.state.formData.hasSkuOrBarcode" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label class="block text-sm font-medium text-gray-700 mb-1">Mã SKU (Stock Keeping Unit)</label><input v-model="page.state.formData.sku" type="text" class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500" placeholder="Nhập mã SKU"></div>
                      <div><label class="block text-sm font-medium text-gray-700 mb-1">Mã vạch (ISBN, UPC, GTIN, ...)</label><input v-model="page.state.formData.barcode" type="text" class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500" placeholder="Nhập mã vạch"></div>
                    </div>
                  </div>
                </div>
              </div>
            </UPageCard>

            <!-- Images -->
            <UPageCard title="Hình ảnh & Thiết kế" variant="soft" class="bg-white rounded-lg">
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <div class="space-y-4">
                  <div>
                    <input ref="fileInput" type="file" class="hidden" accept="image/*,video/*,model/*" multiple :disabled="page.media.isUploadingImage" @change="page.media.handleImageUpload">
                    <div v-if="!page.media.imagePreviews.length" class="border border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center min-h-[120px] bg-white">
                      <div class="flex items-center justify-center gap-2 mb-2">
                        <UButton label="Upload new" size="sm" @click="$refs.fileInput && ($refs.fileInput as HTMLInputElement).click()" />
                        <button type="button" class="ml-2 text-gray-700 hover:underline text-sm font-medium">Select existing</button>
                      </div>
                      <div class="text-gray-500 text-sm">Accepts images, videos, or 3D models</div>
                    </div>
                    <div v-else class="grid grid-cols-5 gap-3">
                      <template v-for="(img, idx) in page.media.imagePreviews" :key="idx">
                        <div :class="['relative flex items-center justify-center border border-gray-300 rounded-md bg-white overflow-hidden', idx === 0 ? 'row-span-2 col-span-2 h-52 w-full' : 'h-24 w-full']" draggable="true" @dragstart="(e) => page.media.onDragStart(e, idx)" @dragover.prevent="page.media.onDragOver" @drop="(e) => page.media.onDrop(e, idx)" @dragend="page.media.onDragEnd">
                          <img v-if="!page.media.isUploadingImage" :src="page.media.getPreviewUrl(img)" class="object-cover w-full h-full">
                          <div v-if="!page.media.isUploadingImage && idx === 0" class="absolute bottom-0 left-0 w-full bg-black bg-opacity-60 text-white text-base font-semibold text-center py-1 select-none rounded-b-md">Ảnh đại diện</div>
                          <div v-else-if="page.media.isUploadingImage" class="flex flex-col items-center justify-center w-full h-full">
                            <svg class="animate-spin h-8 w-8 text-gray-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg><span class="text-gray-500 text-sm mt-2">Uploading...</span>
                          </div>
                          <button v-if="!page.media.isUploadingImage" type="button" class="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:bg-gray-100" @click="page.media.removeImage(idx)"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                      </template>
                      <div class="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-white cursor-pointer h-24" @click="$refs.fileInput && ($refs.fileInput as HTMLInputElement).click()" @dragover.prevent="page.media.onDragOver" @drop="(e) => page.media.onDrop(e, page.media.imagePreviews.length)"><span class="text-2xl text-gray-400">+</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </UPageCard>

            <!-- Attributes -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <div class="flex items-center justify-between"><div class="font-semibold text-base">Thuộc tính</div><button v-if="!page.variants.showAttributesEditor" type="button" class="text-primary-600 hover:underline" @click="page.variants.startAttributes">Thêm thuộc tính</button></div>
              <div v-if="!page.variants.showAttributesEditor" class="-mx-6 px-6 pt-2 pb-4 border-t-1 border-gray-200 dark:border-gray-700 flex flex-col justify-center min-h-[64px]"><p class="text-gray-600 w-full">Sản phẩm có nhiều thuộc tính khác nhau. Ví dụ: kích thước, màu sắc.</p></div>
              <div v-else class="-mx-6 px-6 pt-2 pb-4 border-t-1 border-gray-200 dark:border-gray-700">
                <div class="grid grid-cols-2 gap-4 items-center mb-2"><div class="font-medium text-gray-700">Tên thuộc tính</div><div class="font-medium text-gray-700">Giá trị</div></div>
                <div v-for="(attr, idx) in page.variants.attributes" :key="idx" class="grid grid-cols-2 gap-4 items-center mb-2">
                  <input v-model="attr.name" type="text" class="w-full px-3 h-[36px] text-base rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500" placeholder="Tên thuộc tính">
                  <div class="flex items-center gap-2">
                    <div class="flex flex-wrap gap-1 flex-1">
                      <span v-for="(val, vIdx) in attr.values" :key="vIdx" class="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-sm">{{ val }}<button type="button" class="ml-1 text-blue-400 hover:text-blue-700" @click="page.variants.removeAttrValue(idx, vIdx)">×</button></span>
                      <input v-model="attr.input" type="text" class="border-none outline-none flex-1 min-w-[80px] h-[36px] bg-transparent text-gray-700" placeholder="Nhập ký tự và ấn enter" @keydown.enter.prevent="page.variants.addAttrValue(idx)">
                    </div>
                    <button type="button" class="text-gray-400 hover:text-red-500" @click="page.variants.removeAttribute(idx)"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </div>
                </div>
                <button type="button" class="flex items-center text-primary-600 hover:underline mt-2 disabled:opacity-50 disabled:pointer-events-none" :disabled="page.variants.attributes.length >= 3" @click="page.variants.addAttribute"><span class="text-xl mr-1">+</span> Thêm thuộc tính khác</button>
              </div>
            </UPageCard>

            <!-- Variants -->
            <UPageCard v-if="page.variants.variants && page.variants.variants.length" title="Phiên bản" variant="soft" class="bg-white rounded-lg">
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <div class="mb-3">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Kho hàng</label>
                  <select v-model="page.state.formData.warehouseId" class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900" :disabled="page.inventory.warehousesLoading">
                    <option v-if="page.inventory.warehousesLoading" disabled>Đang tải kho...</option>
                    <option v-for="w in page.inventory.warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
                  </select>
                </div>
                <div class="flex flex-wrap items-center gap-3 mb-3"><span class="text-sm text-gray-700">Bộ lọc:</span><template v-for="(a, i) in page.variants.activeAttributes" :key="i"><button type="button" class="inline-flex items-center gap-1 text-sm text-primary-600 bg-primary-50 px-2 py-1 rounded-md hover:underline">{{ a.name }}<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 9l6 6 6-6" /></svg></button></template></div>
                <div class="flex items-center gap-2 py-2 border-y border-gray-200">
                  <CustomCheckbox :model-value="page.variants.isAllVariantsChecked" :indeterminate="page.variants.selectedVariantKeys.length > 0 && page.variants.selectedVariantKeys.length < page.variants.variants.length" @update:model-value="page.variants.onToggleAllVariants($event)" />
                  <span class="font-medium flex items-center gap-1">
                    <template v-if="page.variants.selectedVariantKeys.length === 0">{{ page.variants.variants.length }} phiên bản</template>
                    <template v-else>Đã chọn {{ page.variants.selectedVariantKeys.length }} phiên bản</template>
                  </span>
                  <div v-if="page.variants.selectedVariantKeys.length > 0" class="ml-auto">
                    <UDropdownMenu :items="[
                      { label: 'Chỉnh sửa giá', value: 'edit-price' },
                      { label: 'Chỉnh sửa tồn kho', value: 'edit-stock' },
                      { label: 'Chỉnh sửa SKU', value: 'edit-sku' },
                      { label: 'Chỉnh sửa giá vốn', value: 'edit-cost' },
                      { label: 'Xoá phiên bản', value: 'delete' },
                      { label: 'Chỉnh sửa hàng loạt', value: 'bulk-edit' }
                    ]">
                    <UButton variant="soft" size="sm" class="flex items-center gap-1">
                      Chỉnh sửa
                      <svg class="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                    </UButton>
                    </UDropdownMenu>
                  </div>
                </div>
                <div>
                  <div v-for="(v, vi) in page.variants.variants" :key="v.key || vi" class="flex items-center justify-between py-4 border-b border-gray-100">
                    <div class="flex items-center gap-3"><CustomCheckbox :model-value="page.variants.selectedVariantKeys.includes(v.key)" @update:model-value="page.variants.onToggleVariant(v.key, $event)" /><div class="text-gray-900">{{ v.name }}</div></div>
                    <div class="text-right text-sm leading-5">
                      <div>
                        <span class="text-gray-600">Giá bán:</span>
                        <span v-if="!page.variants.isEditingPrice(v.key)" class="ml-1 text-gray-900 font-medium underline cursor-pointer" @click="page.variants.startEditPrice(v.key); $nextTick(() => priceInputs[vi]?.focus())">{{ (v.price || 0).toLocaleString('vi-VN') }}đ</span>
                        <template v-else-if="page.variants.isEditingPrice(v.key)"><input ref="el => priceInputs[vi] = el as HTMLInputElement" type="number" min="0" class="w-24 px-1 py-0.5 border border-gray-300 rounded text-right text-gray-900" :value="v.price" @blur="page.variants.commitPrice(v.key, page.state.formData.warehouseId || 0, Number(($event.target as HTMLInputElement).value || 0))" @keydown.enter.prevent="page.variants.commitPrice(v.key, page.state.formData.warehouseId || 0, Number(($event.target as HTMLInputElement).value || 0))"></template>
                      </div>
                      <div class="mt-1">
                        <span class="text-gray-500">Có thể bán</span>
                        <span v-if="!page.variants.isEditingStock(v.key)" class="mx-1 underline cursor-pointer text-gray-700" @click="page.variants.startEditStock(v.key); $nextTick(() => stockInputs[vi]?.focus())">{{ v.stock || 0 }}</span>
                        <template v-else-if="page.variants.isEditingStock(v.key)"><input ref="el => stockInputs[vi] = el as HTMLInputElement" type="number" min="0" class="w-20 px-1 py-0.5 border border-gray-300 rounded text-right text-gray-900" :value="v.stock" @blur="page.variants.commitStock(v.key, page.state.formData.warehouseId || 0, Number(($event.target as HTMLInputElement).value || 0))" @keydown.enter.prevent="page.variants.commitStock(v.key, page.state.formData.warehouseId || 0, Number(($event.target as HTMLInputElement).value || 0))"></template>
                        <span class="text-gray-500">tại {{ page.inventory.warehouses.find(w => w.id === page.state.formData.warehouseId)?.name || 'kho' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="flex items-center justify-between py-3"><div class="text-gray-700">Tổng tồn kho</div><div class="text-gray-900 font-medium">Có thể bán: {{ page.variants.totalVariantStock }}</div></div>
              </div>
            </UPageCard>

            <!-- Product links -->
            <UPageCard title="Liên kết sản phẩm" variant="soft" class="bg-white rounded-lg">
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <div class="space-y-3">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Đường dẫn</label>
                  <div class="flex flex-col gap-3">
                    <div class="flex items-center w-full rounded-md border border-gray-300 bg-gray-50 px-4" style="height:36px;">
                      <span class="text-gray-400 select-none mr-1">web.vnnsoft.com/</span>
                      <span class="text-gray-900 flex-1">{{ page.state.slug }}</span>
                      <button type="button" class="ml-2 text-gray-400 hover:text-gray-600"><UIcon name="i-lucide-link-2" class="h-5 w-5" /></button>
                    </div>
                    <UButton label="Rút gọn link" icon="i-lucide-zap" variant="soft" class="w-fit mt-1" />
                  </div>
                </div>
              </div>
            </UPageCard>

            <!-- Submit button -->
            <div class="w-full flex justify-end mt-8 mb-8">
              <UButton :label="isEdit ? 'Lưu sản phẩm' : 'Thêm sản phẩm'" color="primary" size="lg" :loading="page.state.productForm.isSubmitting" class="px-8 py-2 text-lg font-semibold rounded-md shadow" @click="onSubmit" />
            </div>
          </div>

          <!-- Right column -->
          <div class="w-full lg:w-80 space-y-6">
            <UPageCard title="Cài đặt" variant="soft" class="bg-white rounded-lg">
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Trạng thái</label>
                    <select v-model="page.state.status" class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white pr-[34px]">
                      <option value="Public">Công khai</option>
                      <option value="Draft">Nháp</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Giao diện trang sản phẩm</label>
                    <select v-model="page.state.pageTemplate" class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white pr-[34px]">
                      <option value="Default product">Sản phẩm mặc định</option>
                    </select>
                  </div>
                </div>
              </div>
            </UPageCard>
            <UPageCard title="Kênh bán" variant="soft" class="bg-white rounded-lg">
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <div class="space-y-3">
                  <div class="text-sm font-medium text-gray-700 dark:text-gray-300">Kênh bán</div>
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <UAvatar size="xl" class="bg-gray-200 dark:bg-gray-700 text-gray-600" :alt="'Cửa hàng trực tuyến'">
                        <UIcon name="i-heroicons-building-storefront-20-solid" class="w-6 h-6" />
                      </UAvatar>
                      <div class="text-sm text-gray-800 dark:text-gray-200">Cửa hàng trực tuyến <span class="text-gray-500">đã bán</span></div>
                    </div>
                    <UButton label="Quản lý" variant="ghost" icon="i-lucide-external-link" />
                  </div>
                </div>
              </div>
            </UPageCard>
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <template #title>
                <div class="flex items-center gap-1">Tổ chức sản phẩm <span title="Thông tin về cách tổ chức sản phẩm"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg></span></div>
              </template>
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Loại</label>
                    <input type="text" class="w-full px-3 h-[36px] text-base rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500" placeholder="">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nhà cung cấp</label>
                    <BaseDropdownSelect v-model="page.state.selectedSupplier" :options="(page.state.suppliers || []).map(s => ({ id: s.id, label: s.name }))" :loading="page.state.suppliersLoading" placeholder="Chọn nhà cung cấp" add-new-label="Thêm nhà cung cấp" class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Bộ sưu tập</label>
                    <BaseDropdownSelect v-model="page.state.selectedCollections" :options="(page.state.collections || []).map(c => ({ id: c.id, label: c.name }))" :loading="page.state.collectionsLoading" placeholder="Chọn bộ sưu tập" multiple-display="labels" selected-count-text="Đã chọn" selected-count-suffix="giá trị" :count-when-at-least="2" add-new-label="Thêm bộ sưu tập" multiple class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    <div v-if="page.state.selectedCollections && page.state.selectedCollections.length > 0" class="flex flex-wrap gap-1 mt-2">
                      <span v-for="col in (page.state.collections || []).filter(c => page.state.selectedCollections.includes(c.id))" :key="col.id" class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">{{ col.name }}<button type="button" class="ml-1 inline-flex items-center justify-center w-3 h-3 rounded-full text-primary-600 hover:bg-primary-200 hover:text-primary-800 focus:outline-none" @click="page.state.selectedCollections = page.state.selectedCollections.filter(id => id !== col.id)">×</button></span>
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <div class="w-full">
                      <input v-model="page.state.tagInput" type="text" placeholder="Nhập tag rồi nhấn Enter hoặc dấu phẩy" class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500" @keydown="page.tags.onTagKeydown" @blur="page.tags.commitTag" @paste="page.tags.onTagPaste">
                      <div v-if="page.state.tagsList.length" class="flex flex-wrap gap-2 mt-2">
                        <span v-for="(tag, idx) in page.state.tagsList" :key="`${tag}-${idx}`" class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-normal bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200">{{ tag }}<button type="button" class="inline-flex items-center text-gray-400 hover:text-gray-600 focus:outline-none" @click="page.tags.removeTag(idx)">×</button></span>
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
