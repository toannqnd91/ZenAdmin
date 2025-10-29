<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseTable, { type TableColumn } from '@/components/base/BaseTable.vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCardHeader from '@/components/BaseCardHeader.vue'
import BaseDropdownSelect from '@/components/BaseDropdownSelect.vue'

const route = useRoute()
const router = useRouter()
const code = computed(() => String(route.params.code || '').trim())

function goBack() {
  router.push('/pricebooks')
}

// Form state
const name = ref('Bảng giá TEST NHÓM VIP')
type AdjustKind = 'percent-down' | 'percent-up' | 'amount-down' | 'amount-up'
const adjustKind = ref<AdjustKind>('percent-down')
const adjustValue = ref<number | ''>(10)
const autoAddNewProducts = ref(true)

const adjustOptions = [
  { id: 'percent-down', label: 'Giảm giá (%)' },
  { id: 'percent-up', label: 'Tăng giá (%)' },
  { id: 'amount-down', label: 'Giảm tiền (đ)' },
  { id: 'amount-up', label: 'Tăng tiền (đ)' }
]

const groupsSummary = ref('Đã chọn 2 nhóm khách hàng')
const selectedGroups = ref<string[]>(['Nhận quảng cáo', 'Nhóm KH Test'])

// Products mock
type Row = { id: number, name: string, sku?: string | null, basePrice: number, price: number, lock?: boolean }
const rows = ref<Row[]>([
  { id: 3, name: 'Sản phẩm 003', sku: '---', basePrice: 170000, price: 153000 },
  { id: 2, name: 'Sản phẩm 002', sku: '---', basePrice: 180000, price: 160000, lock: true },
  { id: 1, name: 'Sản phẩm 001', sku: '---', basePrice: 200000, price: 165000, lock: true }
])
const currency = (n: number) => (n || 0).toLocaleString('vi-VN') + 'đ'

// BaseTable state
const q = ref('')
const rowSelection = ref<Record<string, boolean>>({})
const pagination = ref({ pageIndex: 0, pageSize: 20 })
const loading = ref(false)
const totalRecords = computed(() => rows.value.length)
const totalPages = computed(() => 1)

// Map rows to BaseTable data; include a searchable 'product' field
const tableRows = computed(() =>
  rows.value.map(r => ({
    id: r.id,
    product: `${r.name} ${r.sku || ''}`.trim(),
    name: r.name,
    sku: r.sku,
    basePrice: r.basePrice,
    price: r.price,
    lock: r.lock
  }))
)

const columns: TableColumn[] = [
  { key: 'product', label: 'Sản phẩm', class: 'py-3 text-left font-medium' },
  { key: 'basePrice', label: 'Giá gốc', class: 'py-3 text-right font-medium', align: 'right' },
  { key: 'price', label: 'Giá sản phẩm', class: 'py-3 text-right font-medium pr-12', align: 'right' }
]

// Control column widths: widen "Giá sản phẩm" column
const colWidths = ['', '180px', '240px']

function onSave() { /* TODO: wire API */ }

// Row actions (placeholder handlers)
function onEditRow(_item: Record<string, unknown>) {
  // TODO: implement edit behavior for row
}
function onDeleteRow(_item: Record<string, unknown>) {
  // TODO: implement delete behavior for row
}
</script>

