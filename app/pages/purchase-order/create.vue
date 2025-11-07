// ...existing code...
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { BaseService } from '@/services/base.service'
import { API_ENDPOINTS } from '@/utils/api'
import type { ApiResponse } from '@/types/common'
import AddImportCostModal from '@/components/AddImportCostModal.vue'
import ProductPriceAdjustModal from '@/components/ProductPriceAdjustModal.vue'
import BaseCardHeader from '~/components/BaseCardHeader.vue'
import CustomCheckbox from '@/components/CustomCheckbox.vue'
import CustomRadio from '@/components/CustomRadio.vue'
import BaseNumberInput from '@/components/base/BaseNumberInput.vue'
import { productService } from '@/services/product.service'
import { warehouseService } from '@/services/warehouse.service'
import { supplierService } from '@/services/supplier.service'
import type { SuppliersApiResponse } from '@/services/supplier.service'
import RemoteSearchSelect from '@/components/RemoteSearchSelect.vue'

// Product types
interface ProductSearchItem {
  id: number | string
  sku?: string
  name: string
  normalizedName?: string
  thumbnailImageUrl?: string | null
  costPrice?: number
  stockQuantity?: number
}
interface TransferProduct extends ProductSearchItem {
  quantity: number
  unitPrice: number
  total: number
  originalUnitPrice?: number
  // Persist per-product discount metadata so modal remembers selection
  _discountType?: 'amount' | 'percent'
  _discountValue?: number | null
}

// Import cost type
interface ImportCost {
  name: string
  value: number
}

const splitLine = ref(false)

const showProductSearch = ref(false)
const productList = ref<ProductSearchItem[]>([])
const loadingProducts = ref(false)
const productSearchPopupRef = ref<HTMLElement | null>(null)
const mainProductInputRef = ref<HTMLInputElement | null>(null)

// Nhà cung cấp - sử dụng component RemoteSearchSelect tái sử dụng
// Generic item shape for RemoteSearchSelect compatibility
type GenericItem = Record<string, unknown>
const selectedSupplier = ref<GenericItem | null>(null)

async function fetchSuppliersSelect(search: string): Promise<GenericItem[]> {
  try {
    const res = await supplierService.getSuppliers({
      search: search || undefined,
      pagination: { start: 0, number: 30 },
      sort: { field: 'Id', reverse: true }
    }) as unknown as ApiResponse<SuppliersApiResponse['data']>
    if (res.success && res.data && Array.isArray(res.data.items)) {
      return res.data.items
        .filter(s => !s.isDeleted)
        .map(s => ({ ...(s as unknown as Record<string, unknown>) })) as GenericItem[]
    }
    return []
  } catch {
    return []
  }
}

function supplierDisplay(item: GenericItem) {
  const name = String(item.name ?? '')
  const phone = String(item.phone ?? '---')
  const code = item.slug ? ` (${String(item.slug)})` : ''
  return `${name} - ${phone}${code}`
}
function supplierSubtitle(item: GenericItem) {
  return `${item.phone || '---'} · ${item.slug || ''}`
}
function onAddSupplier() {
  // TODO: mở modal thêm mới nhà cung cấp
}

// List of products added to purchase order
const transferProducts = ref<TransferProduct[]>([])
// Modal điều chỉnh giá
const showPriceAdjustModal = ref(false)
const activePriceProductIndex = ref<number | null>(null)

function openPriceAdjust(idx: number) {
  activePriceProductIndex.value = idx
  showPriceAdjustModal.value = true
}
interface AdjustPricePayload {
  newPrice: number
  basePrice: number
  discountType?: 'amount' | 'percent'
  discountInput?: number | null
}
function applyAdjustedPrice(payload: AdjustPricePayload) {
  if (activePriceProductIndex.value == null) return
  const prod = transferProducts.value[activePriceProductIndex.value]
  if (!prod) return
  // Update base (originalUnitPrice) to the basePrice coming from modal.
  // If no discount (discountInput null) then clear originalUnitPrice.
  if (payload.discountInput && payload.discountInput > 0) {
    prod.originalUnitPrice = payload.basePrice
  } else {
    // No discount -> treat current price as base, remove strikethrough
    prod.originalUnitPrice = undefined
  }
  prod.unitPrice = payload.newPrice
  prod.total = prod.quantity * prod.unitPrice
  // Store discount metadata if provided
  if (payload && typeof payload.discountType === 'string') {
    prod._discountType = payload.discountType
    prod._discountValue = typeof payload.discountInput === 'number' ? payload.discountInput : null
  }
  validateDiscount()
}

