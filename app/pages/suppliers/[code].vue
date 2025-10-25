<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCardHeader from '@/components/BaseCardHeader.vue'
import TableEmptyState from '@/components/base/TableEmptyState.vue'
import type { ApiResponse } from '@/types/common'
import UpdateSupplierInfoModal from '@/components/suppliers/UpdateSupplierInfoModal.vue'

const route = useRoute()
const router = useRouter()
const code = computed(() => String(route.params.code || '').trim())
const skipNextRefetch = ref(false)

// API helpers
const { getEndpoint } = useApiConfig()

// View model for the page
interface SupplierDetailVM {
  id: number
  name: string
  code: string
  slug: string
  status: 'active' | 'inactive'
  phone?: string | null
  email?: string | null
  address?: string | null
  managerName?: string | null
  tags: string[]
  summary: {
    createdCount: number
    createdAmount: number
    receivedCount: number
    returnCreatedCount: number
    returnCreatedTotal: number
    returnUnrefundedCount: number
    returnUnrefundedTotal: number
    poReceivedUnpaidCount: number
    poReceivedUnpaidTotal: number
  }
}
const detail = ref<SupplierDetailVM | null>(null)

// History list view model (dual-status)
type ReceiveStatus = 'chua_nhap' | 'da_nhap'
type PaymentStatus = 'da_thanh_toan' | 'chua_thanh_toan'
type HistoryRow2 = { code: string, type: 'nhap' | 'tra', date: string, receiveStatus: ReceiveStatus, paymentStatus: PaymentStatus, amount: number }
const historyItems = ref<HistoryRow2[]>([])

// Debt table view model
type DebtRow = { code: string, type: string, reason: string, recordedAt: string, delta: number }
const recentDebts = ref<DebtRow[]>([])
const currentDebt = ref<number>(0)

// Loading / error
const loading = ref(true)
const error = ref<string | null>(null)

// Currency & date formatting
const currency = (n: number) => (n || 0).toLocaleString('vi-VN') + 'đ'
// (kept for potential future use) remove if unnecessary
const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) return ''
  const d = new Date(iso)
  const date = d.toLocaleDateString('vi-VN')
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  return `${date} ${time}`
}

const fromText = ref('')
const toText = ref('')

// API response typing (local to page)
interface SupplierDetailApiData {
  supplier: {
    id: number
    code: string
    isDeleted: boolean
    name: string
    slug: string
    phone?: string | null
    email?: string | null
    address?: string | null
    isPublished: boolean
  }
  from: string
  to: string
  summary: {
    poCreatedCount: number
    poCreatedTotal: number
    poReceivedCount: number
    poReceivedTotal: number
    poUnpaidCount: number
    poUnpaidTotal: number
    poReceivedUnpaidCount: number
    poReceivedUnpaidTotal: number
    returnCreatedCount: number
    returnCreatedTotal: number
    returnUnrefundedCount: number
    returnUnrefundedTotal: number
  }
  recentActivities: Array<{
    refType: 'PO' | 'Return'
    poId: number | null
    returnId: number | null
    code: string
    occurredOn: string
    receiveStatus: 'ChuaNhap' | 'DaNhap'
    paymentStatus: 'DaThanhToan' | 'ChuaThanhToan'
    amount: number
  }>
  currentDebt: number
  ledger: Array<{
    referenceModule: string
    referenceId: string
    code: string
    transactionType: 'NhapHang' | 'ThanhToan' | string
    reason: string
    occurredOn: string
    amount: number
    entryType: 'PO' | 'Payment' | string
  }>
  ownerUserId: number | null
  ownerUserName: string | null
  tags: string[]
}

