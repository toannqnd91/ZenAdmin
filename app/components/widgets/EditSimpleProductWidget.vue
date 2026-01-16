<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { widgetsService } from '~/services/widgets.service'
import { productService } from '~/services/product.service'
import type { WidgetZone } from '~/services/widgets.service'
import type { ProductItem } from '~/composables/useProducts'
import BaseTable from '~/components/base/BaseTable.vue'
import BaseModal from '~/components/base/BaseModal.vue'
import type { TableColumn } from '~/components/base/BaseTable.vue'

const router = useRouter()
const route = useRoute()
const widgetId = computed(() => Number(route.params.id))

// Track if component is mounted for Teleport
const isMounted = ref(false)

// Form state
const widgetName = ref('')
const widgetZone = ref<string | undefined>(undefined)
const publishStart = ref('')
const publishEnd = ref('')
const displayOrder = ref(0)
const selectedProducts = ref<ProductItem[]>([])

// UI state
const isSubmitting = ref(false)
const isLoading = ref(true)
const widgetZones = ref<WidgetZone[]>([])
const widgetZoneItems = ref<string[]>([])

// Modal state
const showProductModal = ref(false)
const modalSearch = ref('')
const modalProducts = ref<ProductItem[]>([])
const modalLoading = ref(false)
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

let searchTimeout: any
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

function toDateTimeLocal(isoString: string | null): string {
    if (!isoString) return ''
    return new Date(isoString).toISOString().slice(0, 16)
}

function toISO(val: string): string | null {
    if (!val) return null
    try {
        return new Date(val).toISOString()
    } catch {
        return null
    }
}

function formatPrice(price: number | null) {
    if (price === null) return 'Liên hệ'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

// Load data
onMounted(async () => {
    isMounted.value = true
    try {
        isLoading.value = true

        // Load Zones
        const zonesResponse = await widgetsService.getWidgetZones()
        if (zonesResponse.success && zonesResponse.data) {
            widgetZones.value = zonesResponse.data
            widgetZoneItems.value = zonesResponse.data.map((zone: WidgetZone) => zone.name)
        }

        // Load Widget Data
        const widgetRes = await widgetsService.getSimpleProductWidget(widgetId.value)
        if (widgetRes.success && widgetRes.data) {
            const w = widgetRes.data
            widgetName.value = w.name
            widgetZone.value = widgetZones.value.find(z => z.id === w.widgetZoneId)?.name || undefined
            publishStart.value = toDateTimeLocal(w.publishStart)
            publishEnd.value = toDateTimeLocal(w.publishEnd)
            displayOrder.value = w.displayOrder

            selectedProducts.value = w.products.map(p => ({
                id: p.id,
                name: p.name,
                isPublished: p.isPublished,
                sku: '',
                price: 0,
                priceMin: 0,
                thumbnailImageUrl: ''
            })) as unknown as ProductItem[]
        }

    } catch (error) {
        console.error('Error loading data:', error)
        alert('Không thể tải dữ liệu widget')
    } finally {
        isLoading.value = false
    }
})

// Infinite scroll state
const scrollContainer = ref<HTMLElement | null>(null)
const isfetchingMore = ref(false)
const hasMore = ref(true)

// Modal methods
async function fetchModalProducts(isLoadMore = false) {
    if (isLoadMore) {
        isfetchingMore.value = true
    } else {
        modalLoading.value = true
        modalPagination.value.pageIndex = 0
        modalProducts.value = [] // Reset list on new search/init
        hasMore.value = true
    }

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
            const newItems = data.items || []

            if (isLoadMore) {
                modalProducts.value = [...modalProducts.value, ...newItems]
            } else {
                modalProducts.value = newItems
            }

            // Check if we reached the end
            if (newItems.length < modalPagination.value.pageSize) {
                hasMore.value = false
            }

            // We don't use totalRecords for pagination in infinite scroll, so we can ignore setting it for BaseTable footer
            modalPagination.value.totalPages = data.numberOfPages || 0
            modalPagination.value.totalRecords = data.totalRecords || 0

            // Update cache
            newItems.forEach((p: ProductItem) => {
                if (p.id) productCache.set(p.id, p)
            })
        }
    } catch (error) {
        console.error('Error fetching products:', error)
    } finally {
        modalLoading.value = false
        isfetchingMore.value = false
    }
}

function onScroll(e: Event) {
    const el = e.target as HTMLElement
    if (!el) return

    // Check if scrolled near bottom
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 50) {
        if (!modalLoading.value && !isfetchingMore.value && hasMore.value) {
            modalPagination.value.pageIndex++
            fetchModalProducts(true)
        }
    }
}

