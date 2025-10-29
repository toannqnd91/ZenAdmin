<script setup lang="ts">
import { ref, computed } from 'vue'
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

const pageIndex = ref(0)
const pageSize = ref(20)

function onSave() { /* TODO: wire API */ }
</script>

<template>
  <!-- eslint-disable vue/max-attributes-per-line, vue/html-closing-bracket-newline, vue/singleline-html-element-content-newline, vue/html-indent, vue/first-attribute-linebreak, vue/html-self-closing -->
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
          <BaseCardHeader>Danh sách sản phẩm đang bán</BaseCardHeader>
          <div class="-mx-6 px-6 pb-4">
            <div class="flex flex-wrap items-center gap-3 mb-3">
              <div class="flex-1 min-w-[240px]">
                <input type="text" class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm" placeholder="Tìm kiếm theo mã sản phẩm, tên sản phẩm, barcode" />
              </div>
              <button class="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm">Xuất file</button>
              <button class="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm">Nhập file</button>
              <button class="h-9 px-3 rounded-md bg-primary-600 text-white text-sm">Đăng bán sản phẩm</button>
            </div>

            <div class="flex flex-wrap items-center gap-3 mb-3">
              <BaseDropdownSelect :model-value="null" :options="[]" placeholder="Danh mục" class="w-[160px] h-9 px-3 rounded-md border border-gray-300 bg-white text-sm" />
              <BaseDropdownSelect :model-value="null" :options="[]" placeholder="Loại sản phẩm" class="w-[180px] h-9 px-3 rounded-md border border-gray-300 bg-white text-sm" />
              <BaseDropdownSelect :model-value="null" :options="[]" placeholder="Tag" class="w-[140px] h-9 px-3 rounded-md border border-gray-300 bg-white text-sm" />
            </div>

            <div class="overflow-x-auto">
              <table class="min-w-full w-full text-sm border-separate border-spacing-0">
                <thead>
                  <tr class="bg-gray-50">
                    <th class="pl-4 pr-2 py-2 w-10"><input type="checkbox"></th>
                    <th class="px-2 py-2 text-left font-semibold">Sản phẩm</th>
                    <th class="px-4 py-2 text-left font-semibold">Giá gốc</th>
                    <th class="px-6 py-2 text-left font-semibold">Giá sản phẩm</th>
                    <th class="pr-4 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in rows" :key="r.id" class="border-b border-gray-50">
                    <td class="pl-4 pr-2 py-3 align-top"><input type="checkbox"></td>
                    <td class="px-2 py-3 align-top">
                      <div class="flex items-start gap-3">
                        <div class="h-12 w-12 bg-gray-100 rounded md:flex hidden"></div>
                        <div>
                          <a href="#" class="text-primary-600 hover:underline">{{ r.name }}</a>
                          <div class="text-xs text-gray-500">SKU: {{ r.sku || '---' }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3 align-top text-gray-700">{{ currency(r.basePrice) }}</td>
                    <td class="px-6 py-3 align-top">
                      <div class="flex items-center gap-2">
                        <span v-if="r.lock" class="text-yellow-600" title="Khoá">
                          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M7 11V7a5 5 0 0110 0v4" />
                            <rect x="5" y="11" width="14" height="10" rx="2" />
                          </svg>
                        </span>
                        <span class="text-gray-900 font-medium">{{ currency(r.price) }}</span>
                      </div>
                    </td>
                    <td class="pr-4 py-3 align-top text-right">
                      <button class="text-gray-400 hover:text-gray-600" title="Tuỳ chọn">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M12 5v.01M12 12v.01M12 19v.01" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="flex items-center justify-between mt-3">
              <div class="text-sm text-gray-600">Từ 1 đến {{ rows.length }} trên tổng {{ rows.length }}</div>
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-2 text-sm">
                  <span>Hiển thị</span>
                  <BaseDropdownSelect :model-value="String(pageSize)" :options="[{ id: '20', label: '20' }] as any" class="w-[72px] h-8 px-3 rounded-md border border-gray-300 bg-white text-sm" />
                  <span>Kết quả</span>
                </div>
                <div class="inline-flex items-center gap-1">
                  <button class="h-8 w-8 inline-flex items-center justify-center rounded-md border border-gray-300 text-gray-500" disabled>&lt;</button>
                  <button class="h-8 w-8 inline-flex items-center justify-center rounded-md bg-primary-600 text-white">1</button>
                  <button class="h-8 w-8 inline-flex items-center justify-center rounded-md border border-gray-300 text-gray-500" disabled>&gt;</button>
                </div>
              </div>
            </div>
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
