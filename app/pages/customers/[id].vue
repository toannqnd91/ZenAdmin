<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed, ref, onMounted } from 'vue'
import BaseCardHeader from '~/components/BaseCardHeader.vue'
import RemoteSearchSelect from '@/components/RemoteSearchSelect.vue'
import { customersService } from '@/services/customers.service'
import ReceivePaymentModal from '@/components/orders/ReceivePaymentModal.vue'
import BaseTable, { type TableColumn } from '@/components/base/BaseTable.vue'

const route = useRoute()
const router = useRouter()

// id is string per request
const customerId = computed(() => String(route.params.id || ''))

if (!customerId.value) {
  // If no id, go back to customers list
  router.replace('/customers')
}

// Status display types
type UiPaymentStatus = 'Đã thanh toán' | 'Thanh toán một phần' | 'Chưa thanh toán'
type UiProcessStatus = 'Đã xử lý' | 'Đang xử lý' | 'Đã hủy'

// Backend enum reference (numeric order status)
const ORDER_STATUS_MAP: Record<number, UiProcessStatus> = {
  1: 'Đang xử lý', // New
  10: 'Đang xử lý', // OnHold
  20: 'Đang xử lý', // PendingPayment
  30: 'Đang xử lý', // PaymentReceived
  35: 'Đang xử lý', // PaymentFailed
  40: 'Đang xử lý', // Invoiced
  50: 'Đang xử lý', // Shipping
  60: 'Đang xử lý', // Shipped
  70: 'Đã xử lý', // Complete
  80: 'Đã hủy', // Canceled
  90: 'Đã hủy', // Refunded (treat as canceled for now)
  100: 'Đã xử lý' // Closed
}

function mapPaymentStatus(apiStatus: string | null | undefined, paidAmount: number, total: number): UiPaymentStatus {
  const status = (apiStatus || '').toLowerCase()
  if (status === 'paid' || (paidAmount >= total && total > 0)) return 'Đã thanh toán'
  if (status === 'partiallypaid' || paidAmount > 0) return 'Thanh toán một phần'
  return 'Chưa thanh toán'
}

function mapProcessStatusFromCode(code: number | null | undefined, text: string | null | undefined): UiProcessStatus {
  if (code != null && ORDER_STATUS_MAP[code]) return ORDER_STATUS_MAP[code]
  // fallback to text heuristics
  const t = (text || '').toLowerCase()
  if (t.includes('cancel')) return 'Đã hủy'
  if (t.includes('complete') || t.includes('close')) return 'Đã xử lý'
  return 'Đang xử lý'
}