function openModal() {
    showProductModal.value = true
    modalSearch.value = ''

    // Initialize temp selection and cache
    tempSelectedProductIds.value = selectedProducts.value.map(p => p.id)
    selectedProducts.value.forEach(p => { productCache.set(p.id, p) })

    // Reset infinite scroll
    fetchModalProducts(false)

    // Reset scroll position
    if (scrollContainer.value) {
        scrollContainer.value.scrollTop = 0
    }
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

async function handleSubmit() {
    if (isSubmitting.value) return

    try {
        isSubmitting.value = true

        if (!widgetName.value.trim()) {
            alert('Tên Widget là bắt buộc')
            return
        }
        if (!widgetZone.value) {
            alert('Vị trí hiển thị là bắt buộc')
            return
        }

        const selectedZone = widgetZones.value.find(zone => zone.name === widgetZone.value)
        if (!selectedZone) {
            alert('Vui lòng chọn vị trí hiển thị hợp lệ')
            return
        }

        const payload = {
            id: widgetId.value,
            name: widgetName.value,
            widgetZoneId: selectedZone.id,
            publishStart: toISO(publishStart.value),
            publishEnd: toISO(publishEnd.value),
            displayOrder: displayOrder.value,
            products: selectedProducts.value.map(p => ({
                id: p.id,
                name: p.name,
                isPublished: p.isPublished
            }))
        }

        const response = await widgetsService.updateSimpleProductWidget(widgetId.value, payload)

        if (response.success) {
            alert('Cập nhật widget thành công!')
            router.push('/widgets')
        } else {
            alert('Lỗi: ' + (response.message || 'Không thể cập nhật widget'))
        }
    } catch (error: unknown) {
        console.error('Error updating product widget:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        alert('Có lỗi xảy ra: ' + errorMessage)
    } finally {
        isSubmitting.value = false
    }
}

function handleCancel() {
    router.push('/widgets')
}
</script>

<template>
    <!-- Actions in Navbar -->
    <Teleport v-if="isMounted" to="#navbar-actions">
        <UButton label="Hủy" variant="ghost" color="neutral" @click="handleCancel" />
        <UButton label="Lưu" :loading="isSubmitting" @click="handleSubmit" />
    </Teleport>

    <div class="w-full max-w-6xl mx-auto px-4 lg:px-6">
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
                <UCard>
                    <template #header>
                        <h3 class="text-lg font-semibold">Thông tin Widget</h3>
                    </template>
                    <form class="space-y-6" @submit.prevent="handleSubmit">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tên
                                Widget <span class="text-red-500">*</span></label>
                            <input v-model="widgetName" type="text" placeholder="Nhập tên widget"
                                class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                        </div>
                    </form>
                </UCard>

                <UCard>
                    <template #header>
                        <h3 class="text-lg font-semibold">Danh sách sản phẩm</h3>
                    </template>
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
                                    <td colspan="4"
                                        class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                        Chưa có sản phẩm nào được chọn
                                    </td>
                                </tr>
                                <tr v-for="(product, index) in selectedProducts" :key="product.id">
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm font-medium text-gray-900 dark:text-white">{{
                                            product.name
                                        }}</div>
                                        <div class="text-sm text-gray-500 dark:text-gray-400">{{ product.sku ||
                                            '---' }}
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {{ formatPrice((product as any).priceMin !== undefined ? (product as
                                            any).priceMin : ((product as any).price || 0)) }}
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
                </UCard>
            </div>

            <!-- Right column -->
            <div class="w-full lg:w-80 space-y-6">
                <UCard>
                    <template #header>
                        <h3 class="text-lg font-semibold">Cài đặt hiển thị</h3>
                    </template>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vị trí (Zone)
                                <span class="text-red-500">*</span></label>
                            <select v-model="widgetZone"
                                class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                <option :value="undefined" disabled>Chọn vị trí hiển thị</option>
                                <option v-for="zone in widgetZoneItems" :key="zone" :value="zone">{{ zone }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Thứ tự hiển
                                thị</label>
                            <input v-model="displayOrder" type="number" min="0" placeholder="0"
                                class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                        </div>
                    </div>
                </UCard>

                <UCard>
                    <template #header>
                        <h3 class="text-lg font-semibold">Thời gian xuất bản</h3>
                    </template>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ngày bắt
                                đầu</label>
                            <input v-model="publishStart" type="datetime-local" placeholder="dd/MM/yyyy HH:mm"
                                class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ngày kết
                                thúc</label>
                            <input v-model="publishEnd" type="datetime-local" placeholder="dd/MM/yyyy HH:mm"
                                class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                        </div>
                        <div class="text-xs text-gray-500 italic">
                            Định dạng: dd/MM/yyyy HH:mm
                        </div>
                    </div>
                </UCard>
            </div>
        </div>

        <!-- Product Selection Modal -->
        <BaseModal v-model="showProductModal" title="Chọn sản phẩm" widthClass="max-w-3xl" bodyClass="p-0">
            <div class="h-[600px] flex flex-col overflow-y-auto" ref="scrollContainer" @scroll="onScroll">
                <BaseTable :q="modalSearch" @update:q="onSearchChange" :pagination="modalPagination"
                    @update:pagination="onPaginationChange" :data="modalProducts" title="Danh sách sản phẩm"
                    :columns="tableColumns" :loading="modalLoading" :row-selection="tableRowSelection"
                    :total-records="0" :total-pages="0" :show-row-actions="false" :show-selection-delete="false"
                    :actions="[]" :hide-title="true" :disable-client-filter="true"
                    search-placeholder="Tìm kiếm theo tên, SKU..." table-min-width="0"
                    @update:rowSelection="onSelectionChange">
                    <!-- Custom name column -->
                    <template #column-name="{ item }">
                        <div class="flex items-center gap-3">
                            <div
                                class="h-10 w-10 flex-shrink-0 bg-gray-100 rounded bg-cover bg-center overflow-hidden border border-gray-200">
                                <img v-if="item.thumbnailImageUrl" :src="item.thumbnailImageUrl"
                                    class="w-full h-full object-cover" />
                                <div v-else
                                    class="flex items-center justify-center h-full w-full text-xs text-gray-400">IMG
                                </div>
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
                            {{ formatPrice((item as any).priceMin || 0) }}
                        </div>
                    </template>
                </BaseTable>

                <div v-if="isfetchingMore" class="p-4 text-center text-sm text-gray-500">
                    Đang tải thêm...
                </div>
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
    </div>
</template>