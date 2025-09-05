<script setup lang="ts">
// Hiển thị option placeholder chỉ khi chưa chọn
const warehouseOptions = computed(() => warehouses.value.map(w => ({ id: String(w.id), label: w.name })))
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import BaseCardHeader from '~/components/BaseCardHeader.vue'
import CustomCheckbox from '@/components/CustomCheckbox.vue'
import { productService } from '@/services/product.service'
import { warehouseService, type WarehouseItem } from '@/services/warehouse.service'

const splitLine = ref(false)

const showProductSearch = ref(false)
const productList = ref<any[]>([])
const loadingProducts = ref(false)
const productSearchPopupRef = ref<HTMLElement | null>(null)
const mainProductInputRef = ref<HTMLInputElement | null>(null)


// List of products added to purchase order
const transferProducts = ref<any[]>([])

// Chi nhánh nhập động
const warehouses = ref<WarehouseItem[]>([])
const selectedWarehouseId = ref<string | null>(null)
const loadingWarehouses = ref(false)

async function fetchWarehouses() {
  loadingWarehouses.value = true
  try {
    const res = await warehouseService.getWarehouses()
    warehouses.value = Array.isArray(res?.data) ? res.data : []
  } catch {
    warehouses.value = []
  }
  loadingWarehouses.value = false
}

onMounted(() => {
  window.addEventListener('keydown', handleF3)
  fetchWarehouses()
})

// Tính toán tổng tiền, giảm giá, chi phí nhập hàng, tiền cần trả NCC
const totalAmount = computed(() => transferProducts.value.reduce((sum, prod) => sum + (prod.quantity * prod.unitPrice), 0))
const discountAmount = ref(0) // Có thể cập nhật sau
const importCost = ref(0) // Có thể cập nhật sau
const supplierPayAmount = computed(() => totalAmount.value - discountAmount.value + importCost.value)
const paymentStatus = ref<'paid' | 'unpaid'>('unpaid')

