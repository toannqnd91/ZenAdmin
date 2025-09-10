<script setup lang="ts">
// Image URL logic like ProductsTable
import { useRuntimeConfig } from '#imports'
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
// import { useRouter } from 'vue-router'
import RemoteSearchSelect from '@/components/RemoteSearchSelect.vue'
import BaseCardHeader from '~/components/BaseCardHeader.vue'
import CustomCheckbox from '@/components/CustomCheckbox.vue'
import { productService } from '@/services/product.service'
import { warehouseService } from '@/services/warehouse.service'
import { orderSourceService } from '@/services/order-source.service'
import type { OrderSourceItem } from '@/services/order-source.service'

const config = useRuntimeConfig()
const imageBaseUrl = config?.public?.imageBaseUrl || ''
function getProductImageUrl(item: { thumbnailImageUrl?: string | null }) {
  const url = item.thumbnailImageUrl
  if (!url) return '/no-image.svg'
  if (!url.includes('/') && imageBaseUrl) {
    return `${imageBaseUrl}/image/${url}`
  }
  return url
}


// Types
interface ProductSearchItem {
  id: number | string
  sku?: string
  name: string
  normalizedName?: string
  thumbnailImageUrl?: string | null
  costPrice?: number
  stockQuantity?: number
}
interface OrderProduct extends ProductSearchItem {
  quantity: number
  unitPrice: number
  total: number
}
type GenericItem = Record<string, unknown>
interface WarehouseLike {
  id?: number | string
  name?: string
  warehouseName?: string
  title?: string
  Id?: number | string
  warehouseId?: number | string
}

// State
// const router = useRouter() // currently not used
const splitLine = ref(false)
const showProductSearch = ref(false)
const productList = ref<ProductSearchItem[]>([])
const loadingProducts = ref(false)
const productSearchPopupRef = ref<HTMLElement | null>(null)
const mainProductInputRef = ref<HTMLInputElement | null>(null)
const orderProducts = ref<OrderProduct[]>([])

const selectedCustomer = ref<GenericItem | null>(null)
const selectedSource = ref<GenericItem | null>(null)
const selectedBranch = ref<GenericItem | null>(null)

// Remote fetch placeholders
async function fetchCustomers(_search: string) {
  return []
}
async function fetchSources(search: string): Promise<GenericItem[]> {
  try {
    const res = await orderSourceService.getOrderSources()
    const list: OrderSourceItem[] = Array.isArray(res?.data) ? res.data : []
    const lower = search?.toLowerCase?.() || ''
    return lower
      ? list.filter(s => s.name.toLowerCase().includes(lower) || s.code.toLowerCase().includes(lower))
      : list
  } catch {
    return []
  }
}
async function fetchBranches(search: string): Promise<GenericItem[]> {
  try {
    const res = await warehouseService.getWarehouses()
    const list = Array.isArray(res?.data) ? res.data : []
    const norm = (list as WarehouseLike[]).map((w) => {
      const id = (w.id ?? w.warehouseId ?? w.Id) as string | number
      const name = String(w.name ?? w.warehouseName ?? w.title ?? '')
      return { id, name }
    })
    const q = (search || '').toLowerCase()
    return q ? norm.filter(x => x.name.toLowerCase().includes(q)) : norm
  } catch {
    return []
  }
}

// Products
async function fetchProducts() {
  loadingProducts.value = true
  try {
    const res = await productService.getProducts({
      search: undefined,
      hasOptions: false,
      pagination: { start: 0, number: 15 },
      sort: { field: 'Id', reverse: true }
    })
    productList.value = res?.data?.items || []
  } catch {
    productList.value = []
  }
  loadingProducts.value = false
}

function addProduct(item: ProductSearchItem) {
  const key = String(item.sku || item.id)
  const found = orderProducts.value.find(p => String(p.sku || p.id) === key)
  if (found) {
    found.quantity += 1
    found.total = found.quantity * found.unitPrice
    closeProductSearch()
    return
  }
  orderProducts.value.push({
    ...item,
    quantity: 1,
    unitPrice: item.costPrice || 0,
    total: item.costPrice || 0
  })
  closeProductSearch()
}
function removeProduct(idx: number) {
  orderProducts.value.splice(idx, 1)
}
function updateProductTotal(idx: number) {
  const prod = orderProducts.value[idx]
  if (!prod) return
  if (prod.quantity < 1) prod.quantity = 1
  prod.total = prod.quantity * prod.unitPrice
}

