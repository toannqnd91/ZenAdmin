<script setup lang="ts">
import { ref, onMounted, watch, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { widgetsService } from '~/services/widgets.service'
import { productService } from '~/services/product.service'
import type { WidgetZone, CreateSimpleProductWidgetRequest } from '~/services/widgets.service'
import type { ProductItem } from '~/composables/useProducts'
import BaseTable from '~/components/base/BaseTable.vue'
import type { TableColumn } from '~/components/base/BaseTable.vue'

const router = useRouter()

// Form state
const widgetName = ref('')
const widgetZone = ref<string | undefined>(undefined)
const publishStart = ref('')
const publishEnd = ref('')
const displayOrder = ref(0)
const selectedProducts = ref<ProductItem[]>([])

// UI state
const isSubmitting = ref(false)
const isLoading = ref(false)
const widgetZones = ref<WidgetZone[]>([])
const widgetZoneItems = ref<string[]>([])

// Modal state
const showProductModal = ref(false)
const modalSearch = ref('')
const modalProducts = ref<ProductItem[]>([])
const modalLoading = ref(false)
// BaseTable uses 0-based pageIndex
const modalPagination = ref({ pageIndex: 0, pageSize: 10, totalPages: 1, totalRecords: 0 })
const tempSelectedProductIds = ref<number[]>([])
const productCache = reactive(new Map<number, ProductItem>())

const tableColumns: TableColumn[] = [
  { key: 'name', label: 'Tên sản phẩm' },
  { key: 'price', label: 'Giá bán', class: 'text-right', align: 'right' }
]

const tableRowSelection = computed(() => {
  const sel: Record<string, boolean> = {}
  tempSelectedProductIds.value.forEach(id => { sel[String(id)] = true })
  return sel
})

function onSelectionChange(newSelection: Record<string, boolean>) {
  tempSelectedProductIds.value = Object.keys(newSelection)
    .filter(k => newSelection[k])
    .map(Number)
}

let searchTimeout: NodeJS.Timeout
function onSearchChange(q: string) {
  modalSearch.value = q
  // Debounce search
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    modalPagination.value.pageIndex = 0
    fetchModalProducts()
  }, 400)
}

function onPaginationChange(newVal: { pageIndex: number, pageSize: number }) {
  modalPagination.value = { ...modalPagination.value, ...newVal }
  fetchModalProducts()
}

