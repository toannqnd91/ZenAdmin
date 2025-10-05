<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCardHeader from '@/components/BaseCardHeader.vue'

interface ReceiptDetail {
  id: string | number
  code: string
  amount: number
  method: string
  description: string
  createdOn: string
  branchName?: string | null
  reference?: string | null
  customer?: { id?: string | number | null; name?: string | null } | null
  originalOrderCode?: string | null
}

const route = useRoute()
const router = useRouter()
const codeParam = computed(() => route.params.code as string)
const loading = ref(false)
const detail = ref<ReceiptDetail | null>(null)

function formatCurrency(v?: number | null) {
  if (v == null || isNaN(v)) return '0đ'
  return new Intl.NumberFormat('vi-VN').format(v) + 'đ'
}
function formatDateTime(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yy} ${hh}:${mi}`
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

// Files (evidence)
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
function removeFile(idx: number) { evidenceFiles.value.splice(idx, 1) }

function goBack() { router.push('/cash-flow') }
function prevReceipt() { /* TODO integrate prev navigation */ }
function nextReceipt() { /* TODO integrate next navigation */ }
function printReceipt() { window.print() }
</script>

<template>
  <UDashboardPanel :id="`receipt-${codeParam}`">
    <template #header>
      <UDashboardNavbar hide-title>
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div v-if="loading" class="p-6 text-center text-sm text-gray-500">Đang tải...</div>
      <div v-else-if="!detail" class="p-6 text-center text-sm text-gray-500">Không tìm thấy phiếu thu.</div>
      <div v-else class="w-full max-w-screen-xl mx-auto px-4 lg:px-6 pb-12">
        <!-- Toolbar moved from navbar into body (code + time + actions) -->
        <div class="flex items-center justify-between gap-6 mb-6 flex-wrap">
          <div class="flex items-center gap-3 flex-shrink-0">
            <UButton color="neutral" variant="soft" icon="i-heroicons-arrow-left" size="sm" @click="goBack" />
            <div class="flex flex-col">
              <div class="text-xl font-semibold text-gray-900 leading-tight">{{ detail.code }}</div>
              <div class="text-xs text-gray-500 mt-0.5">{{ formatDateTime(detail.createdOn) }}</div>
            </div>
          </div>
          <div class="flex items-center gap-4 flex-shrink-0">
            <UButton color="neutral" variant="ghost" size="sm" class="font-medium inline-flex items-center gap-2" @click="printReceipt">
              <span class="i-heroicons-printer w-4 h-4" />
              In phiếu
            </UButton>
            <div class="flex border border-gray-200 rounded-md overflow-hidden">
              <UButton size="sm" color="neutral" variant="ghost" icon="i-heroicons-chevron-left" class="rounded-none" @click="prevReceipt" />
              <div class="w-px bg-gray-200" />
              <UButton size="sm" color="neutral" variant="ghost" icon="i-heroicons-chevron-right" class="rounded-none" @click="nextReceipt" />
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
                    <div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm select-none">{{ detail.customer?.name ? detail.customer.name.charAt(0) : '-' }}</div>
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
                    <label class="block text-xs font-medium text-gray-600 mb-1">Diễn giải<span class="text-red-500">*</span></label>
                    <UInput v-model="detail.description" size="md" placeholder="Nhập diễn giải" />
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
                    <img :src="URL.createObjectURL(f)" class="w-full h-28 object-cover" />
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
                  <label class="block text-xs font-medium text-gray-600">Chi nhánh nhận<span class="text-red-500">*</span></label>
                  <USelect :model-value="detail.branchName" :options="[detail.branchName || 'Cửa hàng chính']" size="md" />
                </div>
                <div class="space-y-1">
                  <label class="block text-xs font-medium text-gray-600">Ngày nhận tiền<span class="text-red-500">*</span></label>
                  <UInput :model-value="formatDateTime(detail.createdOn)" size="md" disabled />
                </div>
                <div class="space-y-1">
                  <div class="flex items-center gap-1">
                    <label class="block text-xs font-medium text-gray-600">Tham chiếu</label>
                    <span class="i-heroicons-information-circle text-gray-400 w-4 h-4" />
                  </div>
                  <UInput v-model="(detail as any).reference" size="md" placeholder="Nhập tham chiếu" />
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

            <div class="flex items-center justify-end gap-3 pt-2">
              <UButton color="neutral" variant="ghost" size="md">Xóa phiếu</UButton>
              <UButton color="primary" size="md" disabled>Lưu</UButton>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