function openProductSearch() {
  if (showProductSearch.value) return
  showProductSearch.value = true
  fetchProducts()
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
  if (!productSearchPopupRef.value.contains(e.target as Node)) closeProductSearch()
}
function handleF3(e: KeyboardEvent) {
  if (e.key !== 'F3') return
  e.preventDefault()
  if (showProductSearch.value) {
    closeProductSearch()
  } else {
    openProductSearch()
  }
}

onMounted(async () => {
  window.addEventListener('keydown', handleF3)
  // Fetch sources and set POS as default if available
  try {
    const res = await orderSourceService.getOrderSources()
    const list: OrderSourceItem[] = Array.isArray(res?.data) ? res.data : []
    if (list.length && !selectedSource.value) {
      const pos = list.find(s => s.code?.toLowerCase() === 'pos' || s.name?.toLowerCase() === 'pos')
      if (pos) selectedSource.value = { ...pos }
    }
  } catch {}
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleF3)
  document.removeEventListener('mousedown', handleClickOutside)
})

// Totals
const totalAmount = computed(() => orderProducts.value.reduce((sum, p) => sum + p.total, 0))
const discount = ref(0)
const shippingFee = ref(0)
const grandTotal = computed(() => totalAmount.value - discount.value + shippingFee.value)

function currency(n: number) {
  return n.toLocaleString() + '₫'
}

// Discount & Shipping Fee Modals (like purchase-order)
const showDiscountModal = ref(false)
const showShippingFeeModal = ref(false)
const discountType = ref<'amount' | 'percent'>('amount')
const discountInput = ref(0)
const discountError = ref('')
const shippingFeeInput = ref(0)
const shippingFeeError = ref('')

function openDiscountModal() {
  showDiscountModal.value = true
}
function closeDiscountModal() {
  showDiscountModal.value = false
}
function openShippingFeeModal() {
  showShippingFeeModal.value = true
}
function closeShippingFeeModal() {
  showShippingFeeModal.value = false
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
  discount.value = value
  closeDiscountModal()
}

function validateShippingFee() {
  const value = Number(shippingFeeInput.value) || 0
  if (value < 0) {
    shippingFeeError.value = 'Phí giao hàng không được âm'
    return false
  }
  shippingFeeError.value = ''
  return true
}
function applyShippingFee() {
  if (!validateShippingFee()) return
  shippingFee.value = Number(shippingFeeInput.value) || 0
  closeShippingFeeModal()
}

watch([discountInput, discountType, totalAmount], () => {
  validateDiscount()
})
watch([shippingFeeInput], () => {
  validateShippingFee()
})

// Actions
// Removed unused goBack()
function saveDraft() { /* TODO */ }
function createAndConfirm() { /* TODO */ }
</script>