// Chi nhánh nhập - dùng RemoteSearchSelect
const selectedWarehouse = ref<GenericItem | null>(null)
async function fetchWarehousesSelect(search: string): Promise<GenericItem[]> {
  try {
    const res = await warehouseService.getWarehouses()
    const list = Array.isArray(res?.data) ? res.data : []
    return list
      .filter((w: unknown) => {
        const ww = w as { name?: string }
        return !search || String(ww.name).toLowerCase().includes(search.toLowerCase())
      })
      .map(w => ({ ...(w as unknown as Record<string, unknown>) }))
  } catch {
    return []
  }
}
function warehouseDisplay(item: GenericItem) {
  return String(item.name || '')
}
function warehouseSubtitle(item: GenericItem) {
  return item.address ? String(item.address) : ''
}

onMounted(() => {
  window.addEventListener('keydown', handleF3)
})

// Tính toán tổng tiền, giảm giá, chi phí nhập hàng, tiền cần trả NCC
const totalAmount = computed(() => transferProducts.value.reduce((sum, prod) => sum + ((prod.quantity || 0) * (prod.unitPrice || 0)), 0))
const discountAmount = ref(0) // Có thể cập nhật sau
const importCost = ref(0)
const appliedImportCosts = ref<ImportCost[]>([])
const supplierPayAmount = computed(() => totalAmount.value - discountAmount.value + importCost.value)
// Payment status & method (match orders/create behavior)
const paymentStatus = ref<'paid' | 'later'>('later')
const paymentMethods = ['Tiền mặt', 'Chuyển khoản', 'Thẻ'] as const
type PaymentMethod = typeof paymentMethods[number]
const paymentMethod = ref<PaymentMethod>(paymentMethods[0])
// Bridge object for RemoteSearchSelect
const paymentMethodOption = ref<{ label: string, value: PaymentMethod } | null>({ label: paymentMethod.value, value: paymentMethod.value })
// Amount actually paid (when paymentStatus === 'paid')
const paymentAmount = ref<number | null>(null)
const paymentAmountDirty = ref(false)
// Payment meta
function formatDateYYYYMMDD(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
const paymentRecordDate = ref(formatDateYYYYMMDD(new Date())) // yyyy-MM-dd for <input type="date">
const paymentReference = ref('')

// Tag input (comma-separated string expected by backend, e.g. "gấp,ưu tiên")
const tagsInput = ref('')

async function fetchPaymentMethods(search: string) {
  const q = (search || '').toLowerCase()
  const items = paymentMethods.map(m => ({ label: m, value: m }))
  return q ? items.filter(i => i.label.toLowerCase().includes(q)) : items
}

// Keep primitive and object selection in sync
watch(paymentMethodOption, (opt) => {
  if (opt && opt.value !== paymentMethod.value) paymentMethod.value = opt.value
})
watch(paymentMethod, (m) => {
  if (!paymentMethodOption.value || paymentMethodOption.value.value !== m) {
    paymentMethodOption.value = { label: m, value: m }
  }
})

// Helper for formatting currency like orders/create
function currency(n: number | undefined | null) {
  if (!n) return '0₫'
  return Number(n).toLocaleString() + '₫'
}

function addProductToTransfer(item: ProductSearchItem) {
  const key = String(item.sku || item.id)
  const found = transferProducts.value.find(p => String(p.sku || p.id) === key)
  if (found) {
    found.quantity = (found.quantity || 0) + 1
    found.total = (found.quantity || 0) * (found.unitPrice || 0)
    closeProductSearch()
    return
  }
  transferProducts.value.push({
    ...item,
    quantity: 1,
    unitPrice: item.costPrice || 0,
    total: item.costPrice || 0
  })
  closeProductSearch()
}

function removeTransferProduct(idx: number) {
  transferProducts.value.splice(idx, 1)
}

function updateProductTotal(idx: number) {
  const prod = transferProducts.value[idx]
  if (!prod) return
  prod.total = prod.quantity * prod.unitPrice
}

function openProductSearch() {
  if (showProductSearch.value) return
  showProductSearch.value = true
  fetchProducts(true)
  nextTick(() => {
    document.addEventListener('mousedown', handleClickOutside)
    mainProductInputRef.value?.focus()
  })
}

function closeProductSearch() {
  showProductSearch.value = false
  document.removeEventListener('mousedown', handleClickOutside)
}

function handleClickOutside(e: MouseEvent) {
  if (!productSearchPopupRef.value) return
  if (!productSearchPopupRef.value.contains(e.target as Node)) {
    closeProductSearch()
  }
}

// Product search & pagination state (added)
const productSearchTerm = ref('')
const perPage = 15
const productPage = ref(0)
const totalProductPages = ref<number | null>(null)
const loadingMoreProducts = ref(false)
let productSearchDebounce: number | null = null

function canLoadMoreProducts() {
  if (loadingProducts.value || loadingMoreProducts.value) return false
  if (totalProductPages.value === null) return true
  return productPage.value < totalProductPages.value
}

async function fetchProducts(reset = false) {
  if (reset) {
    productList.value = []
    productPage.value = 0
    totalProductPages.value = null
  }
  const isInitial = reset || productList.value.length === 0
  if (isInitial) loadingProducts.value = true
  else loadingMoreProducts.value = true
  try {
    const res = await productService.getProducts({
      search: productSearchTerm.value.trim() || undefined,
      hasOptions: false,
      pagination: { start: productPage.value * perPage, number: perPage },
      sort: { field: 'Id', reverse: true }
    })
    const items = res?.data?.items || []
    const pages = typeof res?.data?.numberOfPages === 'number' ? res.data.numberOfPages : null
    if (pages !== null) totalProductPages.value = pages
    if (reset || isInitial) productList.value = items
    else productList.value.push(...items)
    if (items.length > 0) productPage.value += 1
  } catch {
    if (reset || isInitial) productList.value = []
  } finally {
    loadingProducts.value = false
    loadingMoreProducts.value = false
  }
}

function onProductListScroll() {
  const el = productSearchPopupRef.value
  if (!el) return
  const threshold = 120
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
    if (canLoadMoreProducts()) fetchProducts(false)
  }
}