// Fetch function
const fetchDetail = async (force = false) => {
  loading.value = true
  error.value = null
  try {
    const { data: resp, error: fetchErr } = await useApiFetch<ApiResponse<SupplierDetailApiData>>(
      () => getEndpoint(`/Supplier/by-code/${code.value}/detail${force ? `?t=${Date.now()}` : ''}`),
      { server: false }
    )

    if (fetchErr.value) throw fetchErr.value

    const response = resp.value as unknown as ApiResponse<SupplierDetailApiData>
    if (!response || !response.success) {
      throw new Error(response?.message || 'Lỗi tải chi tiết nhà cung cấp')
    }

    const d = response.data
    // Summary / header
    detail.value = {
      id: d.supplier.id,
      name: d.supplier.name,
      code: d.supplier.code,
      slug: d.supplier.slug,
      status: d.supplier.isPublished ? 'active' : 'inactive',
      phone: d.supplier.phone || null,
      email: d.supplier.email || null,
      address: d.supplier.address || null,
      managerName: d.ownerUserName || null,
      tags: d.tags || [],
      summary: {
        createdCount: d.summary.poCreatedCount,
        createdAmount: d.summary.poCreatedTotal,
        receivedCount: d.summary.poReceivedCount,
        returnCreatedCount: d.summary.returnCreatedCount,
        returnCreatedTotal: d.summary.returnCreatedTotal,
        returnUnrefundedCount: d.summary.returnUnrefundedCount,
        returnUnrefundedTotal: d.summary.returnUnrefundedTotal,
        poReceivedUnpaidCount: d.summary.poReceivedUnpaidCount,
        poReceivedUnpaidTotal: d.summary.poReceivedUnpaidTotal
      }
    }

    fromText.value = new Date(d.from).toLocaleDateString('vi-VN')
    toText.value = new Date(d.to).toLocaleDateString('vi-VN')

    // History
    historyItems.value = (d.recentActivities || []).map((a: SupplierDetailApiData['recentActivities'][number]) => ({
      code: a.code,
      type: a.refType === 'PO' ? 'nhap' : 'tra',
      date: formatDateTime(a.occurredOn),
      receiveStatus: a.receiveStatus === 'ChuaNhap' ? 'chua_nhap' : 'da_nhap',
      paymentStatus: a.paymentStatus === 'ChuaThanhToan' ? 'chua_thanh_toan' : 'da_thanh_toan',
      amount: a.amount
    }))

    // Debt
    currentDebt.value = d.currentDebt || 0
    recentDebts.value = (d.ledger || []).map((l: SupplierDetailApiData['ledger'][number]) => ({
      code: l.code,
      type: l.transactionType === 'NhapHang' ? 'Nhập hàng' : (l.transactionType === 'ThanhToan' ? 'Thanh toán' : l.transactionType),
      reason: l.reason,
      recordedAt: formatDateTime(l.occurredOn),
      delta: l.amount
    }))
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Lỗi không xác định'
  } finally {
    loading.value = false
  }
}

watchEffect(() => {
  if (code.value) {
    if (skipNextRefetch.value) {
      // Skip one auto refetch (used after local optimistic update + route replace)
      skipNextRefetch.value = false
      return
    }
    fetchDetail(false)
  }
})

function goBack() {
  router.push('/suppliers')
}

// Shared pill classes to match project style
const pillNeutralClass = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200'
const pillWarnClass = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200'

// Update supplier modal state
const showUpdateSupplier = ref(false)
const extraSupplierInfo = ref<{ country: string | null, region: string | null, ward: string | null }>({ country: 'Vietnam', region: null, ward: null })
const supplierPayload = computed(() => ({
  name: detail.value?.name || '',
  code: detail.value?.code || code.value,
  phone: detail.value?.phone ?? null,
  country: extraSupplierInfo.value.country,
  region: extraSupplierInfo.value.region,
  ward: extraSupplierInfo.value.ward,
  address: detail.value?.address ?? null,
  email: detail.value?.email ?? null,
  status: detail.value?.status ?? 'active'
}))

async function onSaveSupplier(payload: { name: string, code: string, phone?: string | null, country?: string | null, region?: string | null, ward?: string | null, address?: string | null, email?: string | null, status?: 'active' | 'inactive', taxCode?: string | null, website?: string | null, fax?: string | null }) {
  if (!detail.value) return
  const prevCode = detail.value.code
  // Optimistic update
  detail.value.name = payload.name
  detail.value.code = payload.code
  detail.value.phone = payload.phone ?? null
  detail.value.email = payload.email ?? null
  if (payload.status) detail.value.status = payload.status
  detail.value.address = payload.address ?? null
  extraSupplierInfo.value = {
    country: payload.country ?? 'Vietnam',
    region: payload.region ?? null,
    ward: payload.ward ?? null
  }
  // If code changed, update URL without refetching again (we already updated state above)
  if (payload.code && payload.code !== prevCode) {
    skipNextRefetch.value = true
    await router.replace(`/suppliers/${encodeURIComponent(payload.code)}`)
  }
}
</script>