<template>
  <UDashboardPanel id="orders-create" class="flex flex-col h-full">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <div class="flex items-center gap-3">
            <UDashboardSidebarCollapse />
            <div class="text-lg font-semibold">Tạo đơn hàng</div>
          </div>
        </template>
        <template #right>
          <!-- Có thể thêm nút/phím tắt ở đây nếu cần -->
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="w-full max-w-screen-xl mx-auto px-6 py-6">
        <div class="flex flex-col lg:flex-row gap-6">
          <!-- Left side -->
          <div class="flex-1 flex flex-col gap-6">
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Sản phẩm
                <template #actions>
                  <CustomCheckbox v-model="splitLine" class="text-sm font-normal">Tách dòng</CustomCheckbox>
                </template>
              </BaseCardHeader>
              <div class="flex items-center gap-2 mb-4 relative">
                <div class="flex-1">
                  <input
                    ref="mainProductInputRef"
                    type="text"
                    class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Tìm theo tên, mã SKU, quét mã Barcode... (F3)"
                    autocomplete="off"
                    autocorrect="off"
                    autofill="off"
                    inputmode="search"
                    name="ignore_product_search"
                    autocapitalize="off"
                    spellcheck="false"
                    aria-autocomplete="none"
                    data-lpignore="true"
                    data-form-type="other"
                    @focus="openProductSearch"
                  >
                  <div
                    v-if="showProductSearch"
                    class="absolute left-0 top-full z-50 w-full bg-white rounded-lg shadow-lg mt-2 max-h-[420px] overflow-auto border border-gray-200"
                    ref="productSearchPopupRef"
                  >
                    <button class="absolute top-2 right-2 text-gray-400 hover:text-gray-600" @click="closeProductSearch">&times;</button>
                    <div class="flex items-center gap-2 mb-2 p-4 pb-0">
                      <button class="flex items-center text-primary-600 text-sm font-medium hover:underline" style="padding:0">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                        Thêm mới sản phẩm
                      </button>
                    </div>
                    <div v-if="loadingProducts" class="text-center py-8">Đang tải...</div>
                    <div v-else>
                      <div v-if="productList.length === 0" class="text-center py-8 text-gray-500">Không có sản phẩm</div>
                      <div v-else class="p-4 pt-2">
                        <div
                          v-for="item in productList"
                          :key="item.id"
                          class="flex items-center py-3 gap-4 cursor-pointer"
                          :style="'border-bottom: 1px solid rgb(232,234,235);' + (item === productList[productList.length-1] ? 'border-bottom: none;' : '')"
                          @click="addProduct(item)"
                        >
                          <img :src="getProductImageUrl(item)" class="w-12 h-12 rounded bg-gray-100 object-cover" @error="(e) => { e.target.src = '/no-image.svg' }">
                          <div class="flex-1">
                            <div class="font-medium">{{ item.name }}</div>
                            <div v-if="item.normalizedName" class="text-xs text-gray-500">{{ item.normalizedName }}</div>
                            <div class="text-xs text-gray-500">SKU: {{ item.sku || '---' }}</div>
                          </div>
                          <div class="text-right min-w-[100px]">
                            <div class="font-semibold">{{ item.costPrice ? item.costPrice.toLocaleString() + '₫' : '---' }}</div>
                            <div class="text-xs text-gray-500">Có thể bán: <span class="text-primary-600 font-medium">{{ item.stockQuantity }}</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <button class="h-9 px-4 rounded-md border border-gray-300 bg-gray-50 text-sm font-medium hover:bg-gray-100" @click="openProductSearch">Chọn nhiều</button>
              </div>
              <div v-if="orderProducts.length" class="-mx-4 lg:-mx-6">
                <table class="min-w-full w-full text-sm border-separate border-spacing-0">
                  <thead>
                    <tr class="bg-gray-50">
                      <th class="px-6 py-2 text-left font-semibold">Sản phẩm</th>
                      <th class="px-6 py-2 text-left font-semibold">Số lượng</th>
                      <th class="px-6 py-2 text-left font-semibold">Đơn giá</th>
                      <th class="px-6 py-2 text-left font-semibold">Thành tiền</th>
                      <th class="px-6 py-2 text-left font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(prod, idx) in orderProducts" :key="prod.sku || prod.id">
                      <td class="px-6 py-2">
                        <div class="flex items-center gap-2">
                          <img :src="getProductImageUrl(prod)" class="w-10 h-10 rounded bg-gray-100 object-cover" @error="(e) => { e.target.src = '/no-image.svg' }">
                          <div>
                            <div class="font-medium">{{ prod.name }}</div>
                            <div class="text-xs text-gray-500">{{ prod.normalizedName }}</div>
                            <div class="text-xs text-gray-500">SKU: {{ prod.sku }}</div>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-2">
                        <input
                          type="number"
                          min="1"
                          v-model.number="prod.quantity"
                          class="w-16 h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          @input="updateProductTotal(idx)"
                        />
                      </td>
                      <td class="px-6 py-2">
                        <span class="text-primary-600 font-semibold">{{ prod.unitPrice.toLocaleString() }}₫</span>
                      </td>
                      <td class="px-6 py-2">
                        <span class="font-semibold">{{ (prod.quantity * prod.unitPrice).toLocaleString() }}₫</span>
                      </td>
                      <td class="px-6 py-2">
                        <button class="text-error hover:underline" @click="removeProduct(idx)">×</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="flex flex-col items-center justify-center py-10">
                <img src="/no-image.svg" class="w-20 h-20 mb-3 opacity-60" alt="empty" />
                <div class="text-gray-500 mb-3">Bạn chưa thêm sản phẩm nào</div>
                <button class="px-4 h-9 rounded-md bg-primary-600 text-white font-medium hover:bg-primary-700 transition" @click="openProductSearch">Thêm sản phẩm</button>
              </div>
            </UPageCard>
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Thanh toán</BaseCardHeader>
              <div class="space-y-2 text-sm">
                <div class="flex items-center justify-between min-h-[28px]">
                  <span class="text-gray-600 font-medium">Tổng tiền hàng</span>
                  <span class="text-gray-600">{{ orderProducts.length ? currency(totalAmount) : '---' }}</span>
                </div>
                <div class="flex items-center justify-between min-h-[28px]">
                  <button type="button" class="text-primary-600 text-left text-sm hover:underline p-0 bg-transparent" @click="openDiscountModal">Thêm giảm giá</button>
                  <span class="text-gray-600">{{ discount ? '-' + currency(discount) : '---' }}</span>
                </div>
                <div class="flex items-center justify-between min-h-[28px]">
                  <button type="button" class="text-primary-600 text-left text-sm hover:underline p-0 bg-transparent" @click="openShippingFeeModal">Thêm phí giao hàng</button>
                  <span class="text-gray-600">{{ shippingFee ? currency(shippingFee) : '---' }}</span>
                </div>
                <div class="flex items-center justify-between min-h-[32px] font-semibold border-t border-gray-100 pt-2">
                  <span>Thành tiền</span>
                  <span>{{ orderProducts.length ? currency(grandTotal) : '0₫' }}</span>
                </div>
    <!-- Modal giảm giá -->
    <div v-if="showDiscountModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30" @click="closeDiscountModal">
      <div class="bg-white rounded-lg w-full max-w-lg p-6 relative shadow-none border-none no-shadow-modal" style="box-shadow:none!important; border:none!important; outline:none!important;" @click.stop>
        <div class="text-lg font-semibold mb-4">Thêm giảm giá</div>
        <div class="mb-6 flex items-center gap-4">
          <label class="text-sm font-medium min-w-[100px]">Loại giảm giá:</label>
          <div class="flex rounded-lg overflow-hidden border border-gray-200">
            <button :class="['px-4 py-2 text-sm font-semibold', discountType === 'amount' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700']" @click="discountType = 'amount'">Giá trị</button>
            <button :class="['px-4 py-2 text-sm font-semibold', discountType === 'percent' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700']" @click="discountType = 'percent'">%</button>
          </div>
          <div class="flex items-center gap-1 flex-1">
            <div class="relative w-full">
              <input type="number" v-model.number="discountInput" :class="['w-full h-10 px-2 pr-6 rounded border text-right focus:outline-none focus:ring-2 focus:ring-primary-500', discountError ? 'border-red-400 bg-red-50' : 'border-gray-300']" />
              <span v-if="discountType === 'amount'" class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">₫</span>
              <span v-else class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">%</span>
            </div>
          </div>
        </div>
        <div v-if="discountError" class="mb-4 p-3 rounded border border-red-300 bg-red-50 text-red-600 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
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
            label="Áp dụng"
            color="primary"
            class="px-6 h-9 font-semibold"
            :disabled="!!discountError"
            @click="applyDiscount"
          />
        </div>
        <button class="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl" @click="closeDiscountModal">&times;</button>
      </div>
    </div>
    <!-- Modal phí giao hàng -->
    <div v-if="showShippingFeeModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30" @click="closeShippingFeeModal">
      <div class="bg-white rounded-lg w-full max-w-lg p-6 relative shadow-none border-none no-shadow-modal" style="box-shadow:none!important; border:none!important; outline:none!important;" @click.stop>
        <div class="text-lg font-semibold mb-4">Thêm phí giao hàng</div>
        <div class="mb-6 flex items-center gap-4">
          <label class="text-sm font-medium min-w-[100px]">Giá trị:</label>
          <div class="flex items-center gap-1 flex-1">
            <div class="relative w-full">
              <input type="number" v-model.number="shippingFeeInput" :class="['w-full h-10 px-2 pr-6 rounded border text-right focus:outline-none focus:ring-2 focus:ring-primary-500', shippingFeeError ? 'border-red-400 bg-red-50' : 'border-gray-300']" />
              <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">₫</span>
            </div>
          </div>
        </div>
        <div v-if="shippingFeeError" class="mb-4 p-3 rounded border border-red-300 bg-red-50 text-red-600 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
          <span>{{ shippingFeeError }}</span>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <UButton
            label="Hủy"
            color="primary"
            variant="soft"
            class="px-6 h-9 font-medium"
            @click="closeShippingFeeModal"
          />
          <UButton
            label="Áp dụng"
            color="primary"
            class="px-6 h-9 font-semibold"
            :disabled="!!shippingFeeError"
            @click="applyShippingFee"
          />
        </div>
        <button class="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl" @click="closeShippingFeeModal">&times;</button>
      </div>
    </div>
              </div>
            </UPageCard>
          </div>
          <!-- Right side -->
          <div class="w-full lg:w-80 space-y-6 flex-shrink-0">
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Nguồn đơn</BaseCardHeader>
              <div class="-mx-6 px-6">
                <RemoteSearchSelect
                  v-model="selectedSource"
                  :fetch-fn="fetchSources"
                  placeholder="Chọn nguồn đơn"
                  :clearable="true"
                  :debounce="300"
                  label-field="name"
                >
                  <template #trigger-left="{ value }">
                    <img
                      v-if="value && typeof value.iconUrl === 'string'"
                      :src="String(value.iconUrl)"
                      class="w-4 h-4 object-contain mr-2"
                      alt="icon"
                    >
                  </template>
                  <template #item="{ item }">
                    <div class="flex items-center gap-2 w-full">
                      <img
                        v-if="typeof item.iconUrl === 'string'"
                        :src="String(item.iconUrl)"
                        class="w-5 h-5 object-contain"
                        alt="icon"
                      >
                      <span class="text-sm text-gray-900 font-medium">{{ item.name }}</span>
                      <span v-if="item.code" class="ml-auto text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{{ item.code }}</span>
                    </div>
                  </template>
                </RemoteSearchSelect>
                <p class="mt-3 text-[11px] leading-4 text-gray-500">Nguồn đơn sẽ giúp xác định nguồn bán hàng và giúp phân loại đơn hàng hiệu quả</p>
              </div>
            </UPageCard>
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Khách hàng</BaseCardHeader>
              <div class="-mx-6 px-6">
                <RemoteSearchSelect
                  v-model="selectedCustomer"
                  :fetch-fn="fetchCustomers"
                  placeholder="Tìm theo tên, SDT...(F4)"
                  :clearable="true"
                  :debounce="300"
                  open-key="F4"
                />
              </div>
            </UPageCard>
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Ghi chú</BaseCardHeader>
              <div class="-mx-6 px-6">
                <textarea
                  rows="3"
                  class="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="VD: Nhận hàng ghi công nợ"
                ></textarea>
              </div>
            </UPageCard>
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Thông tin bổ sung</BaseCardHeader>
              <div class="-mx-6 px-6 space-y-4">
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Bán tại chi nhánh</label>
                  <RemoteSearchSelect
                    v-model="selectedBranch"
                    :fetch-fn="fetchBranches"
                    placeholder="Cửa hàng chính"
                    :clearable="true"
                    :debounce="300"
                    label-field="name"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Nhân viên phụ trách</label>
                  <select class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option>Phạm Văn Toàn</option>
                    <option>Nguyễn Văn B</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">Ngày đặt hàng <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l2 2" /></svg></label>
                  <div class="relative">
                    <input type="date" class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 7V3m8 4V3M5 11h14M5 19h14M5 15h14" /></svg>
                    </span>
                  </div>
                  <p class="text-[11px] text-gray-500 mt-1">Giá trị chỉ ghi nhận khi tạo đơn hàng</p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Ngày hẹn giao</label>
                  <div class="relative">
                    <input type="date" class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 7V3m8 4V3M5 11h14M5 19h14M5 15h14" /></svg>
                    </span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Tag</label>
                  <input
                    type="text"
                    placeholder="Tìm kiếm hoặc thêm mới tag"
                    class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <div class="text-right mt-1">
                    <a href="#" class="text-primary-600 text-xs font-medium hover:underline">Danh sách tag</a>
                  </div>
                </div>
              </div>
            </UPageCard>
          </div>
        </div>
        <!-- Footer Actions -->
        <div class="flex items-center justify-end gap-4 mt-10 border-t border-transparent pt-4">
          <button class="h-9 px-5 rounded-md bg-white border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50" @click="saveDraft">Lưu nháp</button>
          <div class="relative inline-flex items-center">
            <button class="h-9 px-5 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700" @click="createAndConfirm">Tạo đơn và xác nhận</button>
            <button class="h-9 w-9 ml-1 rounded-md bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700" aria-label="More actions">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6" /></svg>
            </button>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
 
