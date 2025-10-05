<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import BaseCardHeader from '@/components/BaseCardHeader.vue'
import CustomCheckbox from '@/components/CustomCheckbox.vue'
import BaseDropdownSelect from '@/components/BaseDropdownSelect.vue'
import { productService } from '@/services/product.service'
import { warehouseService, type WarehouseItem } from '@/services/warehouse.service'
import { inventoryTransfersService, type CreateInventoryTransferRequest } from '@/services/inventoryTransfers.service'

const origin = ref('')
const destination = ref('')

function handleOriginChange(val: string | number) {
  if (val === destination.value) {
    alert('Không thể chọn trùng kho xuất và kho nhập!')
    return
  }
  origin.value = val
}

function handleDestinationChange(val: string | number) {
  if (val === origin.value) {
    alert('Không thể chọn trùng kho xuất và kho nhập!')
    return
  }
  destination.value = val
}
const warehouses = ref<WarehouseItem[]>([])
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
const dateCreated = ref(new Date().toISOString().slice(0, 10))
const referenceName = ref('')
const tagsInput = ref('')
const note = ref('')
const submitting = ref(false)
const submitError = ref<string | null>(null)
const submitSuccess = ref<string | null>(null)
const tagArray = computed(() => tagsInput.value.split(/[;,\n]/).map(t => t.trim()).filter(Boolean))

const splitLine = ref(false)
const showProductSearch = ref(false)
const productList = ref<any[]>([])
// List of products added to transfer
const transferProducts = ref<any[]>([])
// Add product from popup to transfer list
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
const loadingProducts = ref(false)
const productSearchPopupRef = ref<HTMLElement | null>(null)
const mainProductInputRef = ref<HTMLInputElement | null>(null)

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
    openProductSearch()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleF3)
  fetchWarehouses()
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleF3)
})

function validateBeforeSubmit(): string[] {
  const errors: string[] = []
  if (!origin.value) errors.push('Chưa chọn kho xuất')
  if (!destination.value) errors.push('Chưa chọn kho nhập')
  if (origin.value && destination.value && origin.value === destination.value) errors.push('Kho xuất và kho nhập không được trùng')
  if (!transferProducts.value.length) errors.push('Chưa có sản phẩm trong phiếu chuyển')
  transferProducts.value.forEach((p, idx) => {
    if (!(p.productId || p.id)) errors.push(`Dòng ${idx + 1}: Thiếu productId`)
    if (!p.quantity || p.quantity <= 0) errors.push(`Dòng ${idx + 1}: Số lượng không hợp lệ`)
  })
  return errors
}