watch(productSearchTerm, () => {
  if (!showProductSearch.value) return
  if (productSearchDebounce) window.clearTimeout(productSearchDebounce)
  productSearchDebounce = window.setTimeout(() => {
    fetchProducts(true)
  }, 350)
})

// Keep payment amount synced (similar to orders/create)
watch(paymentStatus, (s) => {
  if (s === 'paid') {
    // If not manually changed or null, sync
    if (!paymentAmountDirty.value || paymentAmount.value == null) {
      paymentAmount.value = supplierPayAmount.value
      paymentAmountDirty.value = false
    }
  } else if (s === 'later') {
    // Reset manual flag when switching away
    paymentAmountDirty.value = false
  }
})
watch(supplierPayAmount, (amt) => {
  if (paymentStatus.value === 'paid' && (!paymentAmountDirty.value || paymentAmount.value == null)) {
    paymentAmount.value = amt
  }
})

function handleF3(e: KeyboardEvent) {
  if (e.key === 'F3') {
    e.preventDefault() // Ngăn F3 mặc định của trình duyệt
    if (showProductSearch.value) {
      closeProductSearch()
    } else {
      openProductSearch()
    }
  }
}

// Discount modal state
const showDiscountModal = ref(false)
// State for import cost modal (use component)
const showImportCostModal = ref(false)
const importCostsDraft = ref<ImportCost[]>([])

function openImportCostModal() {
  showImportCostModal.value = true
}
function handleF7(e: KeyboardEvent) {
  if (e.key === 'F7') {
    e.preventDefault()
    openImportCostModal()
  }
}

function onImportCostsSaved(costs: ImportCost[]) {
  appliedImportCosts.value = costs.map(c => ({ name: c.name, value: Number(c.value) || 0 }))
  importCost.value = appliedImportCosts.value.reduce((s, c) => s + c.value, 0)
  importCostsDraft.value = appliedImportCosts.value
}

function handleF6(e: KeyboardEvent) {
  if (e.key === 'F6') {
    e.preventDefault()
    openDiscountModal()
  }
}

const discountType = ref<'amount' | 'percent'>('amount')
const discountInput = ref(0)
const discountError = ref('')

function closeDiscountModal() {
  showDiscountModal.value = false
}

function openDiscountModal() {
  showDiscountModal.value = true
}

function validateDiscount() {
  let value = Number(discountInput.value) || 0
  if (discountType.value === 'percent') {
    value = Math.round(totalAmount.value * value / 100)
  }
  if (value > totalAmount.value) {
    discountError.value = `Chiết khấu đơn không vượt quá tổng tiền ${totalAmount.value.toLocaleString()}₫`
    return false
  }
  discountError.value = ''
  return true
}

function applyDiscount() {
  if (!validateDiscount()) return
  let value = Number(discountInput.value) || 0
  if (discountType.value === 'percent') {
    value = Math.round(totalAmount.value * value / 100)
  }
  discountAmount.value = value
  closeDiscountModal()
}

watch([discountInput, discountType, totalAmount], () => {
  validateDiscount()
})

onMounted(() => {
  window.addEventListener('keydown', handleF3)
  window.addEventListener('keydown', handleF6, true)
  window.addEventListener('keydown', handleF7, true)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleF3)
  window.removeEventListener('keydown', handleF6, true)
  window.removeEventListener('keydown', handleF7, true)
})

const router = useRouter()
const baseService = new BaseService()

// Map UI payment method option to backend CashBookMethodEnum
function mapPaymentMethod(opt: { label: string, value: PaymentMethod } | null): number | null {
  if (!opt) return null
  const label = String(opt.label || '').trim()
  switch (label) {
    case 'Tiền mặt': return 1 // TienMat
    case 'Chuyển khoản': return 2 // ChuyenKhoan
    case 'Thẻ': return 3 // ViDienTu (map card to e-wallet enum)
    default: return null
  }
}