<template>
  <!-- eslint-disable vue/max-attributes-per-line, vue/html-closing-bracket-newline, vue/singleline-html-element-content-newline, vue/html-indent, vue/first-attribute-linebreak, vue/html-self-closing -->
  <UDashboardPanel id="supplier-detail">
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
                <div class="text-lg font-semibold">
                  {{ detail?.name || code }}
                </div>
                <span
                  v-if="detail"
                  :class="detail.status === 'active'
                    ? 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200'"
                >
                  {{ detail.status === 'active' ? 'Đang hoạt động' : 'Ngưng hoạt động' }}
                </span>
              </div>
              <div v-if="detail" class="text-xs text-gray-500">
                Mã nhà cung cấp: <span class="font-medium">{{ detail.code }}</span>
              </div>
            </div>
          </div>
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <button class="h-8 px-4 rounded-md text-sm font-medium bg-error-50 text-error border border-error-200 hover:bg-error-100">Xoá</button>
            <button class="h-8 px-4 rounded-md text-sm font-medium bg-gray-200 text-gray-500 cursor-not-allowed" disabled>Lưu</button>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full max-w-6xl mx-auto px-4 lg:px-6">
        <div v-if="loading" class="py-10 text-center text-gray-500">Đang tải...</div>
        <div v-else-if="error" class="py-10 text-center text-red-600">{{ error }}</div>
        <template v-else>
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <!-- Summary card -->
            <UPageCard variant="soft" class="bg-white rounded-lg lg:col-span-2">
              <!-- Card header row: left code, right date range (static for now) -->
              <div class="flex items-center justify-between mb-3">
                <div class="text-lg font-semibold">Mã nhà cung cấp: {{ detail?.code || code }}</div>
                <button type="button" class="inline-flex items-center gap-1 text-gray-800 hover:text-gray-900">
                  <span class="font-medium">Tháng này ({{ fromText }} - {{ toText }})</span>
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                <div>
                  <div class="text-gray-500">Đơn nhập đã tạo</div>
                  <div class="text-primary-600 font-semibold">{{ detail?.summary.createdCount || 0 }} đơn</div>
                  <div class="text-xs text-gray-500">{{ currency(detail?.summary.createdAmount || 0) }}</div>
                </div>
                <div>
                  <div class="text-gray-500">Đơn đã nhập chưa thanh toán</div>
                  <div class="text-primary-600 font-semibold">{{ detail?.summary.poReceivedUnpaidCount || 0 }} đơn</div>
                  <div class="text-xs text-gray-500">{{ currency(detail?.summary.poReceivedUnpaidTotal || 0) }}</div>
                </div>
                <div>
                  <div class="text-gray-500">Đơn trả đã tạo</div>
                  <div class="text-error font-semibold">{{ detail?.summary.returnCreatedCount || 0 }} đơn</div>
                  <div class="text-xs text-gray-500">{{ currency(detail?.summary.returnCreatedTotal || 0) }}</div>
                </div>
                <div>
                  <div class="text-gray-500">Đơn trả chưa nhận hoàn tiền</div>
                  <div class="text-error font-semibold">{{ detail?.summary.returnUnrefundedCount || 0 }} đơn</div>
                  <div class="text-xs text-gray-500">{{ currency(detail?.summary.returnUnrefundedTotal || 0) }}</div>
                </div>
              </div>
            </UPageCard>
            <!-- Contact card -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Liên hệ
                <template #actions>
                  <button
                    type="button"
                    aria-label="Sửa thông tin liên hệ"
                    class="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    @click="showUpdateSupplier = true"
                  >
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                    </svg>
                  </button>
                </template>
              </BaseCardHeader>
              <div class="text-sm space-y-1">
                <div class="text-gray-500">{{ detail?.phone || 'Không có số điện thoại' }}</div>
                <div class="text-gray-500">{{ detail?.email || 'Không có email' }}</div>
                <div class="text-gray-500">{{ detail?.address || 'Không có địa chỉ' }}</div>
              </div>
            </UPageCard>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div class="lg:col-span-2 space-y-4">
              <UPageCard variant="soft" class="bg-white rounded-lg">
                <BaseCardHeader>Lịch sử nhập/trả hàng</BaseCardHeader>
                <div class="-mx-6 px-6 pb-4">
                  <div v-if="!historyItems.length">
                    <TableEmptyState title="Chưa có lịch sử" description="Không có hoạt động nào" />
                  </div>
                  <ul v-else class="divide-y divide-gray-100">
                    <li v-for="h in historyItems" :key="h.code" class="py-4 flex items-center justify-between text-sm">
                      <div class="flex items-start gap-3">
                        <div class="h-10 w-10 inline-flex items-center justify-center rounded-full bg-blue-50 text-primary-600 border border-blue-200">
                          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M7 3h10a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2V5a2 2 0 0 1 2-2z" />
                            <path d="M9 8h6M9 12h6" />
                          </svg>
                        </div>
                        <div>
                          <div class="text-gray-900">
                            Đơn {{ h.type === 'nhap' ? 'nhập' : 'trả' }}
                            <a href="#" class="text-primary-600 hover:underline">{{ h.code }}</a>
                          </div>
                          <div class="text-gray-500 text-sm">{{ h.date }}</div>
                        </div>
                      </div>
                      <div class="flex items-center gap-4">
                        <div class="flex items-center gap-2">
                          <span :class="h.receiveStatus === 'chua_nhap' ? pillWarnClass : pillNeutralClass">{{ h.receiveStatus === 'chua_nhap' ? 'Chưa nhập' : 'Đã nhập' }}</span>
                          <span :class="h.paymentStatus === 'chua_thanh_toan' ? pillWarnClass : pillNeutralClass">{{ h.paymentStatus === 'chua_thanh_toan' ? 'Chưa thanh toán' : 'Đã thanh toán' }}</span>
                        </div>
                        <div class="text-right min-w-[120px]">
                          <div class="text-gray-900 font-semibold">{{ currency(h.amount) }}</div>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </UPageCard>

              <UPageCard variant="soft" class="bg-white rounded-lg">
                <BaseCardHeader>Quản lý công nợ</BaseCardHeader>
                <div class="text-sm mb-3">
                  Công nợ hiện tại: <span class="text-emerald-600 font-medium">{{ currency(currentDebt) }}</span>
                </div>
                <div class="-mx-6">
                  <div v-if="!recentDebts.length">
                    <TableEmptyState title="Chưa có công nợ" description="Chưa ghi nhận thay đổi công nợ" />
                  </div>
                  <div v-else class="overflow-x-auto">
                    <table class="min-w-full w-full text-sm border-separate border-spacing-0">
                      <thead>
                        <tr class="bg-gray-50">
                          <th class="pl-6 pr-4 py-2 text-left font-semibold">Mã phiếu</th>
                          <th class="px-4 py-2 text-left font-semibold">Loại giao dịch</th>
                          <th class="px-4 py-2 text-left font-semibold">Lý do</th>
                          <th class="px-4 py-2 text-left font-semibold">Ngày ghi nhận</th>
                          <th class="px-4 pr-6 py-2 text-right font-semibold">Giá trị thay đổi</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="d in recentDebts" :key="d.code" class="border-b border-gray-50">
                          <td class="pl-6 pr-4 py-2"><a href="#" class="text-primary-600 hover:underline">{{ d.code }}</a></td>
                          <td class="px-4 py-2 text-left">{{ d.type }}</td>
                          <td class="px-4 py-2 text-left">{{ d.reason }}</td>
                          <td class="px-4 py-2 text-left">{{ d.recordedAt }}</td>
                          <td class="px-4 pr-6 py-2 text-right" :class="d.delta >= 0 ? 'text-emerald-600' : 'text-error'">{{ d.delta >= 0 ? '+' : '' }}{{ currency(d.delta) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </UPageCard>
            </div>

            <div class="space-y-4">
              <UPageCard variant="soft" class="bg-white rounded-lg">
                <BaseCardHeader>Nhân viên phụ trách</BaseCardHeader>
                <div class="text-sm">
                  <div class="text-gray-900">{{ detail?.managerName || 'Phạm Văn Toàn' }}</div>
                </div>
              </UPageCard>

              <UPageCard variant="soft" class="bg-white rounded-lg">
                <BaseCardHeader>
                  Tag
                  <template #actions>
                    <button type="button" class="text-primary-600 text-sm font-medium hover:underline">Danh sách tag</button>
                  </template>
                </BaseCardHeader>
                <div class="space-y-2">
                  <input type="text" class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Tìm kiếm hoặc thêm mới tag" />
                </div>
              </UPageCard>
            </div>
          </div>

          <div class="flex items-center justify-end mt-8 border-t border-transparent pt-4">
            <button class="h-8 px-4 rounded-md text-sm font-medium bg-error-50 text-error border border-error-200 hover:bg-error-100 mr-2">Xoá</button>
            <button class="h-8 px-5 rounded-md text-sm font-medium bg-gray-200 text-gray-500 cursor-not-allowed" disabled>Lưu</button>
          </div>

          <!-- Update supplier info modal (teleports to body) -->
          <UpdateSupplierInfoModal
            v-model="showUpdateSupplier"
            :value="supplierPayload"
            :supplier-id="detail?.id ?? null"
            :slug="detail?.slug ?? null"
            @save="onSaveSupplier"
          />
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