async function submitTransfer() {
  submitError.value = null
  submitSuccess.value = null
  const errors = validateBeforeSubmit()
  if (errors.length) {
    submitError.value = errors.join('\n')
    return
  }
  const body: CreateInventoryTransferRequest = {
    originWarehouseId: Number(origin.value),
    destinationWarehouseId: Number(destination.value),
    note: note.value || null,
    referenceName: referenceName.value || null,
    tags: tagArray.value,
    items: transferProducts.value.map(p => ({
      productId: p.productId || p.id,
      quantity: p.quantity
    }))
  }
  try {
    submitting.value = true
    const res = await inventoryTransfersService.createTransfer(body)
    if (res?.success) {
      submitSuccess.value = 'Tạo phiếu chuyển kho thành công'
      transferProducts.value = []
      referenceName.value = ''
      note.value = ''
      tagsInput.value = ''
    } else {
      submitError.value = 'Không tạo được phiếu: ' + (res?.message || '')
    }
  } catch (e: any) {
    submitError.value = e.message || 'Lỗi không xác định'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <!-- eslint-disable vue/max-attributes-per-line, vue/html-closing-bracket-newline, vue/singleline-html-element-content-newline, vue/html-indent, vue/first-attribute-linebreak -->
  <UDashboardPanel id="create-stock-transfer">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <div class="flex items-center gap-3">
            <UDashboardSidebarCollapse />
            <div class="text-lg font-semibold">Create transfer</div>
          </div>
        </template>
        <!-- <template #right>
          <div class="flex w-full justify-end gap-2">
            <button class="h-9 px-4 rounded-md border border-gray-300 bg-white text-sm font-medium hover:bg-gray-100 transition">Huỷ</button>
            <button class="h-9 px-4 rounded-md bg-primary-600 text-white font-medium hover:bg-primary-700 transition">Tạo phiếu</button>
          </div>
        </template> -->
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="w-full max-w-6xl mx-auto px-4 lg:px-6">
        <div class="flex flex-col lg:flex-row gap-6">
          <!-- Left column -->
          <div class="flex-1 space-y-6">
            <!-- Origin / Destination (no header) -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
                <div class="flex flex-col md:flex-row gap-4 md:gap-0">
                  <div class="flex-1 flex flex-col pr-0 md:pr-6">
                    <label class="block text-sm font-medium mb-1">Kho xuất</label>
                    <BaseDropdownSelect
                      :model-value="origin"
                      @update:model-value="handleOriginChange"
                      :options="warehouses.map(w => ({ id: w.id, label: w.name, value: w.id }))"
                      :loading="loadingWarehouses"
                      placeholder="Chọn kho xuất"
                      :multiple="false"
                      :display-value="(val) => {
                        const found = warehouses.value.find(w => w.id === val)
                        return found ? found.name : ''
                      }"
                    />
                  </div>
                  <div class="hidden md:block bg-gray-200 mx-0 my-2" style="min-width:0.5px; width:0.5px; min-height:48px"></div>
                  <div class="flex-1 flex flex-col pl-0 md:pl-6">
                    <label class="block text-sm font-medium mb-1">Kho nhập</label>
                    <BaseDropdownSelect
                      :model-value="destination"
                      @update:model-value="handleDestinationChange"
                      :options="warehouses.map(w => ({ id: w.id, label: w.name, value: w.id }))"
                      :loading="loadingWarehouses"
                      placeholder="Chọn kho nhập"
                      :multiple="false"
                      :display-value="(val) => {
                        const found = warehouses.value.find(w => w.id === val)
                        return found ? found.name : ''
                      }"
                    />
                  </div>
                </div>
            </UPageCard>

            <!-- Products (identical logic/template as purchase-order) -->
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
                    placeholder="Tìm theo tên, SKU, quét mã vạch... (F3)"
                    @focus="openProductSearch"
                  >
                  <div
                    v-if="showProductSearch"
                    class="absolute left-0 top-full z-50 w-full bg-white rounded-lg shadow-lg mt-2 max-h-[420px] overflow-auto border border-gray-200"
                    ref="productSearchPopupRef"
                  >
                    <button class="absolute top-2 right-2 text-gray-400 hover:text-gray-600" @click="closeProductSearch">&times;</button>
                    <div class="flex items-center gap-2 mb-2 p-4 pb-0">
                      <button class="flex items-center text-primary-600 text-sm font-medium hover:underline" style="padding:0" @click.stop>
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                        Thêm sản phẩm mới
                      </button>
                    </div>
                    <div v-if="loadingProducts" class="text-center py-8">Đang tải...</div>
                    <div v-else>
                      <div v-if="productList.length === 0" class="text-center py-8 text-gray-500">Không có sản phẩm</div>
                      <div v-else class="p-4 pt-2">
                        <div v-for="item in productList" :key="item.id" class="product-popup-row flex items-center py-3 gap-4 cursor-pointer" :style="'border-bottom: 1px solid rgb(232,234,235);'+(item === productList[productList.length-1] ? 'border-bottom: none;' : '')" @click="addProductToTransfer(item)">
                          <img :src="item.thumbnailImageUrl ? '/path/to/' + item.thumbnailImageUrl : '/no-image.svg'" class="w-12 h-12 rounded bg-gray-100 object-cover" />
                          <div class="flex-1">
                            <div class="font-medium">{{ item.name }}</div>
                            <div v-if="item.normalizedName" class="text-xs text-gray-500">{{ item.normalizedName }}</div>
                            <div class="text-xs text-gray-500">SKU: {{ item.sku || '---' }}</div>
                          </div>
                          <div class="text-right min-w-[100px]">
                            <div class="font-semibold">{{ item.costPrice ? item.costPrice.toLocaleString() + '₫' : '---' }}</div>
                            <div class="text-xs text-gray-500">Stock: <span class="text-primary-600 font-medium">{{ item.stockQuantity }}</span></div>
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
              <!-- Product table -->
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
                  Chưa có sản phẩm nào
                </div>
                <button class="px-4 h-9 rounded-md bg-primary-600 text-white font-medium hover:bg-primary-700 transition" @click="openProductSearch">
                  Thêm sản phẩm
                </button>
              </div>
            </UPageCard>
          </div>

          <!-- Right column -->
          <div class="w-full lg:w-80 space-y-6">
            <!-- Notes editable -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Ghi chú</BaseCardHeader>
              <div class="-mx-6 px-6 pt-2 pb-4">
                <textarea
                  v-model="note"
                  rows="3"
                  class="w-full rounded-md border border-gray-300 bg-white text-sm p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="Thêm ghi chú cho phiếu chuyển kho"
                />
              </div>
            </UPageCard>

            <!-- Transfer details -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <template #title>
                <div class="font-medium">Chi tiết chuyển kho</div>
              </template>
              <div class="-mx-6 px-6 pt-2 pb-4 space-y-4">
                <div>
                  <label class="block text-xs mb-1">Ngày tạo</label>
                  <input
                    v-model="dateCreated"
                    type="date"
                    class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label class="block text-xs mb-1">Tên tham chiếu</label>
                  <input
                    v-model="referenceName"
                    type="text"
                    class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Nhập tên tham chiếu"
                  />
                </div>
              </div>
            </UPageCard>

            <!-- Tags -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Nhãn
                <template #actions>
                  <button type="button" class="text-primary-600 text-sm font-medium hover:underline">Danh sách tag</button>
                </template>
              </BaseCardHeader>
              <div class="-mx-6 px-6 pt-2 pb-4">
                <input
                  v-model="tagsInput"
                  type="text"
                  class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Nhập tag, cách nhau bằng dấu phẩy / xuống dòng"
                >
                <div v-if="tagArray.length" class="mt-2 flex flex-wrap gap-2">
                  <span v-for="t in tagArray" :key="t" class="px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-700">{{ t }}</span>
                </div>
              </div>
            </UPageCard>
          </div>
        </div>
        <!-- Feedback + Bottom action buttons -->
        <div class="mt-8 space-y-4">
          <div v-if="submitError" class="px-4 py-3 text-sm rounded border border-red-200 bg-red-50 text-red-700 whitespace-pre-line">{{ submitError }}</div>
          <div v-if="submitSuccess" class="px-4 py-3 text-sm rounded border border-green-200 bg-green-50 text-green-700">{{ submitSuccess }}</div>
          <div class="flex justify-end gap-2">
            <button type="button" class="h-9 px-4 rounded-md border border-gray-300 bg-white text-sm font-medium hover:bg-gray-100 transition" :disabled="submitting">Huỷ</button>
            <button
              type="button"
              class="h-9 px-5 rounded-md bg-primary-600 text-white font-medium hover:bg-primary-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              :disabled="submitting"
              @click="submitTransfer"
            >
              <span v-if="!submitting">Tạo phiếu</span>
              <span v-else>Đang tạo...</span>
            </button>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
.product-popup-row:hover {
  background-image: linear-gradient(270deg, rgba(255, 255, 255, 0) 0%, #f9f8f7 25%, #f9f8f7 71%, rgba(255, 255, 255, 0) 100%);
}
</style>