function initialsFromName(name: string) {
  const parts = (name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return 'CU'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function mapGender(genderCode: string | null): string {
  if (genderCode === null || genderCode === '') return ''
  const code = Number(genderCode)
  if (code === 0) return 'Nam'
  if (code === 1) return 'Nữ'
  if (code === 2) return 'Chưa xác định'
  return ''
}

function formatMoney(n: number) {
  return `${Number(n || 0).toLocaleString('vi-VN')}đ`
}

const customer = ref({
  id: customerId.value,
  fullName: '',
  email: '' as string | null,
  phone: '' as string | null,
  gender: '' as string | null,
  birthDate: '' as string | null,
  marketingOptIn: false,
  hasAccount: false,
  address: '' as string | null,
  group: '' as string | null,
  tags: [] as string[],
  orderStats: {
    latestOrderNo: '',
    latestOrderCode: '',
    orderCount: 0,
    totalSpend: 0,
    avgSpend: 0
  },
  financials: {
    currentReceivables: 0
  }
})

// Groups state
type GroupOption = { id: number, name: string }
const groups = ref<GroupOption[]>([])
const selectedGroups = ref<GroupOption[]>([])
// no-op

// RemoteSearchSelect fetcher for groups (local filter since API doesn't expose search param)
async function fetchCustomerGroups(search: string): Promise<GroupOption[]> {
  try {
    if (!groups.value.length) {
      const res = await customersService.getCustomerGroupsExternal()
      groups.value = Array.isArray(res?.data) ? res.data.map(g => ({ id: g.id, name: g.name })) : []
    }
    const q = (search || '').toLowerCase()
    return q ? groups.value.filter(g => g.name.toLowerCase().includes(q)) : groups.value
  } catch {
    return []
  }
}

const recentOrders = ref<Array<{
  no: string
  code: string
  author: string
  time: string
  amount: number
  paymentStatus: UiPaymentStatus
  processStatus: UiProcessStatus
  id?: string | number // maintain compatibility with BaseTable selection tracking if needed
}>>([])
const ordersPage = ref(1)
const ordersPageSize = ref(5)
const ordersTotal = ref(0) // Total items count, not total value

// Table columns configured for list-view layout (2 columns, hidden header)
const orderColumns: TableColumn[] = [
  { key: 'info', label: 'Thông tin' }, // Will contain Code, Date, Author
  { key: 'status', label: 'Trạng thái', align: 'right' } // Will contain Amount, PaymentStatus, ProcessStatus
]

async function loadOrders(pageIndex = 1) {
  if (!customerId.value) return
  const start = (pageIndex - 1) * ordersPageSize.value
  const res = await customersService.getCustomerOrdersExternal(customerId.value, {
    Pagination: {
      Start: start,
      Number: ordersPageSize.value
    },
    Sort: {
      Field: 'Id',
      Reverse: true
    }
  })
  if (res?.success && res.data) {
    ordersTotal.value = res.data.totalRecord || 0
    if (res.data.items) {
      recentOrders.value = res.data.items.map((i) => {
        const paymentStatus = mapPaymentStatus(i.paymentStatus, i.paidAmount, i.orderTotal)
        const rawCode = i.orderCode || `#${i.id}`
        const normalizedCode = rawCode.startsWith('#') ? rawCode : `#${rawCode}`
        const linkCode = i.orderCode || String(i.id)
        return {
          id: i.id, // needed for BaseTable keying
          no: normalizedCode,
          code: linkCode,
          author: 'Từ POS',
          time: formatDateTime(i.createdOn),
          amount: i.orderTotal || 0,
          paymentStatus,
          processStatus: mapProcessStatusFromCode(i.orderStatus, i.orderStatusText)
        }
      })
      if (!customer.value.orderStats.latestOrderNo && recentOrders.value[0] && pageIndex === 1) {
        customer.value.orderStats.latestOrderNo = recentOrders.value[0].no
        customer.value.orderStats.latestOrderCode = recentOrders.value[0].code
      }
    } else {
      recentOrders.value = []
    }
  }
}

// Map BaseTable 0-based index to our 1-based logic
const ordersPagination = computed({
  get: () => ({ pageIndex: ordersPage.value - 1, pageSize: ordersPageSize.value }),
  set: (v) => {
    if (v.pageIndex + 1 !== ordersPage.value) {
      onOrdersPageChange(v.pageIndex + 1)
    }
  }
})

async function onOrdersPageChange(newPage: number) {
  ordersPage.value = newPage
  await loadOrders(newPage)
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return ''
  const d = new Date(iso)
  const date = d.toLocaleDateString('vi-VN')
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${date} ${time}`
}

// Real debt history from API
const debtHistory = ref<Array<{
  id: string
  orderCode?: string
  type: string
  reason: string
  date: string
  amount: number
}>>([])

// Legacy helper no longer used (replaced by mapProcessStatusFromCode)

const note = ref('')
const newTag = ref('')
function addTag() {
  const t = newTag.value.trim()
  if (!t) return
  if (!customer.value.tags.includes(t)) customer.value.tags.push(t)
  newTag.value = ''
}
function removeTag(i: number) {
  customer.value.tags.splice(i, 1)
}

function goBack() {
  router.push('/customers')
}

function openInviteActivation() {
  // Placeholder for sending activation invite
}

function viewAllOrders() {
  // Placeholder navigation to orders list filtered by customer
}

// Payment Modal State
const isPaymentModalOpen = ref(false)
const isSubmittingPayment = ref(false)

function openPaymentModal() {
  isPaymentModalOpen.value = true
}

async function handlePaymentSubmit(payload: { method: string, amount: number, reference: string }) {
  const methodMap: Record<string, string> = {
    'TienMat': 'Cash',
    'ChuyenKhoan': 'BankTransfer',
    'ViDienTu': 'EWallet'
  }

  isSubmittingPayment.value = true
  try {
    const res = await customersService.createCustomerPayment(customerId.value, {
      paymentMethod: methodMap[payload.method] || 'Cash',
      amount: payload.amount,
      referenceNumber: payload.reference,
      note: '' // Component doesn't support note field yet, or we can add it?
      // Wait, ReceivePaymentModal DOES NOT have a note field in the template.
      // ReceivePaymentModal emits { method, amount, reference }.
      // The original modal had a Note field.
      // If I use ReceivePaymentModal as is, I lose the Note field.
      // However, the User specifically asked to look at Order Detail modal.
      // Order Detail modal (ReceivePaymentModal) does NOT have a note field.
      // It has Reference input.
      // So I will sacrifice the Note field to match Order Detail modal behavior.
      // Or I could extend ReceivePaymentModal, but I shouldn't modify it unless necessary.
      // The User asked to check "how it works in order details".
      // Presumably they want the same standardized behavior.
    })

    if (res.success) {
      isPaymentModalOpen.value = false
      // Refresh debt data
      const arRes = await customersService.getCustomerReceivables(customerId.value)
      const arData = arRes as any
      if (arData?.success) {
        if (arData.summary) {
          customer.value.financials.currentReceivables = arData.summary.totalRemainingAmount
        } else if (arData.customer) {
          customer.value.financials.currentReceivables = arData.customer.currentReceivables
        }

        if (arData.aRs) {
          debtHistory.value = arData.aRs.map((ar: any) => ({
            id: ar.arNumber || ar.orderCode,
            orderCode: ar.orderCode,
            type: 'Đơn hàng',
            reason: ar.note || ar.orderCode ? `Tato từ ${ar.orderCode}` : 'Ghi nhận công nợ',
            date: formatDateTime(ar.createdOn),
            amount: ar.remainingAmount
          }))
        }
      }
      // Re-fetch orders too if needed, but debt is main thing
    } else {
      alert(res.message || 'Có lỗi xảy ra khi tạo thanh toán')
    }
  } catch (e) {
    console.error(e)
    alert('Có lỗi xảy ra')
  } finally {
    isSubmittingPayment.value = false
  }
}

function reloadDebts() {
  // Placeholder reload action for debt management card
}

function saveCustomer() {
  // Placeholder for save action (notes/tags/groups changes)
}

// Render helpers for multiline sections
const contactText = computed(() => [
  customer.value.fullName || '',
  customer.value.phone || '',
  mapGender(customer.value.gender),
  customer.value.birthDate || ''
].filter(Boolean).join('\n'))

const addressText = computed(() => [
  customer.value.fullName || '',
  customer.value.phone || '',
  customer.value.address || ''
].filter(Boolean).join('\n'))

// Fetch data from external API and map to view model

onMounted(async () => {
  try {
    if (!customerId.value) return
    // Fetch groups, customer details, and receivables in parallel (orders fetched separately now)
    const [groupsRes, customerRes, arRes] = await Promise.all([
      customersService.getCustomerGroupsExternal(),
      customersService.getCustomerByIdExternal(customerId.value),
      customersService.getCustomerReceivables(customerId.value)
    ])

    // Load initial orders
    await loadOrders(1)

    groups.value = Array.isArray(groupsRes?.data) ? groupsRes.data.map(g => ({ id: g.id, name: g.name })) : []

    if (customerRes?.success && customerRes.data) {
      const d = customerRes.data
      customer.value.id = String(d.id ?? customerId.value)
      customer.value.fullName = d.fullName || d.name || ''
      customer.value.email = d.email || null
      customer.value.phone = d.phoneNumber || null
      // gender mapping: backend returns number|null; leave string for now
      customer.value.gender = d.gender == null ? null : String(d.gender)
      // birthDate ISO -> locale date (dd/MM/yyyy)
      customer.value.birthDate = d.birthDate ? new Date(d.birthDate).toLocaleDateString('vi-VN') : null

      // address
      const addr = Array.isArray(d.address)
        ? d.address.find((a: { isDefault: boolean }) => a.isDefault) || d.address[0]
        : null
      if (addr) {
        const parts = [
          addr.addressLine1,
          addr.wardName,
          addr.districtName,
          addr.stateOrProvinceName,
          addr.countryName
        ].filter(Boolean)
        customer.value.address = parts.join(', ')
      } else {
        customer.value.address = null
      }

      // groups
      const ids = Array.isArray(d.groups) ? d.groups.map(g => g.groupId) : []
      selectedGroups.value = ids
        .map(id => groups.value.find(g => g.id === id) || null)
        .filter(Boolean) as GroupOption[]
      customer.value.group = selectedGroups.value[0]?.name || null

      // stats
      customer.value.orderStats.orderCount = d.totalOrders || 0
      customer.value.orderStats.totalSpend = d.totalAmount || d.totalNetSales || d.totalSales || 0
      customer.value.orderStats.avgSpend = d.totalOrders
        ? Math.round((d.totalAmount || 0) / d.totalOrders)
        : 0
      customer.value.financials = {
        currentReceivables: d.currentReceivables || d.receivable || 0
      }
      // note
      if (typeof d.note === 'string') {
        note.value = d.note
      }
      // latestOrderNo unknown from customer payload → will try to derive from orders response below
    }
    // Orders mapping
    // Orders mapping handled in loadOrders


    // ARs mapping
    // ARs mapping
    const arData = arRes as any // Cast to any to handle custom response structure
    if (arData?.success) {
      // Update total current receivables from summary if available
      if (arData.summary) {
        customer.value.financials.currentReceivables = arData.summary.totalRemainingAmount
      } else if (arData.customer) {
        customer.value.financials.currentReceivables = arData.customer.currentReceivables
      }

      if (arData.aRs) {
        debtHistory.value = arData.aRs.map((ar: any) => ({
          id: ar.arNumber || ar.orderCode,
          orderCode: ar.orderCode, // For link
          type: 'Đơn hàng', // Most ARs are orders
          reason: ar.note || ar.orderCode ? `Tạo từ ${ar.orderCode}` : 'Ghi nhận công nợ',
          date: formatDateTime(ar.createdOn),
          amount: ar.remainingAmount // Debt is positive
        }))
      }
    }
  } catch {
    // Silent for now; could add a toast later
  }
})
</script>

<template>
  <UDashboardPanel id="customer-detail" class="flex flex-col h-full">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <div class="flex items-center gap-3">
            <UDashboardSidebarCollapse />
            <div class="text-lg font-semibold flex items-center gap-2">
              <span>
                {{ customer.fullName }}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                class="w-4 h-4 text-gray-500">
                <path fill-rule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 011.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
                  clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <button type="button"
              class="hidden sm:inline-flex items-center gap-2 h-9 px-3 rounded-md border border-transparent bg-white text-sm text-primary-600 hover:text-primary-700"
              @click="openInviteActivation">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                <path
                  d="M2.25 12l8.954-8.955c.44-.439 1.166-.128 1.166.49V8.5c4.833.208 7.5 2.73 7.5 7.5-1.5-2-3.75-3-7.5-3v4.965c0 .618-.725.929-1.166.49L2.25 12z" />
              </svg>
              Gửi lời mời kích hoạt tài khoản
            </button>
            <button type="button"
              class="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50"
              @click="goBack">
              Quay lại
            </button>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full max-w-6xl mx-auto px-4 lg:px-6 py-6">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left Column -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Summary card -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <div class="-mx-6 px-6 -mt-2">
                <div class="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div class="flex items-center gap-4">
                    <div
                      class="h-14 w-14 rounded-full bg-green-200 text-green-700 flex items-center justify-center text-xl font-semibold">
                      {{ initialsFromName(customer.fullName) }}
                    </div>
                    <div class="text-xl font-semibold text-gray-900">
                      {{ customer.fullName }}
                    </div>
                  </div>
                </div>

                <div class="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div class="flex flex-col gap-1">
                    <div class="text-sm text-gray-500 font-medium">
                      Đơn hàng mới nhất
                    </div>
                    <div class="text-base font-semibold text-primary-600">
                      <a :href="`/orders/${customer.orderStats.latestOrderCode}`" target="_blank"
                        class="hover:underline">
                        {{ customer.orderStats.latestOrderNo }}
                      </a>
                    </div>
                    <div class="text-sm text-gray-900">
                      Từ POS
                    </div>
                  </div>

                  <div class="flex flex-col gap-1">
                    <div class="text-sm text-gray-500 font-medium">
                      Tổng chi tiêu
                    </div>
                    <div class="text-base font-semibold text-gray-900">
                      {{ formatMoney(customer.orderStats.totalSpend) }}
                    </div>
                    <div class="text-sm text-gray-900">
                      {{ customer.orderStats.orderCount }} đơn hàng
                    </div>
                  </div>

                  <div class="flex flex-col gap-1">
                    <div class="text-sm text-gray-500 font-medium">
                      Chi tiêu trung bình
                    </div>
                    <div class="text-base font-semibold text-gray-900">
                      {{ formatMoney(customer.orderStats.avgSpend) }}
                    </div>
                  </div>
                </div>
              </div>
            </UPageCard>

            <!-- Recent orders card -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Đơn hàng gần đây
                <template #actions>
                  <a href="#" class="text-sm text-primary-600 hover:underline" @click.prevent="viewAllOrders">Danh sách
                    đơn hàng</a>
                </template>
              </BaseCardHeader>
              <div class="-mx-6 pt-2 overflow-hidden">
                <BaseTable :data="recentOrders" :columns="orderColumns" :pagination="ordersPagination"
                  :total-records="ordersTotal" :total-pages="Math.ceil(ordersTotal / ordersPageSize)"
                  :selectable="false" :show-row-actions="false" :hide-title="true" :hide-search="true"
                  header-row-class="hidden" header-padding-x="px-6" body-padding="px-0" table-min-width="0"
                  class="border-none shadow-none" @update:pagination="p => ordersPagination = p">
                  <template #column-info="{ item }">
                    <div class="px-6">
                      <div class="text-sm font-medium">
                        <a :href="`/orders/${item.code}`" target="_blank" class="text-blue-600 hover:underline">
                          {{ item.no }}
                        </a>
                      </div>
                      <div class="text-xs text-gray-500 mt-0.5" v-if="item.time">
                        {{ item.author }} | {{ item.time }}
                      </div>
                      <div class="text-xs text-gray-500 mt-0.5" v-else>
                        {{ item.author }}
                      </div>
                    </div>
                  </template>

                  <template #column-status="{ item }">
                    <div class="px-6 flex flex-col items-end gap-1.5">
                      <span class="font-bold text-gray-900 text-sm">{{ formatMoney(item.amount as number) }}</span>
                      <div class="flex items-center gap-2">
                        <span v-if="item.paymentStatus === 'Thanh toán một phần'"
                          class="inline-flex items-center rounded-full bg-white text-orange-600 text-xs px-2.5 py-0.5 font-medium whitespace-nowrap border border-orange-200">
                          <span class="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5"></span>
                          Thanh toán một phần
                        </span>
                        <span v-else-if="item.paymentStatus === 'Đã thanh toán'"
                          class="inline-flex items-center rounded-full bg-white text-green-700 text-xs px-2.5 py-0.5 font-medium whitespace-nowrap border border-green-200">
                          <!-- No dot for Paid? Sample image has dot for Unpaid/Pending -->
                          <!-- Image shows: Paid Orders have no special styling or maybe gray pill?
                                Let's follow the image styles:
                                - "Chưa thanh toán" (Unpaid): Orange border pill with dot.
                                - "Đã xử lý" process status: Gray pill with dot.
                           -->
                          <!-- Let's map strict to image: -->
                          <span class="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
                          Đã thanh toán
                        </span>
                        <span v-else
                          class="inline-flex items-center rounded-full bg-white text-orange-600 text-xs px-2.5 py-0.5 font-medium whitespace-nowrap border border-orange-200">
                          <span class="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5"></span>
                          Chưa thanh toán
                        </span>

                        <span
                          class="inline-flex items-center rounded-full bg-gray-100 text-gray-700 text-xs px-2.5 py-0.5 font-medium whitespace-nowrap">
                          <span class="w-1.5 h-1.5 rounded-full bg-gray-500 mr-1.5"></span>
                          {{ item.processStatus }}
                        </span>
                      </div>
                    </div>
                  </template>
                </BaseTable>
              </div>
            </UPageCard>

            <!-- Debt management card -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-banknotes-20-solid" class="w-4 h-4" />
                  <span>Quản lý công nợ</span>
                </div>
                <template #actions>
                  <button type="button" @click="openPaymentModal"
                    class="px-3 h-8 rounded-md bg-primary-600 text-white hover:bg-primary-700 text-xs font-medium">
                    Thanh toán
                  </button>
                </template>
              </BaseCardHeader>

              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <div class="mb-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="text-sm font-medium mr-2">Công nợ hiện tại:</span>
                      <span class="text-red-500 font-semibold text-base">{{
                        formatMoney(customer.financials.currentReceivables) }}</span>
                    </div>
                    <button class="text-primary-600 text-sm hover:underline flex items-center gap-1">
                      <UIcon name="i-heroicons-pencil-square" class="w-4 h-4" />
                      Điều chỉnh công nợ
                    </button>
                  </div>
                </div>

                <div class="flex items-center justify-between mb-2">
                  <h3 class="text-sm font-medium text-gray-900">
                    Công nợ gần nhất
                  </h3>
                  <button class="text-primary-600 text-sm hover:underline">
                    Xem chi tiết
                  </button>
                </div>

                <div class="divide-y divide-gray-200 dark:divide-gray-700">
                  <div v-for="(item, index) in debtHistory" :key="index"
                    class="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div class="text-sm font-medium">
                        <a v-if="item.orderCode" :href="`/orders/${item.orderCode}`" target="_blank"
                          class="text-primary-600 hover:underline">{{ item.id }}</a>
                        <span v-else>{{ item.id || item.type }}</span>
                      </div>
                      <div class="text-xs text-gray-500">
                        {{ item.reason }} | {{ item.date }}
                      </div>
                    </div>
                    <div class="text-sm font-medium" :class="item.amount > 0 ? 'text-green-600' : 'text-red-500'">
                      {{ formatMoney(item.amount) }}
                    </div>
                  </div>
                </div>
              </div>
            </UPageCard>
          </div>

          <!-- Right Column -->
          <div class="space-y-6">
            <!-- Contact card -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Liên hệ
                <template #actions>
                  <button class="text-gray-400 hover:text-gray-600" title="Chỉnh sửa">
                    <UIcon name="i-heroicons-pencil-square-20-solid" class="w-5 h-5" aria-hidden="true" />
                  </button>
                </template>
              </BaseCardHeader>
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-4">
                <div v-if="customer.email" class="text-sm">
                  <a :href="`mailto:${customer.email}`" class="text-primary-600 hover:underline">
                    {{ customer.email }}
                  </a>
                </div>
                <div class="text-sm font-medium text-gray-900">
                  {{ customer.fullName }}
                </div>
                <div class="text-sm text-gray-500">
                  Không đồng ý nhận email quảng cáo
                </div>
                <!-- Mock status -->
                <div class="text-sm text-gray-400 italic">
                  Chưa có tài khoản
                </div>
              </div>
            </UPageCard>

            <!-- Address card -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Số địa chỉ
                <template #actions>
                  <button class="text-gray-400 hover:text-gray-600" title="Chỉnh sửa">
                    <UIcon name="i-heroicons-pencil-square-20-solid" class="w-5 h-5" aria-hidden="true" />
                  </button>
                </template>
              </BaseCardHeader>
              <div class="-mx-6 px-6 pt-4 border-t border-gray-100 space-y-2 text-sm text-gray-700">
                <div class="font-medium">
                  {{ customer.fullName }}
                </div>
                <div v-if="customer.address">
                  {{ customer.address }}
                </div>
                <div v-else class="text-gray-400 italic">
                  Chưa có địa chỉ
                </div>
              </div>
            </UPageCard>

            <!-- Group card -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <template #title>
                <div class="text-base font-medium">
                  Nhóm khách hàng
                </div>
              </template>
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-3">
                <div>
                  <RemoteSearchSelect v-model="selectedGroups" :fetch-fn="fetchCustomerGroups"
                    placeholder="Chọn nhóm khách hàng" :clearable="true" label-field="name" :searchable="true"
                    :search-in-trigger="true" :dropdown-max-height="360" :multiple="true" :full-width="true" />
                </div>
                <div v-if="selectedGroups.length" class="flex flex-wrap gap-2">
                  <span v-for="g in selectedGroups" :key="g.id"
                    class="inline-flex items-center rounded-full bg-primary-50 text-primary-700 text-xs px-3 h-7">
                    {{ g.name }}
                  </span>
                </div>
              </div>
            </UPageCard>

            <!-- Notes card -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <template #title>
                <div class="text-base font-medium">
                  Ghi chú
                </div>
              </template>
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <textarea v-model="note" rows="5"
                  class="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="Nhập ghi chú" />
              </div>
            </UPageCard>

            <!-- Tags card -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Tag
                <template #actions>
                  <a href="#" class="text-primary-600 text-xs font-medium hover:underline">Danh sách tag</a>
                </template>
              </BaseCardHeader>
              <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
                <input v-model="newTag" type="text"
                  class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Tìm kiếm hoặc thêm mới tag" @keydown.enter.prevent="addTag">
                <div v-if="customer.tags.length" class="flex flex-wrap gap-2 mt-3">
                  <div v-for="(t, i) in customer.tags" :key="t + i"
                    class="px-2 h-7 rounded-full bg-primary-50 text-primary-700 text-xs inline-flex items-center gap-1">
                    <span>{{ t }}</span>
                    <button type="button" class="text-primary-500 hover:text-primary-700" @click="removeTag(i)">
                      ×
                    </button>
                  </div>
                </div>
              </div>
            </UPageCard>
          </div>
        </div>

        <!-- Save -->
        <div class="flex items-center justify-end gap-3 mt-8 mb-4">
          <button type="button"
            class="px-4 h-9 rounded-md border border-red-500 text-red-600 bg-white hover:bg-red-50 text-sm font-medium">
            Xóa khách hàng
          </button>
          <button type="button"
            class="px-4 h-9 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium"
            @click="saveCustomer">
            Lưu
          </button>
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Payment Modal -->
  <!-- Payment Modal -->
  <ReceivePaymentModal v-model="isPaymentModalOpen" :remaining-amount="customer.financials.currentReceivables"
    :paid-amount="0" @submit="handlePaymentSubmit" />
</template>