function addProductToTransfer(item: any) {
  const key = String(item.sku || item.id)
  const found = transferProducts.value.find(p => String(p.sku || p.id) === key)
  if (found) {
    found.quantity += 1
    found.total = found.quantity * found.unitPrice
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
  if (!productSearchPopupRef.value.contains(e.target as Node)) {
    closeProductSearch()
  }
}

async function fetchProducts() {
  loadingProducts.value = true
  try {
    const res = await productService.getProducts({
      search: null,
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

function handleF3(e: KeyboardEvent) {
  if (e.key === 'F3') {
    e.preventDefault(); // Ngăn F3 mặc định của trình duyệt
    if (showProductSearch.value) {
      closeProductSearch();
    } else {
      openProductSearch();
    }
  }
}

const discountModalRef = ref()
const showDiscountModal = ref(false)

function handleF6(e: KeyboardEvent) {
  if (e.key === 'F6') {
    e.preventDefault()
    showDiscountModal.value = true
  }
}

const discountType = ref<'amount' | 'percent'>('amount')
const discountInput = ref(0)
const discountError = ref('')

function closeDiscountModal() {
  showDiscountModal.value = false
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

// Watch input và type để validate realtime
watch([discountInput, discountType, totalAmount], () => {
  validateDiscount()
})

onMounted(() => {
  window.addEventListener('keydown', handleF3)
  window.addEventListener('keydown', handleF6, true)
  fetchWarehouses()
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleF3)
  window.removeEventListener('keydown', handleF6, true)
})
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
      <div class="w-full max-w-6xl mx-auto px-4 lg:px-6">
        <div class="flex flex-col lg:flex-row gap-6">
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
                      type="text"
                      class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Tìm theo tên, mã SKU, quét mã Barcode... (F3)"
                      @focus="openProductSearch"
                    />
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
                          <div v-for="item in productList" :key="item.id" class="flex items-center py-3 gap-4 cursor-pointer" :style="'border-bottom: 1px solid rgb(232,234,235);' + (item === productList[productList.length-1] ? 'border-bottom: none;' : '')" @click="addProductToTransfer(item)">
                            <img :src="item.thumbnailImageUrl ? '/path/to/' + item.thumbnailImageUrl : '/no-image.svg'" class="w-12 h-12 rounded bg-gray-100 object-cover" />
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
                  <button class="h-9 px-4 rounded-md border border-gray-300 bg-gray-50 text-sm font-medium hover:bg-gray-100">
                    Chọn nhiều
                  </button>
                </div>
                <div v-if="transferProducts.length" class="-mx-4 lg:-mx-6">
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
                      <tr v-for="(prod, idx) in transferProducts" :key="prod.sku || prod.id">
                        <td class="px-6 py-2">
                          <div class="flex items-center gap-2">
                            <img :src="prod.thumbnailImageUrl ? '/path/to/' + prod.thumbnailImageUrl : '/no-image.svg'" class="w-10 h-10 rounded bg-gray-100 object-cover" />
                            <div>
                              <div class="font-medium">{{ prod.name }}</div>
                              <div class="text-xs text-gray-500">{{ prod.normalizedName }}</div>
                              <div class="text-xs text-gray-500">SKU: {{ prod.sku }}</div>
                            </div>
                          </div>
                        </td>
                        <td class="px-6 py-2">
                          <input type="number" min="1" v-model.number="prod.quantity" class="w-16 h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" @input="updateProductTotal(idx)" />
                        </td>
                        <td class="px-6 py-2">
                          <span class="text-primary-600 font-semibold">{{ prod.unitPrice.toLocaleString() }}₫</span>
                        </td>
                        <td class="px-6 py-2">
                          <span class="font-semibold">{{ (prod.quantity * prod.unitPrice).toLocaleString() }}₫</span>
                        </td>
                        <td class="px-6 py-2">
                          <button class="text-error hover:underline" @click="removeTransferProduct(idx)">×</button>
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
                <div class="grid grid-cols-12 items-center">
                  <span class="font-medium col-span-3">Tổng tiền</span>
                  <span class="text-gray-500 col-span-3 text-right">{{ transferProducts.length }} sản phẩm</span>
                  <span class="col-span-3 text-gray-500 text-right"> </span>
                  <span class="font-semibold col-span-3 text-right min-w-[90px]">{{ totalAmount.toLocaleString() }}₫</span>
                </div>
                <div class="grid grid-cols-12 items-center">
                  <button type="button" class="text-primary-600 hover:underline focus:outline-none p-0 bg-transparent border-0 col-span-3 text-left" @click="showDiscountModal = true">Thêm giảm giá (F6)</button>
                  <span class="col-span-3 text-gray-500 text-right">-------</span>
                  <span class="col-span-3 text-gray-500 text-right"> </span>
                  <span class="col-span-3 text-right min-w-[60px]">{{ discountAmount.toLocaleString() }}₫</span>
                </div>
                <div class="grid grid-cols-12 items-center">
                  <button type="button" class="text-primary-600 hover:underline focus:outline-none p-0 bg-transparent border-0 col-span-3 text-left">Chi phí nhập hàng (F7)</button>
                  <span class="col-span-3 text-gray-500 text-right">-------</span>
                  <span class="col-span-3 text-gray-500 text-right"> </span>
                  <span class="col-span-3 text-right min-w-[60px]">0₫</span>
                </div>
                <div class="grid grid-cols-12 items-center font-semibold">
                  <span class="col-span-9">Tiền cần trả NCC</span>
                  <span class="col-span-3 text-right min-w-[90px]">{{ supplierPayAmount.toLocaleString() }}₫</span>
                </div>
                <div class="mt-4 rounded-lg bg-blue-50 p-4">
                  <div class="flex flex-col gap-2">
                    <label class="inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" v-model="paymentStatus" value="paid" class="form-radio text-primary-600" />
                      <span>Đã thanh toán</span>
                    </label>
                    <label class="inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" v-model="paymentStatus" value="unpaid" class="form-radio text-primary-600" />
                      <span>Thanh toán sau</span>
                    </label>
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
                <input
                  type="text"
                  class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Tìm theo tên, SDT, mã NCC...(F4)"
                >
              </div>
            </UPageCard>
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Chi nhánh nhập</BaseCardHeader>
              <div class="-mx-6 px-6">
                <BaseDropdownSelect
                  v-model="selectedWarehouseId"
                  :options="warehouseOptions"
                  :loading="loadingWarehouses"
                  placeholder="Vui lòng chọn chi nhánh"
                  :searchable="false"
                  :clearable="false"
                  :multiple="false"
                  option-label="label"
                  option-value="id"
                  class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  :disabled="loadingWarehouses"
                />
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
                  type="text"
                  class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Tìm kiếm hoặc thêm mới tag"
                >
              </div>
            </UPageCard>
          </div>
        </div>
        <div class="flex justify-end mt-8 mb-8">
          <UButton
            label="Tạo đơn nhập hàng"
            color="primary"
            size="lg"
            class="px-8 py-2 text-lg font-semibold rounded-md shadow"
          />
        </div>  
      </div>
      <!-- Modal giảm giá custom -->
      <div v-if="showDiscountModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
  <div class="bg-white rounded-lg w-full max-w-lg p-6 relative" style="box-shadow:none!important; border:none!important; outline:none!important;">
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
            <button class="px-6 h-10 rounded-md border border-primary-600 text-primary-600 font-medium bg-white hover:bg-gray-50" @click="closeDiscountModal">Hủy</button>
            <button class="px-6 h-10 rounded-md bg-primary-600 text-white font-semibold hover:bg-primary-700" :disabled="!!discountError" @click="applyDiscount">Thêm giảm giá</button>
          </div>
          <button class="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl" @click="closeDiscountModal">&times;</button>
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
}
</style>