async function createAndConfirm() {
  if (!selectedSupplier.value || !selectedWarehouse.value) {
    // Basic validation
    alert('Vui lòng chọn nhà cung cấp và chi nhánh nhập trước khi tạo đơn.')
    return
  }

  // Build items payload from transferProducts
  const items = transferProducts.value.map(p => ({
    productId: p.id,
    quantity: Number(p.quantity) || 0,
    cost: Number(p.unitPrice) || 0,
    discountAmount: (p._discountType === 'amount' && typeof p._discountValue === 'number') ? p._discountValue : 0
  }))

  // Surcharges from appliedImportCosts
  const surcharges = appliedImportCosts.value.map(c => ({ name: c.name, amount: Number(c.value) || 0 }))

  const payload: Record<string, unknown> = {
    supplierId: selectedSupplier.value?.id,
    destinationWarehouseId: selectedWarehouse.value?.id,
    currency: 'VND',
    estimatedArrival: null,
    shippingCarrier: null,
    trackingNumber: null,
    referenceNumber: null,
    noteToSupplier: null,
    tags: tagsInput.value ? String(tagsInput.value) : null,
    discountAmount: Number(discountAmount.value) || 0,
    surcharges,
    paidAmount: paymentStatus.value === 'paid' ? (Number(paymentAmount.value) || 0) : 0,
    paymentMethod: mapPaymentMethod(paymentMethodOption.value),
    paymentReference: paymentReference.value || null,
    items
  }

  try {
    // Use explicit endpoint per user's API: POST /api/v1/PurchaseOrders
    const endpoint = API_ENDPOINTS.PURCHASE_ORDERS || '/PurchaseOrders'
    // NOTE: API_ENDPOINTS doesn't list PURCHASE_ORDERS by default; fallback used above
    const res = await baseService.post<Record<string, unknown>>(endpoint, payload) as ApiResponse<Record<string, unknown>>
    if (res && res.success) {
      // On success navigate to list or detail page if returned
      alert('Tạo đơn nhập hàng thành công')
      // If response contains id or code, try to navigate to detail
      const dataObj = res.data as Record<string, unknown> | undefined
      const newId = dataObj ? (dataObj['id'] ?? dataObj['purchaseOrderId'] ?? null) : null
      if (newId) {
        router.push(`/purchase-order/${newId}`)
      } else {
        router.push('/purchase-order')
      }
    } else {
      // Generic success handling if envelope differs
      alert('Tạo đơn thành công')
      router.push('/purchase-order')
    }
  } catch (err: unknown) {
    console.error('create purchase order failed', err)
    let msg = 'Tạo đơn thất bại'
    if (err && typeof err === 'object') {
      const e = err as Record<string, unknown>
      if (typeof e.message === 'string') msg = e.message
    } else if (typeof err === 'string') {
      msg = err
    }
    alert(msg)
  }
}
function saveDraft() {
  // Persist minimal draft to localStorage
  try {
    const draft = {
      products: transferProducts.value,
      supplierId: selectedSupplier.value?.id ?? null,
      warehouseId: selectedWarehouse.value?.id ?? null,
      discountAmount: discountAmount.value,
      importCosts: appliedImportCosts.value
    }
    localStorage.setItem('purchaseOrderDraft', JSON.stringify(draft))
    alert('Đã lưu nháp')
  } catch (err) {
    console.error('save draft failed', err)
    alert('Lưu nháp thất bại')
  }
}
</script>

