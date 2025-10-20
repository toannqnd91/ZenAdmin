<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BaseCardHeader from '@/components/BaseCardHeader.vue'
import IconInvoicePending from '@/components/icons/IconInvoicePending.vue'

const route = useRoute()
const router = useRouter()

const code = computed(() => String(route.params.code || ''))

interface DetailItem {
  id: number | string
  name: string
  sku?: string | null
  normalizedName?: string | null
  qty: number
  unitPrice: number
  total: number
  image?: string | null
}

interface PurchaseOrderDetail {
  code: string
  createdOn: string
  statusLabel: string
  supplier: {
    name: string
    slug?: string | null
    phone?: string | null
    email?: string | null
    address?: string | null
  }
  warehouseName: string
  assignee: string
  expectedDate?: string | null
  reference?: string | null
  note?: string | null
  tags?: string[]
  items: DetailItem[]
  totals: {
    subtotal: number
    discount: number
    importCost: number
    needToPay: number
    paid: number
  }
  history: Array<{ time: string, actor: string, text: string }>
}

const detail = ref<PurchaseOrderDetail | null>(null)

function formatDate(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yy} ${hh}:${mi}`
}

function currency(n: number | undefined | null) {
  if (!n) return '0₫'
  return Number(n).toLocaleString() + '₫'
}

function statusPillClass(label: string) {
  const key = (label || '').toLowerCase()
  if (key.includes('đang') || key.includes('processing')) {
    return 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200'
  }
  if (key.includes('hoàn thành') || key.includes('complete')) {
    return 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200'
  }
  return 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200'
}

function loadDetail() {
  // Placeholder data – wire to API when available
  const now = new Date()
  detail.value = {
    code: code.value,
    createdOn: now.toISOString(),
    statusLabel: 'Đang giao dịch',
    supplier: {
      name: 'ncc 01',
      phone: null,
      email: null,
      address: null,
      slug: 'ncc-01'
    },
    warehouseName: 'Cửa hàng chính',
    assignee: 'Phạm Văn Toàn',
    expectedDate: null,
    reference: null,
    note: '',
    tags: [],
    items: [
      { id: 1, name: 'sản phẩm 03', qty: 100, unitPrice: 100000, total: 10000000, image: null }
    ],
    totals: {
      subtotal: 10000000,
      discount: 0,
      importCost: 0,
      needToPay: 10000000,
      paid: 10000000
    },
    history: [
      { time: formatDate(now.toISOString()), actor: 'Phạm Văn Toàn', text: 'Thanh toán cho đơn nhập hàng' },
      { time: formatDate(now.toISOString()), actor: 'Phạm Văn Toàn', text: 'Thêm mới đơn nhập hàng' }
    ]
  }
}

onMounted(loadDetail)

function goBack() {
  router.push('/purchase-order')
}
</script>

<template>
  <UDashboardPanel id="purchase-order-detail">
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
              label="Sửa đơn"
              color="neutral"
              variant="soft"
              size="sm"
            />
            <UButton
              label="In đơn"
              color="neutral"
              variant="soft"
              size="sm"
            />
            <UButton
              label="Thao tác khác"
              color="neutral"
              variant="soft"
              size="sm"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="w-full max-w-screen-xl mx-auto px-6 py-6">
        <div class="flex flex-col lg:flex-row gap-6">
          <!-- Left column -->
          <div class="flex-1 space-y-6">
            <!-- Not yet received -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                <span class="inline-flex items-center gap-2">
                  <IconInvoicePending class="w-5 h-5" />
                  <span>Chưa nhập kho</span>
                </span>
              </BaseCardHeader>
              <div class="-mx-6 mt-2">
                <table class="min-w-full w-full text-sm border-separate border-spacing-0">
                  <thead>
                    <tr class="bg-gray-50">
                      <th class="px-6 py-2 text-left font-semibold">
                        Sản phẩm
                      </th>
                      <th class="px-6 py-2 text-right font-semibold">
                        Số lượng
                      </th>
                      <th class="px-6 py-2 text-right font-semibold">
                        Đơn giá
                      </th>
                      <th class="px-6 py-2 text-right font-semibold">
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="it in detail?.items || []" :key="it.id">
                      <td class="px-6 py-2">
                        <div class="flex items-center gap-2">
                          <div class="w-10 h-10 rounded bg-gray-100 inline-flex items-center justify-center text-gray-400">
                            —
                          </div>
                          <div>
                            <button type="button" class="text-primary-600 font-medium hover:underline text-left">
                              {{ it.name }}
                            </button>
                            <div v-if="it.normalizedName" class="text-xs text-gray-500">
                              {{ it.normalizedName }}
                            </div>
                            <div class="text-xs text-gray-500">
                              SKU: {{ it.sku || '---' }}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-2 text-right whitespace-nowrap tabular-nums">
                        {{ it.qty }}
                      </td>
                      <td class="px-6 py-2 text-right whitespace-nowrap tabular-nums">
                        {{ currency(it.unitPrice) }}
                      </td>
                      <td class="px-6 py-2 text-right whitespace-nowrap tabular-nums">
                        <span class="font-semibold">{{ currency(it.total) }}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="pb-4 flex justify-end">
                <UButton label="Nhập kho" color="primary" />
              </div>
            </UPageCard>

            <!-- Payment summary -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Đã thanh toán</BaseCardHeader>
              <div class="-mx-6 px-6 pb-4 space-y-2 text-sm">
                <div class="flex items-center justify-between min-h-[28px]">
                  <span class="text-gray-600">Tổng tiền <span class="text-xs text-gray-500">{{ (detail?.items.length || 0) }} sản phẩm</span></span>
                  <span class="text-gray-900 font-semibold">{{ currency(detail?.totals.subtotal || 0) }}</span>
                </div>
                <div class="flex items-center justify-between min-h-[28px]">
                  <span class="text-gray-600">Giảm giá</span>
                  <span class="text-gray-900">{{ detail?.totals.discount ? currency(detail?.totals.discount) : '0₫' }}</span>
                </div>
                <div class="flex items-center justify-between min-h-[28px]">
                  <span class="text-gray-600">Chi phí nhập hàng</span>
                  <span class="text-gray-900">{{ detail?.totals.importCost ? currency(detail?.totals.importCost) : '0₫' }}</span>
                </div>
                <div class="flex items-center justify-between min-h-[32px] font-semibold border-t border-gray-100 pt-2">
                  <span>Cần trả NCC</span>
                  <span>{{ currency(detail?.totals.needToPay || 0) }}</span>
                </div>

                <!-- Progress strip -->
                <div class="mt-3">
                  <div class="w-full rounded-md overflow-hidden border-gray-200 bg-gray-50">
                    <div class="flex text-xs">
                      <div class="px-3 py-2 bg-gray-100 text-gray-700 flex-1">
                        Tiền cần trả NCC: <span class="font-medium">{{ currency(detail?.totals.needToPay || 0) }}</span>
                      </div>
                      <div class="px-3 py-2 bg-primary-50 text-primary-700">
                        Đã trả: <span class="font-medium">{{ currency(detail?.totals.paid || 0) }}</span>
                      </div>
                      <div class="px-3 py-2 bg-rose-50 text-rose-700">
                        Còn phải trả: <span class="font-medium">{{ currency((detail?.totals.needToPay || 0) - (detail?.totals.paid || 0)) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </UPageCard>

            <!-- History -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Lịch sử đơn nhập hàng</BaseCardHeader>
              <div class="-mx-6 px-6 pb-4 text-sm">
                <div class="space-y-3">
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
              </div>
            </UPageCard>
          </div>

          <!-- Right column -->
          <div class="w-full lg:w-80 space-y-6">
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Nhà cung cấp</BaseCardHeader>
              <div class="-mx-6 px-6 pb-4">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-full bg-primary-100 text-primary-700 inline-flex items-center justify-center font-semibold">
                    {{ (detail?.supplier.name || 'N')[0] }}
                  </div>
                  <div class="flex-1">
                    <div class="font-medium">
                      {{ detail?.supplier.name }}
                    </div>
                    <div class="text-xs text-gray-500 space-y-0.5">
                      <div>Không có email</div>
                      <div>Không có số điện thoại</div>
                      <div>Không có địa chỉ</div>
                    </div>
                  </div>
                </div>
              </div>
            </UPageCard>

            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Thông tin bổ sung</BaseCardHeader>
              <div class="-mx-6 px-6 space-y-4">
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Nhập tại chi nhánh</label>
                  <select class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option selected>
                      {{ detail?.warehouseName || 'Cửa hàng chính' }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Nhân viên phụ trách</label>
                  <input
                    type="text"
                    class="w-full h-9 px-3 rounded-md border border-gray-300 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    :value="detail?.assignee"
                    readonly
                  >
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Ngày nhập dự kiến</label>
                  <input
                    type="text"
                    class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="dd/MM/yyyy"
                    readonly
                  >
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Tham chiếu</label>
                  <input type="text" class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Nhập mã tham chiếu">
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Tag</label>
                  <input
                    type="text"
                    placeholder="Tìm kiếm hoặc thêm mới tag"
                    class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                  <div class="text-right mt-1">
                    <a href="#" class="text-primary-600 text-xs font-medium hover:underline">Danh sách tag</a>
                  </div>
                </div>
              </div>
            </UPageCard>

            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Ghi chú</BaseCardHeader>
              <div class="-mx-6 px-6 pb-4">
                <textarea
                  rows="3"
                  class="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="VD: Nhận hàng ghi công nợ"
                />
              </div>
            </UPageCard>
          </div>
        </div>

        <div class="flex items-center justify-end mt-10 border-t border-transparent pt-4">
          <button class="h-9 px-5 rounded-md bg-gray-200 text-gray-500 text-sm font-medium cursor-not-allowed" disabled>
            Lưu
          </button>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
