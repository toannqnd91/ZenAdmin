<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import BaseCardHeader from '@/components/BaseCardHeader.vue'
import RemoteSearchSelect from '@/components/RemoteSearchSelect.vue'
// TODO: replace with real service when available
// import { receiptsService } from '@/services/receipts.service'

interface ReceiptDetail {
  id: string | number
  code: string
  amount: number
  method: string
  description: string
  createdOn: string
  branchName?: string | null
  reference?: string | null
  customer?: {
    id?: string | number | null
    name?: string | null
  } | null
  originalOrderCode?: string | null
}

const route = useRoute()
const codeParam = computed(() => route.params.code as string)
const loading = ref(false)
const detail = ref<ReceiptDetail | null>(null)

function formatCurrency(v?: number | null) {
  if (v == null || isNaN(v)) return '0đ'
  return new Intl.NumberFormat('vi-VN').format(v) + 'đ'
}
function formatDate(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`
}

async function fetchData() {
  loading.value = true
  try {
    // Placeholder data until API integrated
    detail.value = {
      id: codeParam.value || 'RVN00000',
      code: codeParam.value || 'RVN00000',
      amount: 180000,
      method: 'Tiền mặt',
      description: `Thu tiền đơn hàng #1003`,
      createdOn: new Date().toISOString(),
      branchName: 'Cửa hàng chính',
      reference: null,
      customer: { id: null, name: '------' },
      originalOrderCode: '#1003'
    }
  } finally { loading.value = false }
}

onMounted(fetchData)

const evidenceFiles = ref<File[]>([])
function handleDrop(e: DragEvent) {
  if (!e.dataTransfer) return
  const files = Array.from(e.dataTransfer.files).slice(0, 10)
  evidenceFiles.value = [...evidenceFiles.value, ...files].slice(0, 10)
}
function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  const files = Array.from(input.files).slice(0, 10)
  evidenceFiles.value = [...evidenceFiles.value, ...files].slice(0, 10)
  input.value = ''
}
function removeFile(idx: number) {
  evidenceFiles.value.splice(idx, 1)
}

// Simple print handler – can be replaced with a dedicated receipt print layout later
function printReceipt() {
  // Future: navigate to /receipts/{code}/print for a cleaner print stylesheet
  window.print()
}

// Helper for creating object URLs (avoid direct global URL access in template for TS lint happiness)
function fileUrl(f: File) {
  return URL.createObjectURL(f)
}

// Shared label class to mirror /orders/create field styling
const fieldLabelClass = 'block text-xs font-medium text-gray-600 mb-1'

// Branch select state (using RemoteSearchSelect for dropdown parity with orders/create)
const selectedBranch = ref<any | null>(null)

async function fetchBranches(search: string) {
  // Placeholder static list; replace with warehouseService.getWarehouses or similar later
  const list = [
    { id: 1, name: 'Cửa hàng chính' },
    { id: 2, name: 'Chi nhánh 2' },
    { id: 3, name: 'Chi nhánh 3' }
  ]
  const q = (search || '').toLowerCase()
  return q ? list.filter(b => b.name.toLowerCase().includes(q)) : list
}

watch(selectedBranch, (val) => {
  if (detail.value && val && typeof val === 'object') {
    detail.value.branchName = (val as any).name || null
  }
})

// Date input (Ngày nhận tiền) editing helpers (dd/MM/yyyy)
function formatDateDDMMYYYY(date: Date) {
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}
function normalizeDDMMYYYY(s: string): string {
  if (!s) return ''
  const parts = s.split(/[./-]/)
  if (parts.length !== 3) return s
  let [dd, mm, yyyy] = parts.map(p => p.trim())
  if (!dd || !mm || !yyyy) return s
  let d = Number(dd), m = Number(mm), y = Number(yyyy)
  if (y < 100) y += 2000
  if (!Number.isFinite(d) || !Number.isFinite(m) || !Number.isFinite(y)) return s
  if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1000) return s
  return `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${String(y).padStart(4,'0')}`
}
const receiptDate = ref('')

onMounted(() => {
  watch(detail, (v) => {
    if (v && !receiptDate.value) {
      try { receiptDate.value = formatDateDDMMYYYY(new Date(v.createdOn)) } catch { /* ignore */ }
      if (v.branchName) selectedBranch.value = { id: 1, name: v.branchName }
    }
  }, { immediate: true })
})

