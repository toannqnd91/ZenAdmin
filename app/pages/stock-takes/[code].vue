<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCardHeader from '@/components/BaseCardHeader.vue'

const route = useRoute()
const router = useRouter()
const codeParam = computed(() => String(route.params.code || ''))

function formatDate(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function formatMoney(v?: number | null) {
  if (v == null) return '---'
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(v)
}

interface WarehouseInfo { id: number, name: string, address?: string | null }
interface StaffInfo { id: number, name: string }
interface StockLine {
  id: number | string
  name: string
  sku?: string | null
  unit?: string | null
  barcode?: string | null
  branchStock: number
  actualStock?: number | null
  unitPrice?: number
  reason?: string | null
}
interface StockTakeDetail {
  code: string
  statusLabel: string
  createdOn: string
  branch: WarehouseInfo
  staff: StaffInfo
  note?: string | null
  tags?: string[]
  lines: StockLine[]
  history?: Array<{ time: string, actor: string, text: string }>
}

const loading = ref(false)
const detail = ref<StockTakeDetail | null>(null)

function loadMock() {
  // Mocked to match screenshot
  detail.value = {
    code: codeParam.value || 'ST00001',
    statusLabel: 'Đang kiểm kho',
    createdOn: new Date().toISOString(),
    branch: { id: 1, name: 'Cửa hàng chính' },
    staff: { id: 1, name: 'Phạm Văn Toàn' },
    note: '-----',
    tags: [],
    lines: [
      { id: 1, name: 'sản phẩm 03', sku: '---', unit: '---', barcode: '---', branchStock: 100, actualStock: null, unitPrice: 100000 },
      { id: 2, name: 'sản phẩm 002', sku: '---', unit: '---', barcode: '---', branchStock: 161, actualStock: null, unitPrice: 120000 },
      { id: 3, name: 'sản phẩm 001', sku: '---', unit: '---', barcode: '---', branchStock: 101, actualStock: null, unitPrice: 90000 }
    ],
    history: [
      { time: formatDate(new Date().toISOString()), actor: 'Phạm Văn Toàn', text: 'Cập nhật số lượng kiểm kho' },
      { time: formatDate(new Date().toISOString()), actor: 'Phạm Văn Toàn', text: 'Tạo phiếu kiểm kho' }
    ]
  }
}

onMounted(() => loadMock())

function statusPillClass(label: string) {
  switch (label) {
    case 'Đang kiểm kho':
      return 'inline-flex items-center h-6 px-2.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200'
    case 'Đã cân bằng':
      return 'inline-flex items-center h-6 px-2.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200'
    default:
      return 'inline-flex items-center h-6 px-2.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200'
  }
}

// Tabs logic
// Tất cả | Chưa kiểm | Đã kiểm | Khớp | Lệch
const activeTab = ref<'all' | 'pending' | 'checked' | 'matched' | 'diff'>('all')

const filteredLines = computed<StockLine[]>(() => {
  const q = (search.value || '').trim().toLowerCase()
  const items = (detail.value?.lines || [])
  let r = items
  switch (activeTab.value) {
    case 'pending':
      r = items.filter(it => it.actualStock == null)
      break
    case 'checked':
      r = items.filter(it => it.actualStock != null)
      break
    case 'matched':
      r = items.filter(it => it.actualStock != null && Number(it.actualStock) === Number(it.branchStock))
      break
    case 'diff':
      r = items.filter(it => it.actualStock != null && Number(it.actualStock) !== Number(it.branchStock))
      break
    default:
      r = items
  }
  if (!q) return r
  return r.filter(it => it.name.toLowerCase().includes(q) || (it.sku || '').toLowerCase().includes(q) || (it.barcode || '').toLowerCase().includes(q))
})

const counts = computed(() => {
  const items = detail.value?.lines || []
  const pending = items.filter(it => it.actualStock == null).length
  const checked = items.filter(it => it.actualStock != null).length
  const matched = items.filter(it => it.actualStock != null && Number(it.actualStock) === Number(it.branchStock)).length
  const diff = items.filter(it => it.actualStock != null && Number(it.actualStock) !== Number(it.branchStock)).length
  return { all: items.length, pending, checked, matched, diff }
})

const search = ref('')

function removeLine(id: number | string) {
  if (!detail.value) return
  detail.value.lines = detail.value.lines.filter(l => l.id !== id)
}

function updateActual(line: StockLine, val: string) {
  const n = val === '' ? null : Number(val)
  if (n == null || Number.isNaN(n)) {
    line.actualStock = null
  } else {
    line.actualStock = Math.max(0, Math.floor(n))
  }
}

function diffQty(line: StockLine) {
  const act = line.actualStock
  if (act == null) return '---'
  const d = (act || 0) - (line.branchStock || 0)
  if (d === 0) return '---'
  return d > 0 ? `+${d}` : `${d}`
}
function diffValue(line: StockLine) {
  const act = line.actualStock
  if (act == null) return '---'
  const unit = line.unitPrice || 0
  const d = (act - (line.branchStock || 0)) * unit
  if (d === 0) return '---'
  return (d > 0 ? '+' : '') + formatMoney(Math.abs(d))
}

function goBack() {
  router.push('/stock-takes')
}
</script>

<template>
  <UDashboardPanel :id="`stock-take-${codeParam}`">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <div class="flex items-center gap-3">
            <button
              class="h-8 w-8 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              @click="goBack"
            >
              <svg
                class="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div>
              <div class="flex items-center gap-3">
                <div class="text-lg font-semibold">
                  {{ detail?.code || '---' }}
                </div>
                <span v-if="detail" :class="statusPillClass(detail.statusLabel)">{{ detail.statusLabel }}</span>
              </div>
              <div v-if="detail" class="text-xs text-gray-500">
                {{ formatDate(detail.createdOn) }}
              </div>
            </div>
          </div>
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <UButton
              label="Cân bằng kho"
              color="primary"
              variant="solid"
              size="sm"
            />
            <UButton
              label="Xuất file"
              color="neutral"
              variant="soft"
              size="sm"
            />
            <UButton
              label="In biên bản"
              color="neutral"
              variant="soft"
              size="sm"
            />
            <UButton
              label="Huỷ phiếu"
              color="neutral"
              variant="soft"
              size="sm"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="loading" class="p-6 text-center text-sm text-gray-500">
        Đang tải...
      </div>
      <div v-else class="w-full max-w-screen-xl mx-auto px-4 lg:px-6 pb-24">
        <div class="flex flex-col gap-6">
          <!-- Info card -->
          <UPageCard variant="soft" class="bg-white rounded-lg">
            <BaseCardHeader>
              Thông tin phiếu
            </BaseCardHeader>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 px-6 pb-4">
              <div class="space-y-1">
                <div class="text-sm text-gray-500">
                  Chi nhánh kiểm
                </div>
                <div class="text-sm text-gray-900 font-medium">
                  {{ detail?.branch.name || '---' }}
                </div>
              </div>
              <div class="space-y-1">
                <div class="text-sm text-gray-500">
                  Ghi chú
                </div>
                <div class="text-sm text-gray-900 font-medium">
                  {{ detail?.note || '-----' }}
                </div>
              </div>
              <div class="space-y-1">
                <div class="text-sm text-gray-500">
                  Nhân viên kiểm
                </div>
                <div class="text-sm text-gray-900 font-medium">
                  {{ detail?.staff.name || '---' }}
                </div>
              </div>
              <div class="space-y-1">
                <div class="text-sm text-gray-500">
                  Tag
                </div>
                <div class="text-sm text-gray-900 font-medium">
                  {{ (detail?.tags?.length ? detail?.tags?.join(', ') : '-----') }}
                </div>
              </div>
            </div>
          </UPageCard>

          <!-- Products card with tabs -->
          <UPageCard variant="soft" class="bg-white rounded-lg">
            <BaseCardHeader>
              <div class="flex items-center gap-3 overflow-x-auto">
                <button
                  type="button"
                  :class="['h-9 px-4 rounded-md', activeTab === 'all' ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'text-gray-700 hover:bg-gray-50 border border-transparent']"
                  @click="activeTab = 'all'"
                >
                  Tất cả ({{ counts.all }})
                </button>
                <button
                  type="button"
                  :class="['h-9 px-4 rounded-md', activeTab === 'pending' ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'text-gray-700 hover:bg-gray-50 border border-transparent']"
                  @click="activeTab = 'pending'"
                >
                  Chưa kiểm ({{ counts.pending }})
                </button>
                <button
                  type="button"
                  :class="['h-9 px-4 rounded-md', activeTab === 'checked' ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'text-gray-700 hover:bg-gray-50 border border-transparent']"
                  @click="activeTab = 'checked'"
                >
                  Đã kiểm ({{ counts.checked }})
                </button>
                <button
                  type="button"
                  :class="['h-9 px-4 rounded-md', activeTab === 'matched' ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'text-gray-700 hover:bg-gray-50 border border-transparent']"
                  @click="activeTab = 'matched'"
                >
                  Khớp ({{ counts.matched }})
                </button>
                <button
                  type="button"
                  :class="['h-9 px-4 rounded-md', activeTab === 'diff' ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'text-gray-700 hover:bg-gray-50 border border-transparent']"
                  @click="activeTab = 'diff'"
                >
                  Lệch ({{ counts.diff }})
                </button>
              </div>
            </BaseCardHeader>

            <!-- Filters line -->
            <div class="flex items-center gap-3 px-6 pb-3 pt-2">
              <div class="flex-1">
                <div class="relative">
                  <input
                    v-model="search"
                    type="text"
                    class="w-full h-9 rounded-md border border-gray-300 pl-9 pr-3 text-sm"
                    placeholder="Tìm kiếm sản phẩm trong danh sách..."
                  >
                  <svg
                    class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.3-4.3" />
                  </svg>
                </div>
              </div>
              <UButton
                label="Quét mã vạch"
                color="neutral"
                variant="soft"
                size="sm"
              />
              <UButton
                label="Nhập file excel"
                color="neutral"
                variant="soft"
                size="sm"
              />
            </div>

            <!-- Table -->
            <div class="-mx-6 mt-2">
              <table class="min-w-full w-full text-sm border-separate border-spacing-0">
                <thead>
                  <tr class="bg-gray-50 text-xs text-gray-600">
                    <th class="px-6 py-2 text-left font-semibold w-[60px]">
                      STT
                    </th>
                    <th class="px-6 py-2 text-left font-semibold">
                      Sản phẩm
                    </th>
                    <th class="px-6 py-2 text-center font-semibold w-[140px]">
                      Tồn chi nhánh
                    </th>
                    <th class="px-6 py-2 text-center font-semibold w-[160px]">
                      Tồn thực tế
                    </th>
                    <th class="px-6 py-2 text-center font-semibold w-[140px]">
                      SL chênh lệch
                    </th>
                    <th class="px-6 py-2 text-center font-semibold w-[160px]">
                      Giá trị chênh lệch
                    </th>
                    <th class="px-6 py-2 text-right font-semibold w-[160px]">
                      Lý do
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <!-- Add row line -->
                  <tr class="bg-blue-50 text-blue-700">
                    <td class="px-6 py-2" />
                    <td class="px-6 py-2" colspan="6">
                      <div class="inline-flex items-center gap-2 cursor-pointer select-none">
                        <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white">+</span>
                        <span class="font-medium">Thêm sản phẩm vào phiếu kiểm</span>
                      </div>
                    </td>
                  </tr>

                  <tr v-for="(line, idx) in filteredLines" :key="line.id" class="border-t border-gray-100">
                    <td class="px-6 py-4 align-top text-gray-700">
                      {{ idx + 1 }}
                    </td>
                    <td class="px-6 py-4 align-top">
                      <div class="flex items-start gap-3">
                        <div class="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 inline-flex items-center justify-center text-gray-400">
                          <svg
                            class="w-5 h-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                          >
                            <rect
                              x="3"
                              y="3"
                              width="18"
                              height="14"
                              rx="2"
                            />
                            <path d="M3 17l4-4a3 3 0 014 0l4 4" />
                            <circle cx="9" cy="10" r="1" />
                          </svg>
                        </div>
                        <div class="min-w-0">
                          <div class="text-[13px] text-gray-900 font-medium">
                            {{ line.name }}
                          </div>
                          <div class="text-[12px] text-gray-500">
                            SKU: {{ line.sku || '---' }} | Đơn vị: {{ line.unit || '---' }}
                          </div>
                          <div class="text-[12px] text-gray-500">
                            Barcode: {{ line.barcode || '---' }}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 align-top text-center">
                      <div class="text-gray-900 font-medium">
                        {{ line.branchStock }}
                      </div>
                    </td>
                    <td class="px-6 py-4 align-top text-center">
                      <div class="inline-flex items-center">
                        <input
                          :value="line.actualStock == null ? '' : line.actualStock"
                          type="number"
                          class="h-9 w-[120px] rounded-md border border-gray-300 px-3 text-sm text-gray-900 text-right"
                          placeholder="---"
                          @input="updateActual(line, ($event.target as HTMLInputElement).value)"
                        >
                      </div>
                    </td>
                    <td class="px-6 py-4 align-top text-center">
                      <div class="text-gray-900 font-medium">
                        {{ diffQty(line) }}
                      </div>
                    </td>
                    <td class="px-6 py-4 align-top text-center">
                      <div class="text-gray-900 font-medium">
                        {{ diffValue(line) }}
                      </div>
                    </td>
                    <td class="px-6 py-4 align-top">
                      <div class="flex items-center justify-end gap-3">
                        <UButton
                          label="Chọn lý do"
                          color="neutral"
                          variant="soft"
                          size="xs"
                        />
                        <button type="button" class="text-gray-400 hover:text-red-600" @click="removeLine(line.id)">
                          <svg
                            class="w-5 h-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                          >
                            <path d="M3 6h18" />
                            <path d="M8 6v14a2 2 0 002 2h4a2 2 0 002-2V6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6l1-2h4l1 2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Footer like screenshot -->
              <div class="px-6 py-3 text-sm text-gray-600 flex items-center justify-between border-t border-gray-100">
                <div>
                  Từ {{ filteredLines.length ? 1 : 0 }} đến {{ filteredLines.length }} trên tổng {{ detail?.lines.length || 0 }}
                </div>
                <div class="flex items-center gap-3">
                  <div class="flex items-center gap-2">
                    <span>Hiển thị</span>
                    <select class="h-9 rounded-md border border-gray-300 text-sm px-2">
                      <option>20</option>
                      <option>50</option>
                      <option>100</option>
                    </select>
                  </div>
                  <div class="flex items-center gap-1">
                    <button type="button" class="w-8 h-8 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700">
                      <svg
                        class="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </button>
                    <button type="button" class="w-8 h-8 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700">
                      <svg
                        class="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </UPageCard>

          <!-- History (style referenced from purchase-order detail) -->
          <UPageCard variant="soft" class="bg-white rounded-lg">
            <BaseCardHeader>
              Lịch sử kiểm kho
            </BaseCardHeader>
            <div class="-mx-6 px-6 pb-4 text-sm">
              <div v-if="detail?.history?.length" class="space-y-3">
                <div
                  v-for="(h, idx) in detail?.history || []"
                  :key="idx"
                  class="flex items-start gap-3"
                >
                  <div class="pt-1">
                    <span class="w-2 h-2 inline-block rounded-full bg-primary-500" />
                  </div>
                  <div class="flex-1">
                    <div class="text-xs text-gray-500">
                      {{ h.time }}
                    </div>
                    <div class="text-gray-800">
                      <span class="font-medium">{{ h.actor }}</span> {{ h.text }}
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-gray-500 text-sm">
                Không có lịch sử.
              </div>
            </div>
          </UPageCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