<!-- eslint-disable vue/max-attributes-per-line, vue/html-closing-bracket-newline, vue/singleline-html-element-content-newline, vue/html-indent, vue/first-attribute-linebreak, vue/html-self-closing -->
<template>
    <UDashboardPanel id="pricebook-detail" class="flex flex-col h-full">
      <template #header>
        <UDashboardNavbar>
          <template #leading>
            <div class="flex items-center gap-3">
              <button
                class="h-8 w-8 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                @click="goBack"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <div>
                <div class="flex items-center gap-3">
                  <div class="text-lg font-semibold">{{ name }}</div>
                  <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Đang áp dụng</span>
                </div>
                <div class="text-xs text-gray-500">{{ code }}</div>
              </div>
            </div>
          </template>
          <template #right>
            <div class="flex items-center gap-2">
              <button class="h-8 px-4 rounded-md text-sm font-medium bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200">Ngừng áp dụng</button>
            </div>
          </template>
        </UDashboardNavbar>
      </template>

  <template #body>
  <div class="w-full max-w-6xl mx-auto px-4 lg:px-6 py-5">
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
          <!-- Thông tin bảng giá -->
          <UPageCard variant="soft" class="bg-white rounded-lg">
            <BaseCardHeader>Thông tin bảng giá</BaseCardHeader>
            <div class="-mx-6 px-6 pb-4 space-y-4">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Tên bảng giá*</label>
                <input v-model="name" type="text" class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Bảng giá ..." />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Điều chỉnh giá*</label>
                <div class="flex items-center gap-3">
                  <BaseDropdownSelect
                    :model-value="adjustKind"
                    :options="adjustOptions as unknown as Array<{ id: string | number; label: string }>"
                    class="w-[160px] h-9 px-3 rounded-md border border-gray-300 bg-white text-sm"
                    @update:model-value="(v: any) => (adjustKind = v as AdjustKind)"
                  />
                  <input
                    v-model.number="adjustValue"
                    type="number"
                    class="w-[120px] h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0"
                  />
                </div>
                <p class="text-xs text-gray-500 mt-2">Sản phẩm được thêm vào sẽ áp dụng chính sách giảm giá <span class="font-medium">{{ adjustValue || 0 }}%</span></p>
              </div>
              <div class="pt-1">
                <label class="inline-flex items-start gap-2 select-none">
                  <input v-model="autoAddNewProducts" type="checkbox" class="mt-1">
                  <span>
                    <div class="text-sm text-gray-900">Tự động thêm sản phẩm mới vào bảng giá</div>
                    <div class="text-xs text-gray-500">Sản phẩm sau khi được tạo ở danh sách sản phẩm sẽ được tự động thêm vào bảng giá</div>
                  </span>
                </label>
              </div>
            </div>
          </UPageCard>

          <!-- Áp dụng cho nhóm khách hàng -->
          <UPageCard variant="soft" class="bg-white rounded-lg">
            <BaseCardHeader>Áp dụng cho nhóm khách hàng</BaseCardHeader>
            <div class="-mx-6 px-6 pb-4 space-y-3">
              <BaseDropdownSelect
                :model-value="'count'"
                :options="[{ id: 'count', label: groupsSummary }] as unknown as Array<{ id: string | number; label: string }>"
                class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm"
                @update:model-value="() => {}"
              />
              <div class="flex flex-wrap gap-2">
                <span v-for="g in selectedGroups" :key="g" class="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-700 border border-gray-200">
                  {{ g }}
                  <button type="button" class="ml-1 text-gray-400 hover:text-gray-600">×</button>
                </span>
              </div>
            </div>
          </UPageCard>
        </div>

        <!-- Danh sách sản phẩm -->
        <UPageCard variant="soft" class="bg-white rounded-lg mt-4">
          <div class="overflow-x-auto">
          <BaseTable
            :q="q"
            :row-selection="rowSelection"
            :pagination="pagination"
            :data="tableRows"
            :loading="loading"
            :total-records="totalRecords"
            :total-pages="totalPages"
            :columns="columns"
            :col-widths="colWidths"
            :show-row-actions="true"
            title="Danh sách sản phẩm đang bán"
            :show-filter="false"
            body-padding="px-4 lg:px-0"
            header-padding-x="px-4 lg:px-0"
            footer-padding="px-4 lg:px-0"
          >
            <template #search-actions>
              <button class="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm whitespace-nowrap" type="button">Xuất file</button>
              <button class="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm whitespace-nowrap" type="button">Nhập file</button>
              <button class="h-9 px-3 rounded-md bg-primary-600 text-white text-sm whitespace-nowrap" type="button">Đăng bán sản phẩm</button>
            </template>

            <!-- Product column -->
            <template #column-product="{ item }">
              <div class="flex items-start gap-3">
                <div class="h-11 w-11 bg-gray-100 rounded md:flex hidden" />
                <div>
                  <div class="text-[15px] text-gray-900 font-medium">{{ (item as any).name }}</div>
                  <div class="text-xs text-gray-500">SKU: {{ (item as any).sku || '---' }}</div>
                </div>
              </div>
            </template>

            <!-- Base price -->
            <template #column-basePrice="{ value }">
              <span class="block text-right text-gray-700">{{ currency(Number(value || 0)) }}</span>
            </template>

            <!-- Price with lock -->
            <template #column-price="{ item, value }">
              <div class="flex items-center gap-2 justify-end pr-12">
                <span v-if="(item as any).lock" class="text-yellow-600" title="Khoá">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                  </svg>
                </span>
                <span class="text-gray-900 font-medium">{{ currency(Number(value || 0)) }}</span>
              </div>
            </template>

            <!-- Custom row actions: Edit + Delete icons -->
            <template #row-actions="{ item: _item }">
              <div class="flex items-center justify-end gap-2">
                <button
                  class="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-gray-100"
                  title="Sửa"
                  type="button"
                  @click.stop="onEditRow(_item)"
                >
                  <svg class="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                    <path d="M14.06 4.69l3.75 3.75" />
                  </svg>
                </button>
                <button
                  class="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-gray-100"
                  title="Xoá"
                  type="button"
                  @click.stop="onDeleteRow(_item)"
                >
                  <svg class="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  </svg>
                </button>
              </div>
            </template>
          </BaseTable>
          </div>
        </UPageCard>

        <div class="flex items-center justify-end mt-6">
          <button class="h-9 px-4 rounded-md text-sm font-medium bg-error-50 text-error border border-error-200 hover:bg-error-100 mr-2">Xoá</button>
          <button class="h-9 px-5 rounded-md text-sm font-medium bg-primary-600 text-white" @click="onSave">Lưu</button>
        </div>

        <div class="text-center text-sm text-gray-500 mt-8">
          Tìm hiểu thêm về <a href="#" class="text-primary-600 hover:underline">bảng giá</a>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
