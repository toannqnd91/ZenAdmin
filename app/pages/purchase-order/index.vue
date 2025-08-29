
<script setup lang="ts">


import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import BaseCardHeader from '~/components/BaseCardHeader.vue'
import { productService } from '@/services/product.service'

const splitLine = ref(false)


const showProductSearch = ref(false)
const productList = ref<any[]>([])
const loadingProducts = ref(false)
const productSearchPopupRef = ref<HTMLElement | null>(null)

function openProductSearch() {
  if (showProductSearch.value) return;
  showProductSearch.value = true
  fetchProducts()
  nextTick(() => {
    document.addEventListener('mousedown', handleClickOutside)
  })
}

function closeProductSearch() {
  showProductSearch.value = false
  document.removeEventListener('mousedown', handleClickOutside)
}

function handleClickOutside(e: MouseEvent) {
  if (!productSearchPopupRef.value) return;
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

function handleF3(e) {
  if (e.key === 'F3') {
    openProductSearch()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleF3)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleF3)
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
                          <div v-for="item in productList" :key="item.id" class="flex items-center py-3 gap-4" :style="'border-bottom: 1px solid rgb(232,234,235);' + (item === productList[productList.length-1] ? 'border-bottom: none;' : '')">
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
                <div class="flex flex-col items-center justify-center py-10">
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
                  <div class="flex justify-between">
                    <span>Tổng tiền</span>
                    <span>0₫</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Thêm giảm giá (F6)</span>
                    <span>0₫</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Chi phí nhập hàng (F7)</span>
                    <span>0₫</span>
                  </div>
                  <div class="flex justify-between font-semibold">
                    <span>Tiền cần trả NCC</span>
                    <span>0₫</span>
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
                <select class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option>Tên chi nhánh 1</option>
                  <option>Chi nhánh 2</option>
                </select>
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
    </template>
  </UDashboardPanel>
</template>
