<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import BaseCardHeader from '@/components/BaseCardHeader.vue'
import CustomCheckbox from '@/components/CustomCheckbox.vue'
import BaseDropdownSelect from '@/components/BaseDropdownSelect.vue'
import { productService } from '@/services/product.service'

const origin = ref('')
const destination = ref('')
const dateCreated = ref(new Date().toISOString().slice(0, 10))
const referenceName = ref('')
const tags = ref('')

const splitLine = ref(false)
const showProductSearch = ref(false)
const productList = ref<any[]>([])
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
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleF3)
})
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
                    <BaseDropdownSelect v-model="origin" placeholder="Chọn kho xuất" />
                  </div>
                  <div class="hidden md:block bg-gray-200 mx-0 my-2" style="min-width:0.5px; width:0.5px; min-height:48px"></div>
                  <div class="flex-1 flex flex-col pl-0 md:pl-6">
                    <label class="block text-sm font-medium mb-1">Kho nhập</label>
                    <BaseDropdownSelect v-model="destination" placeholder="Chọn kho nhập" />
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
                      <button class="flex items-center text-primary-600 text-sm font-medium hover:underline" style="padding:0">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                        Thêm sản phẩm mới
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
              <div class="flex flex-col items-center justify-center py-10">
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
            <!-- Notes -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <template #title>
                <div class="flex items-center justify-between w-full">
                  <span class="font-medium">Ghi chú</span>
                  <UButton icon="i-lucide-pencil" variant="ghost" size="xs" />
                </div>
              </template>
              <div class="-mx-6 px-6 pt-2 pb-4">
                <p class="text-sm text-gray-500">Chưa có ghi chú</p>
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
                  <UInput v-model="dateCreated" type="date" class="w-full" />
                </div>
                <div>
                  <label class="block text-xs mb-1">Tên tham chiếu</label>
                  <UInput v-model="referenceName" class="w-full" />
                </div>
              </div>
            </UPageCard>

            <!-- Tags (giống purchase-order) -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Nhãn
                <template #actions>
                  <a href="#" class="text-primary-600 text-sm font-medium">Danh sách tag</a>
                </template>
              </BaseCardHeader>
              <div class="-mx-6 px-6">
                <input
                  v-model="tags"
                  type="text"
                  class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Tìm kiếm hoặc thêm mới tag"
                >
              </div>
            </UPageCard>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