</script>

<template>
  <UDashboardPanel :id="`receipt-${codeParam}`">
    <template #header>
      <UDashboardNavbar hide-title>
        <template #leading>
          <UDashboardSidebarCollapse />
          <div>
            <div class="text-lg font-semibold">
              Sổ quỹ
            </div>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="loading" class="p-6 text-center text-sm text-gray-500">Đang tải...</div>
      <div v-else-if="!detail" class="p-6 text-center text-sm text-gray-500">Không tìm thấy phiếu thu.</div>
      <div v-else class="w-full max-w-screen-xl mx-auto px-4 lg:px-6 pb-12">
        <!-- Toolbar moved into body -->
        <div class="flex items-center justify-between gap-6 mb-6 flex-wrap">
          <div class="flex items-center gap-3 flex-shrink-0">
            <UButton color="neutral" variant="soft" icon="i-heroicons-arrow-left" size="sm" :to="'/cash-flow'" />
            <div class="flex flex-col">
              <div class="text-xl font-semibold text-gray-900 leading-tight">{{ detail.code }}</div>
              <div class="text-xs text-gray-500 mt-0.5">{{ formatDate(detail.createdOn) }}</div>
            </div>
          </div>
          <div class="flex items-center gap-4 flex-shrink-0">
            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              class="font-medium inline-flex items-center gap-2"
              @click="printReceipt"
            >
              <span class="w-5 h-5 text-gray-600" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="w-5 h-5">
                  <path fill="currentColor" d="M18 6.25h-.25v-1.25a.75.75 0 0 0-.22-.53l-2-2a.75.75 0 0 0-.53-.22h-7a1.75 1.75 0 0 0-1.75 1.75v2.25h-.25a3.383 3.383 0 0 0-3.75 3.75v5.5a2.253 2.253 0 0 0 2.25 2.25h1.75v2.25a1.75 1.75 0 0 0 1.75 1.75h8a1.75 1.75 0 0 0 1.75-1.75v-2.25h1.75a2.253 2.253 0 0 0 2.25-2.25v-5.5a3.382 3.382 0 0 0-3.75-3.75m-10.25-2.25a.25.25 0 0 1 .25-.25h6.689l1.561 1.561v.939h-8.5zm8.5 16a.25.25 0 0 1-.25.25h-8a.25.25 0 0 1-.25-.25v-4.25h8.5zm4-4.5a.75.75 0 0 1-.75.75h-1.75v-1.25a.75.75 0 0 0-.75-.75h-10a.75.75 0 0 0-.75.75v1.25h-1.75a.75.75 0 0 1-.75-.75v-5.5c0-1.577.673-2.25 2.25-2.25h12c1.577 0 2.25.673 2.25 2.25zm-2.25-4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
                </svg>
              </span>
              <span>In phiếu</span>
            </UButton>
            <div class="flex border border-gray-200 rounded-md overflow-hidden">
              <UButton size="sm" color="neutral" variant="ghost" icon="i-heroicons-chevron-left" class="rounded-none" />
              <div class="w-px bg-gray-200" />
              <UButton size="sm" color="neutral" variant="ghost" icon="i-heroicons-chevron-right" class="rounded-none" />
            </div>
          </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <!-- Left main column -->
          <div class="flex flex-col gap-6">
            <!-- General info + amount -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader class="sr-only">Thông tin chung</BaseCardHeader>
              <div class="flex flex-col gap-6">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex items-start gap-3">
                    <div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm select-none">{{ detail.customer?.name ? detail.customer.name.charAt(0) : '?' }}</div>
                    <div class="space-y-1">
                      <p class="font-medium text-gray-900 leading-5">Thu tiền bán hàng</p>
                      <p class="text-xs text-gray-500">Khách hàng</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-emerald-600 font-semibold text-lg leading-tight">+{{ formatCurrency(detail.amount) }}</div>
                    <div class="text-xs text-gray-500 mt-0.5">{{ detail.method }}</div>
                  </div>
                </div>
                <div class="space-y-3">
                  <div>
                    <label class="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">Diễn giải <span class="text-red-500">*</span></label>
                    <div class="relative">
                      <input
                        v-model="detail.description"
                        type="text"
                        placeholder="Nhập diễn giải"
                        class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                      <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </UPageCard>

            <!-- Evidence images upload -->
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Ảnh chứng từ</BaseCardHeader>
              <div
                class="mt-2 border border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:border-primary-400 transition"
                @dragover.prevent
                @drop.prevent="handleDrop"
              >
                <div class="text-sm text-gray-600">
                  Kéo thả hoặc <label class="text-primary-600 font-medium cursor-pointer hover:underline">
                    <input type="file" class="hidden" multiple accept="image/*" @change="handleFileChange" />
                    tải ảnh từ thiết bị
                  </label>
                </div>
                <p class="mt-1 text-xs text-gray-400">Dung lượng tối đa 2MB/ảnh , hỗ trợ JPEG hoặc PNG. Tối đa 10 ảnh</p>
                <div v-if="evidenceFiles.length" class="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-left">
                  <div
                    v-for="(f, idx) in evidenceFiles"
                    :key="idx + f.name"
                    class="relative group border border-gray-200 rounded-md overflow-hidden bg-gray-50"
                  >
                    <img :src="fileUrl(f)" class="w-full h-28 object-cover" />
                    <button type="button" @click="removeFile(idx)" class="absolute top-1 right-1 bg-white/90 rounded-full p-1 shadow hover:bg-white">
                      <span class="i-heroicons-x-mark w-4 h-4 text-gray-600" />
                    </button>
                    <div class="absolute bottom-0 left-0 right-0 bg-black/40 text-[10px] text-white px-1 py-0.5 truncate">{{ f.name }}</div>
                  </div>
                </div>
              </div>
            </UPageCard>
          </div>

          <!-- Right info column -->
          <div class="space-y-6">
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Thông tin bổ sung</BaseCardHeader>
              <div class="space-y-4 text-sm">
                <div class="space-y-1">
                  <label class="text-xs font-medium text-gray-600 flex items-center gap-1">Chi nhánh nhận <span class="text-red-500">*</span></label>
                  <RemoteSearchSelect
                    v-model="selectedBranch"
                    :fetch-fn="fetchBranches"
                    label-field="name"
                    placeholder="Chọn chi nhánh"
                    trigger-class="h-9 px-3 rounded-md border border-gray-200 text-sm w-full cursor-not-allowed opacity-80"
                    :full-width="true"
                    :disabled="true"
                    class="disabled-branch-select"
                    style="background: var(--color-gray-50);"
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">Ngày nhận tiền <span class="text-red-500">*</span></label>
                  <div class="relative">
                    <input
                      v-model="receiptDate"
                      type="text"
                      placeholder="dd/MM/yyyy"
                      class="w-full h-9 px-3 rounded-md border border-gray-200 bg-gray-50 text-sm focus:outline-none cursor-not-allowed"
                      readonly
                      @blur="receiptDate = normalizeDDMMYYYY(receiptDate)"
                    >
                    <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
                <div class="space-y-1">
                  <div class="flex items-center gap-1">
                    <label class="text-xs font-medium text-gray-600 flex items-center gap-1">Tham chiếu</label>
                    <span class="i-heroicons-information-circle text-gray-400 w-4 h-4" />
                  </div>
                  <div class="relative">
                    <input
                      v-model="(detail as any).reference"
                      type="text"
                      placeholder="Nhập tham chiếu"
                      class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                  </div>
                </div>
              </div>
            </UPageCard>

            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>Chứng từ gốc</BaseCardHeader>
              <div class="text-sm divide-y divide-gray-100">
                <div class="flex items-center justify-between py-2">
                  <span class="text-gray-600">Mã chứng từ</span>
                  <span class="text-primary-600 font-medium cursor-pointer hover:underline">{{ detail.originalOrderCode }}</span>
                </div>
                <div class="flex items-center justify-between py-2">
                  <span class="text-gray-600">Số tiền nhận</span>
                  <span class="font-medium">{{ formatCurrency(detail.amount) }}</span>
                </div>
              </div>
            </UPageCard>

            <div class="flex items-center justify-end gap-4 pt-4">
              <UButton
                color="error"
                variant="soft"
                size="lg"
                class="inline-flex items-center gap-2 px-4"
              >
                <span>Xóa phiếu</span>
              </UButton>
              <UButton
                color="primary"
                variant="solid"
                size="lg"
                class="inline-flex items-center gap-2 px-5"
                disabled
              >
                <span>Lưu</span>
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
.disabled-branch-select,
.disabled-branch-select * {
  cursor: not-allowed !important;
}
</style>