<template>
  <UDashboardPanel id="purchase-order-panel">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <div class="flex items-center gap-3">
            <UDashboardSidebarCollapse />
            <div>
              <div class="text-lg font-semibold">
                Tạo đơn nhập hàng
              </div>
            </div>
          </div>
        </template>
        <template #right>
          <!-- Có thể thêm nút hoặc trạng thái ở đây nếu cần -->
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="w-full max-w-screen-xl mx-auto px-6 py-6">
        <div class="flex flex-col lg:flex-row gap-6">
          <ProductPriceAdjustModal
            v-if="activePriceProductIndex !== null && transferProducts[activePriceProductIndex]"
            v-model="showPriceAdjustModal"
            :current-price="transferProducts[activePriceProductIndex]?.unitPrice || 0"
            :base-price="transferProducts[activePriceProductIndex]?.originalUnitPrice || transferProducts[activePriceProductIndex]?.unitPrice || 0"
            :original-price="transferProducts[activePriceProductIndex]?.originalUnitPrice"
            :initial-discount-type="transferProducts[activePriceProductIndex]?._discountType"
            :initial-discount-value="transferProducts[activePriceProductIndex]?._discountValue || 0"
            :product-name="transferProducts[activePriceProductIndex]?.name || ''"
            @apply="applyAdjustedPrice"
          />
          <!-- Import cost modal component -->
          <AddImportCostModal
            v-model="showImportCostModal"
            :initial-costs="importCostsDraft"
            @saved="onImportCostsSaved"
          />
          <!-- Cột trái -->
          <div class="flex-1 space-y-6">
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Sản phẩm
                <template #actions>
                  <CustomCheckbox
                    v-model="splitLine"
                    class="text-sm font-normal"
                  >
                    Tách dòng
                  </CustomCheckbox>
                </template>
              </BaseCardHeader>
              <div class="flex items-center gap-2 mb-4 relative">
                <div class="flex-1">
                  <input
                    ref="mainProductInputRef"
                    v-model="productSearchTerm"
                    type="text"
                    class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Tìm theo tên, mã SKU, quét mã Barcode... (F3)"
                    @focus="openProductSearch"
                  >
                  <div
                    v-if="showProductSearch"
                    ref="productSearchPopupRef"
                    class="absolute left-0 top-full z-50 w-full bg-white rounded-lg shadow-lg mt-2 max-h-[420px] overflow-auto border border-gray-200"
                    @scroll="onProductListScroll"
                  >
                    <button
                      class="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                      @click="closeProductSearch"
                    >
                      &times;
                    </button>
                    <div class="flex items-center gap-2 mb-2 p-4 pb-0">
                      <button
                        class="flex items-center text-primary-600 text-sm font-medium hover:underline"
                        style="padding:0"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="w-5 h-5 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Thêm mới sản phẩm
                      </button>
                    </div>

                    <div
                      v-if="loadingProducts"
                      class="text-center py-8"
                    >
                      Đang tải...
                    </div>
                    <div v-else>
                      <div
                        v-if="productList.length === 0"
                        class="text-center py-8 text-gray-500"
                      >
                        Không có sản phẩm
                      </div>
                      <div v-else class="p-4 pt-2">
                        <div
                          v-for="item in productList"
                          :key="item.id"
                          class="flex items-center py-3 gap-4 cursor-pointer"
                          :style="'border-bottom: 1px solid rgb(232,234,235);' + (item === productList[productList.length-1] ? 'border-bottom: none;' : '')"
                          @click="addProductToTransfer(item)"
                        >
                          <img
                            :src="item.thumbnailImageUrl ? '/path/to/' + item.thumbnailImageUrl : '/no-image.svg'"
                            class="w-12 h-12 rounded bg-gray-100 object-cover"
                          >
                          <div class="flex-1">
                            <div class="font-medium">
                              {{ item.name }}
                            </div>
                            <div
                              v-if="item.normalizedName"
                              class="text-xs text-gray-500"
                            >
                              {{ item.normalizedName }}
                            </div>
                            <div class="text-xs text-gray-500">
                              SKU: {{ item.sku || '---' }}
                            </div>
                          </div>
                          <div class="text-right min-w-[100px]">
                            <div class="font-semibold">
                              {{ item.costPrice ? item.costPrice.toLocaleString() + '₫' : '---' }}
                            </div>
                            <div class="text-xs text-gray-500">
                              Có thể bán: <span class="text-primary-600 font-medium">{{ item.stockQuantity }}</span>
                            </div>
                          </div>
                        </div>
                        <div
                          v-if="loadingMoreProducts"
                          class="text-center py-3 text-xs text-gray-500"
                        >
                          Đang tải thêm...
                        </div>
                        <div
                          v-else-if="canLoadMoreProducts()"
                          class="text-center py-3"
                        >
                          <button
                            class="text-primary-600 text-xs font-medium hover:underline"
                            @click="fetchProducts(false)"
                          >
                            Tải thêm
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <button class="h-9 px-4 rounded-md border border-gray-300 bg-gray-50 text-sm font-medium hover:bg-gray-100">
                  Chọn nhiều
                </button>
              </div>
              <div v-if="transferProducts.length" class="-mx-4 lg:-mx-6">
                <table class="min-w-full w-full text-sm border-separate border-spacing-0">
                  <thead>
                    <tr class="bg-gray-50">
                      <th class="px-6 py-2 text-left font-semibold">
                        Sản phẩm
                      </th>
                      <th class="px-6 py-2 text-left font-semibold">
                        Số lượng
                      </th>
                      <th class="px-6 py-2 text-left font-semibold">
                        Đơn giá
                      </th>
                      <th class="px-6 py-2 text-left font-semibold">
                        Thành tiền
                      </th>
                      <th class="px-6 py-2 text-left font-semibold" />
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(prod, idx) in transferProducts"
                      :key="prod.sku || prod.id"
                    >
                      <td class="px-6 py-2">
                        <div class="flex items-center gap-2">
                          <img
                            :src="prod.thumbnailImageUrl ? '/path/to/' + prod.thumbnailImageUrl : '/no-image.svg'"
                            class="w-10 h-10 rounded bg-gray-100 object-cover"
                          >
                          <div>
                            <div class="font-medium">
                              {{ prod.name }}
                            </div>
                            <div
                              v-if="prod.normalizedName"
                              class="text-xs text-gray-500"
                            >
                              {{ prod.normalizedName }}
                            </div>
                            <div class="text-xs text-gray-500">
                              SKU: {{ prod.sku }}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-2">
                        <input
                          v-model.number="prod.quantity"
                          type="number"
                          min="1"
                          class="w-16 h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          @input="updateProductTotal(idx)"
                        >
                      </td>
                      <td class="px-6 py-2">
                        <div class="flex flex-col">
                          <button
                            type="button"
                            class="text-primary-600 font-semibold hover:underline text-left"
                            @click="openPriceAdjust(idx)"
                          >
                            {{ prod.unitPrice.toLocaleString() }}₫
                          </button>
                          <span
                            v-if="typeof prod.originalUnitPrice === 'number' && prod.originalUnitPrice !== prod.unitPrice"
                            class="text-xs text-gray-400 line-through"
                          >
                            {{ prod.originalUnitPrice.toLocaleString() }}₫
                          </span>
                        </div>
                      </td>
                      <td class="px-6 py-2">
                        <span class="font-semibold">
                          {{ (prod.quantity * prod.unitPrice).toLocaleString() }}₫
                        </span>
                      </td>
                      <td class="px-6 py-2">
                        <button
                          class="text-error hover:underline"
                          @click="removeTransferProduct(idx)"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="flex flex-col items-center justify-center py-10">
                <img src="/no-image.svg" class="w-20 h-20 mb-3 opacity-60" alt="empty">
                <div class="text-gray-500 mb-3">
                  Bạn chưa thêm sản phẩm nào
                </div>
                <button class="px-4 h-9 rounded-md bg-primary-600 text-white font-medium hover:bg-primary-700 transition" @click="openProductSearch">
                  Thêm sản phẩm
                </button>
              </div>
            </UPageCard>
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Thanh toán</BaseCardHeader>
              <div class="space-y-2 text-sm">
                <!-- Tổng tiền hàng -->
                <div class="flex items-center justify-between min-h-[28px]">
                  <span class="text-gray-600 font-medium flex items-center gap-2">
                    Tổng tiền
                    <span v-if="transferProducts.length" class="text-xs text-gray-500">{{ transferProducts.length }} sản phẩm</span>
                  </span>
                  <span class="text-gray-600 font-semibold">{{ transferProducts.length ? currency(totalAmount) : '0₫' }}</span>
                </div>

                <!-- Giảm giá -->
                <div class="flex items-center justify-between min-h-[28px]">
                  <button
                    type="button"
                    class="text-primary-600 text-left text-sm hover:underline p-0 bg-transparent"
                    @click="openDiscountModal"
                  >
                    Thêm giảm giá (F6)
                  </button>
                  <span class="text-gray-600">{{ discountAmount ? '-' + currency(discountAmount) : '---' }}</span>
                </div>

                <!-- Chi phí nhập hàng (multi-line) -->
                <div>
                  <div class="flex items-center justify-between min-h-[28px]">
                    <button
                      type="button"
                      class="text-primary-600 text-left text-sm hover:underline p-0 bg-transparent"
                      @click="openImportCostModal"
                    >
                      Chi phí nhập hàng (F7)
                    </button>
                    <span class="text-gray-600">{{ importCost ? currency(importCost) : '---' }}</span>
                  </div>
                  <template v-if="appliedImportCosts.length">
                    <div class="flex mt-1">
                      <div class="w-28 sm:w-32" />
                      <div class="relative flex-1">
                        <div class="pl-8 space-y-1">
                          <div
                            v-for="(c, idx) in appliedImportCosts"
                            :key="c.name + idx"
                            class="flex items-center justify-between min-h-[20px] text-sm"
                          >
                            <span class="text-gray-600">{{ c.name }}</span>
                            <span class="text-gray-600">{{ c.value ? currency(c.value) : '0₫' }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>
                </div>

                <!-- Thành tiền NCC phải trả -->
                <div class="flex items-center justify-between min-h-[32px] font-semibold border-t border-gray-100 pt-2">
                  <span>Tiền cần trả NCC</span>
                  <span>{{ currency(supplierPayAmount) }}</span>
                </div>

                <!-- Payment panel (mirrors orders/create) -->
                <div v-if="transferProducts.length" class="mt-3 p-4 rounded-lg bg-primary-50">
                  <div class="flex flex-col gap-2">
                    <CustomRadio v-model="paymentStatus" value="paid" label="Đã thanh toán" />
                    <div v-if="paymentStatus === 'paid'" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div>
                        <div class="text-xs text-gray-600 mb-1">
                          Hình thức thanh toán
                        </div>
                        <RemoteSearchSelect
                          v-model="paymentMethodOption"
                          :fetch-fn="fetchPaymentMethods"
                          placeholder="Chọn hình thức thanh toán"
                          :clearable="false"
                          label-field="label"
                          :searchable="false"
                          :full-width="true"
                        />
                      </div>
                      <div>
                        <div class="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Số tiền thanh toán</span>
                          <button
                            v-if="paymentAmountDirty"
                            type="button"
                            class="text-primary-600 hover:underline p-0 bg-transparent whitespace-nowrap"
                            @click="paymentAmount = supplierPayAmount; paymentAmountDirty = false"
                          >
                            Đồng bộ với thành tiền
                          </button>
                        </div>
                        <div class="relative">
                          <BaseNumberInput
                            v-model="paymentAmount"
                            :allow-decimal="false"
                            class="w-full h-9 px-3 pr-6 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-right"
                            @input="paymentAmountDirty = true"
                          />
                          <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">đ</span>
                        </div>
                      </div>
                      <div>
                        <div class="text-xs text-gray-600 mb-1">
                          Ngày ghi nhận
                        </div>
                        <input
                          v-model="paymentRecordDate"
                          type="date"
                          class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                      </div>
                      <div>
                        <div class="text-xs text-gray-600 mb-1">
                          Tham chiếu
                        </div>
                        <input
                          v-model.trim="paymentReference"
                          type="text"
                          placeholder="Nhập mã tham chiếu"
                          class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                      </div>
                    </div>
                    <CustomRadio
                      v-model="paymentStatus"
                      value="later"
                      label="Thanh toán sau"
                      class="mt-2"
                    />
                    <!-- No payment method shown for 'Thanh toán sau' per latest requirement -->
                  </div>
                </div>
              </div>
            </UPageCard>
          </div>
          <!-- Cột phải -->
          <div class="w-full lg:w-80 space-y-6">
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Nhà cung cấp</BaseCardHeader>
              <div class="-mx-6 px-6">
                <RemoteSearchSelect
                  v-model="selectedSupplier"
                  :fetch-fn="fetchSuppliersSelect"
                  :get-display-text="(supplierDisplay as any)"
                  :get-item-subtitle="(supplierSubtitle as any)"
                  label-field="name"
                  placeholder="Tìm theo tên, SDT, mã NCC...(F4)"
                  :debounce="300"
                  :clearable="true"
                  class="w-full"
                  :full-width="true"
                >
                  <template #add-action>
                    <button
                      type="button"
                      class="flex items-center w-full px-3 py-3.5 text-primary-600 font-medium text-sm hover:bg-gray-50 border-b border-gray-200 rounded-t-md"
                      style="border-bottom: 1px solid #e8eaeb;"
                      @click.stop="onAddSupplier"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-4 h-4 mr-2"
                        fill="none"
                        viewBox="0 0 20 20"
                      >
                        <path
                          d="M10 4v12m6-6H4"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                      Thêm mới nhà cung cấp
                    </button>
                  </template>
                  <template #item="{ item }">
                    <div class="flex-1">
                      <div class="font-medium text-gray-900 text-sm">
                        {{ item.name }}
                      </div>
                      <div class="text-xs text-gray-500">
                        {{ item.phone }} &middot; {{ item.slug }}
                      </div>
                    </div>
                    <svg
                      v-if="selectedSupplier && selectedSupplier.id === item.id"
                      class="w-4 h-4 text-primary-600 ml-2 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </template>
                </RemoteSearchSelect>
              </div>
            </UPageCard>
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Chi nhánh nhập</BaseCardHeader>
              <div class="-mx-6 px-6">
                <RemoteSearchSelect
                  v-model="selectedWarehouse"
                  :fetch-fn="fetchWarehousesSelect"
                  :get-display-text="(warehouseDisplay as any)"
                  :get-item-subtitle="(warehouseSubtitle as any)"
                  label-field="name"
                  placeholder="Tìm tên chi nhánh... (F5)"
                  open-key="F5"
                  :debounce="250"
                  :clearable="true"
                  :full-width="true"
                >
                  <template #item="{ item }">
                    <div class="flex-1">
                      <div class="font-medium text-gray-900 text-sm">
                        {{ item.name }}
                      </div>
                      <div
                        v-if="item.address"
                        class="text-xs text-gray-500"
                      >
                        {{ item.address }}
                      </div>
                    </div>
                    <svg
                      v-if="selectedWarehouse && selectedWarehouse.id === item.id"
                      class="w-4 h-4 text-primary-600 ml-2 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </template>
                </RemoteSearchSelect>
              </div>
            </UPageCard>
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Thông tin bổ sung</BaseCardHeader>
              <div class="-mx-6 px-6">
                <div class="mb-2">
                  <label class="block text-sm mb-1">Nhân viên phụ trách</label>
                  <select class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option>Phạm Văn Toàn</option>
                    <option>Nguyễn Văn B</option>
                  </select>
                </div>
                <div class="mb-2">
                  <label class="block text-sm mb-1">Ngày nhập dự kiến</label>
                  <input type="date" class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                </div>
                <div class="mb-2">
                  <label class="block text-sm mb-1">Mã đơn nhập</label>
                  <input type="text" class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Nhập mã đơn">
                </div>
                <div>
                  <label class="block text-sm mb-1">Tham chiếu</label>
                  <input type="text" class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Nhập mã tham chiếu">
                </div>
              </div>
            </UPageCard>
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Ghi chú</BaseCardHeader>
              <div class="-mx-6 px-6">
                <textarea
                  class="w-full px-3 py-2.5 text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  rows="2"
                  placeholder="VD: Chỉ nhận hàng trong giờ hành chính"
                />
              </div>
            </UPageCard>
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Tag
                <template #actions>
                  <a href="#" class="text-primary-600 text-sm font-medium">Danh sách tag</a>
                </template>
              </BaseCardHeader>
              <div class="-mx-6 px-6">
                <input
                  v-model.trim="tagsInput"
                  type="text"
                  class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Tìm kiếm hoặc thêm mới tag"
                >
              </div>
            </UPageCard>
          </div>
        </div>
        <!-- Replaced footer buttons -->
        <div class="flex items-center justify-end gap-4 mt-10 border-t border-transparent pt-4">
          <button
            class="h-9 px-5 rounded-md bg-white border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!transferProducts.length"
            @click="saveDraft"
          >
            Lưu nháp
          </button>
          <div class="relative inline-flex items-center">
            <button
              class="h-9 px-5 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!transferProducts.length || loadingProducts"
              @click="createAndConfirm"
            >
              Tạo đơn
            </button>
          </div>
        </div>
      </div>
      <!-- Modal giảm giá -->
      <div
        v-if="showDiscountModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
        @click="closeDiscountModal"
      >
        <div
          class="bg-white rounded-lg w-full max-w-lg p-6 relative shadow-none border-none no-shadow-modal"
          style="box-shadow:none!important; border:none!important; outline:none!important;"
          @click.stop
        >
          <div class="text-lg font-semibold mb-4">
            Thêm giảm giá
          </div>
          <div class="mb-6 flex items-center gap-4">
            <label class="text-sm font-medium min-w-[100px]">Loại giảm giá:</label>
            <div class="flex rounded-lg overflow-hidden border border-gray-200">
              <button
                :class="['px-4 py-2 text-sm font-semibold', discountType === 'amount' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700']"
                @click="discountType = 'amount'"
              >
                Giá trị
              </button>
              <button
                :class="['px-4 py-2 text-sm font-semibold', discountType === 'percent' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700']"
                @click="discountType = 'percent'"
              >
                %
              </button>
            </div>
            <div class="flex items-center gap-1 flex-1">
              <div class="relative w-full">
                <BaseNumberInput
                  v-model="discountInput"
                  :allow-decimal="false"
                  :class="['w-full h-10 px-2 pr-6 rounded border text-right focus:outline-none focus:ring-2 focus:ring-primary-500', discountError ? 'border-red-400 bg-red-50' : 'border-gray-300']"
                />
                <span
                  v-if="discountType === 'amount'"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                >
                  ₫
                </span>
                <span
                  v-else
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                >
                  %
                </span>
              </div>
            </div>
          </div>
          <div
            v-if="discountError"
            class="mb-4 p-3 rounded border border-red-300 bg-red-50 text-red-600 flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
              />
            </svg>
            <span>{{ discountError }}</span>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <UButton
              label="Hủy"
              color="primary"
              variant="soft"
              class="px-6 h-9 font-medium"
              @click="closeDiscountModal"
            />
            <UButton
              label="Thêm giảm giá"
              color="primary"
              class="px-6 h-9 font-semibold"
              :disabled="!!discountError"
              @click="applyDiscount"
            />
          </div>
          <button
            class="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
            @click="closeDiscountModal"
          >
            &times;
          </button>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<style>
.hide-number-arrow::-webkit-outer-spin-button,
.hide-number-arrow::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.hide-number-arrow[type="number"] {
  -moz-appearance: textfield;
  appearance: textfield;
}

/* Remove border and shadow ONLY for modal container */
.no-shadow-modal {
  box-shadow: none !important;
  -webkit-box-shadow: none !important;
  -moz-box-shadow: none !important;
  border: none !important;
  outline: none !important;
}

.no-shadow-modal::before,
.no-shadow-modal::after {
  box-shadow: none !important;
  border: none !important;
}
</style>