// Helper function to convert dd/MM/yyyy HH:mm to ISO string
function convertToISOString(dateTimeString: string): string {
  if (!dateTimeString) return ''
  try {
    const match = dateTimeString.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/)
    if (!match) return ''
    const [, day, month, year, hours, minutes] = match
    const date = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00`)
    return date.toISOString()
  } catch {
    return ''
  }
}

// Format price helper
function formatPrice(price: number | null) {
  if (price === null) return 'Liên hệ'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

// Load data
onMounted(async () => {
  try {
    isLoading.value = true
    const zonesResponse = await widgetsService.getWidgetZones()
    if (zonesResponse.success && zonesResponse.data) {
      widgetZones.value = zonesResponse.data
      widgetZoneItems.value = zonesResponse.data.map((zone: WidgetZone) => zone.name)
    }
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    isLoading.value = false
  }
})

// Modal methods
async function fetchModalProducts() {
  modalLoading.value = true
  try {
    const response = await productService.getProducts({
      search: modalSearch.value,
      pagination: {
        start: modalPagination.value.pageIndex * modalPagination.value.pageSize,
        number: modalPagination.value.pageSize
      }
    })

    const data = (response as any).data || response

    if (data) {
      modalProducts.value = data.items || []
      modalPagination.value.totalPages = data.numberOfPages || 0
      modalPagination.value.totalRecords = data.totalRecords || 0

      // Update cache
      modalProducts.value.forEach(p => {
        if (p.id) productCache.set(p.id, p)
      })
    }
  } catch (error) {
    console.error('Error fetching products:', error)
  } finally {
    modalLoading.value = false
  }
}

function openModal() {
  showProductModal.value = true
  modalPagination.value.pageIndex = 0
  modalSearch.value = ''

  // Initialize temp selection and cache
  tempSelectedProductIds.value = selectedProducts.value.map(p => p.id)
  selectedProducts.value.forEach(p => { productCache.set(p.id, p) })

  fetchModalProducts()
}

function confirmSelection() {
  const newSelected: ProductItem[] = []
  for (const id of tempSelectedProductIds.value) {
    const p = productCache.get(id)
    if (p) newSelected.push(p)
  }

  selectedProducts.value = newSelected
  showProductModal.value = false
}

function removeProduct(index: number) {
  selectedProducts.value.splice(index, 1)
}

// Submit handler
async function handleSubmit() {
  if (isSubmitting.value) return

  try {
    isSubmitting.value = true

    // Validation
    if (!widgetName.value.trim()) {
      alert('Tên Widget là bắt buộc')
      return
    }
    if (!widgetZone.value) {
      alert('Vị trí hiển thị là bắt buộc')
      return
    }

    // Find the widget zone ID by name
    const selectedZone = widgetZones.value.find(zone => zone.name === widgetZone.value)
    if (!selectedZone) {
      alert('Vui lòng chọn vị trí hiển thị hợp lệ')
      return
    }

    const payload: CreateSimpleProductWidgetRequest = {
      id: 0,
      name: widgetName.value,
      widgetZoneId: selectedZone.id,
      publishStart: publishStart.value ? convertToISOString(publishStart.value) : null,
      publishEnd: publishEnd.value ? convertToISOString(publishEnd.value) : null,
      displayOrder: displayOrder.value,
      products: selectedProducts.value.map(p => ({
        id: p.id,
        name: p.name,
        isPublished: p.isPublished
      }))
    }

    const response = await widgetsService.createSimpleProductWidget(payload)

    if (response.success) {
      alert('Simple Product Widget đã được tạo thành công!')
      router.push('/widgets')
    } else {
      alert('Lỗi: ' + (response.message || 'Không thể tạo widget'))
    }
  } catch (error: unknown) {
    console.error('Error creating product widget:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    alert('Có lỗi xảy ra: ' + errorMessage)
  } finally {
    isSubmitting.value = false
  }
}

function handleCancel() {
  router.push('/widgets')
}

function goBack() {
  router.push('/widgets')
}
</script>

<template>
  <UDashboardPanel id="create-simple-product-widget">
    <template #header>
      <UDashboardNavbar title="Thêm Simple Product Widget">
        <template #leading>
          <div class="flex items-center gap-3">
            <button
              class="h-8 w-8 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              @click="goBack">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          </div>
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <UButton label="Hủy" variant="ghost" color="neutral" @click="handleCancel" />
            <UButton label="Lưu" :loading="isSubmitting" @click="handleSubmit" />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full max-w-6xl mx-auto px-4 lg:px-6">
        <!-- Breadcrumb -->
        <nav class="mb-6" aria-label="Breadcrumb">
          <ol class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <li>
              <NuxtLink to="/widgets" class="hover:text-primary-600 dark:hover:text-primary-400">Quản lý Widgets
              </NuxtLink>
            </li>
            <li class="flex items-center">
              <svg class="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clip-rule="evenodd" />
              </svg>
              <span class="text-gray-900 dark:text-white font-medium">Thêm Simple Product Widget</span>
            </li>
          </ol>
        </nav>

        <div v-if="isLoading" class="flex items-center justify-center py-12">
          <div class="text-center">
            <svg class="animate-spin h-8 w-8 text-primary-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p class="text-gray-500">Đang tải dữ liệu...</p>
          </div>
        </div>

        <div v-else class="flex flex-col lg:flex-row gap-6">
          <!-- Left column -->
          <div class="flex-1 space-y-6">
            <UPageCard title="Thông tin Widget" variant="soft" class="bg-white rounded-lg overflow-hidden">
              <form class="space-y-6" @submit.prevent="handleSubmit">
                <div>
                  <label for="widgetName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tên
                    Widget <span class="text-red-500">*</span></label>
                  <input id="widgetName" v-model="widgetName" type="text" placeholder="Nhập tên widget"
                    class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                </div>
              </form>
            </UPageCard>

            <UPageCard title="Danh sách sản phẩm" variant="soft" class="bg-white rounded-lg overflow-hidden">
              <div class="flex justify-end mb-4">
                <UButton icon="i-lucide-plus" label="Thêm sản phẩm" color="primary" @click="openModal" />
              </div>

              <div class="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead class="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col"
                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Tên sản phẩm</th>
                      <th scope="col"
                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Giá</th>
                      <th scope="col"
                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Trạng thái</th>
                      <th scope="col"
                        class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Hành động</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    <tr v-if="selectedProducts.length === 0">
                      <td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        Chưa có sản phẩm nào được chọn
                      </td>
                    </tr>
                    <tr v-for="(product, index) in selectedProducts" :key="product.id">
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">{{ product.name }}</div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">{{ product.sku }}</div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {{ formatPrice(product.priceMin || 0) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                          :class="product.isPublished ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'">
                          {{ product.isPublished ? 'Đã xuất bản' : 'Chưa xuất bản' }}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button @click="removeProduct(index)"
                          class="text-red-600 hover:text-red-900 dark:hover:text-red-400">
                          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </UPageCard>
          </div>

          <!-- Right column -->
          <div class="w-full lg:w-80 space-y-6">
            <UPageCard title="Cài đặt hiển thị" variant="soft" class="bg-white rounded-lg">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vị trí (Zone) <span
                      class="text-red-500">*</span></label>
                  <select v-model="widgetZone"
                    class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option :value="undefined" disabled>Chọn vị trí hiển thị</option>
                    <option v-for="zone in widgetZoneItems" :key="zone" :value="zone">{{ zone }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Thứ tự hiển thị</label>
                  <input v-model="displayOrder" type="number" min="0" placeholder="0"
                    class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                </div>
              </div>
            </UPageCard>

            <UPageCard title="Thời gian xuất bản" variant="soft" class="bg-white rounded-lg">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ngày bắt đầu</label>
                  <input v-model="publishStart" placeholder="dd/MM/yyyy HH:mm"
                    class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ngày kết thúc</label>
                  <input v-model="publishEnd" placeholder="dd/MM/yyyy HH:mm"
                    class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                </div>
                <div class="text-xs text-gray-500 italic">
                  Định dạng: dd/MM/yyyy HH:mm
                </div>
              </div>
            </UPageCard>
          </div>
        </div>
      </div>

    </template>
  </UDashboardPanel>

  <!-- Product Selection Modal -->
  <BaseModal v-model="showProductModal" title="Chọn sản phẩm" widthClass="max-w-3xl" bodyClass="p-0">
    <div class="h-[600px] flex flex-col">
      <BaseTable v-model:q="modalSearch" v-model:pagination="modalPagination" :data="modalProducts"
        title="Danh sách sản phẩm" :columns="tableColumns" :loading="modalLoading" :row-selection="tableRowSelection"
        :total-records="modalPagination.totalRecords" :total-pages="modalPagination.totalPages"
        :show-row-actions="false" :show-selection-delete="false" :actions="[]" :hide-title="true"
        :disable-client-filter="true" search-placeholder="Tìm kiếm theo tên, SKU..." table-min-width="0"
        @update:rowSelection="onSelectionChange" @update:q="onSearchChange" @update:pagination="onPaginationChange">
        <!-- Custom name column -->
        <template #column-name="{ item }">
          <div class="flex items-center gap-3">
            <div
              class="h-10 w-10 flex-shrink-0 bg-gray-100 rounded bg-cover bg-center overflow-hidden border border-gray-200">
              <img v-if="item.thumbnailImageUrl" :src="item.thumbnailImageUrl" class="w-full h-full object-cover" />
              <div v-else class="flex items-center justify-center h-full w-full text-xs text-gray-400">IMG</div>
            </div>
            <div>
              <div class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ item.name }}</div>
              <div class="text-xs text-gray-500 font-mono">{{ item.sku || '---' }}</div>
            </div>
          </div>
        </template>

        <!-- Custom price column -->
        <template #column-price="{ item }">
          <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
            {{ formatPrice(item.priceMin || 0) }}
          </div>
        </template>
      </BaseTable>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3 w-full">
        <button type="button"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          @click="showProductModal = false">
          Hủy
        </button>
        <button type="button"
          class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          @click="confirmSelection">
          Xác nhận ({{ tempSelectedProductIds.length }})
        </button>
      </div>
    </template>
  </BaseModal>
</template>
```
