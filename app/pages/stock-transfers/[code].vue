<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { DropdownMenuItem } from '@nuxt/ui'
import { useRoute, useRouter } from 'vue-router'

import BaseCardHeader from '@/components/BaseCardHeader.vue'
import CustomCheckbox from '@/components/CustomCheckbox.vue'
import TableEmptyState from '@/components/base/TableEmptyState.vue'
import { inventoryTransfersService, type InventoryTransferDetailDTO, type InventoryTransferItemDTO } from '@/services/inventoryTransfers.service'

const route = useRoute()
const router = useRouter()

const code = computed(() => String(route.params.code || ''))

interface TransferItem {
  id: number | string
  name: string
  sku?: string | null
  normalizedName?: string | null
  availableQty: number
  qty: number
  image?: string | null
}

interface TimelineComment {
  id: string
  type: 'comment'
  createdAt: string
  actorName: string
  content: string
}

interface TimelineActivity {
  id: string
  type: 'activity'
  createdAt: string
  title: string
  details?: string[]
}

type TimelineEntry = TimelineComment | TimelineActivity

interface TransferDetail {
  code: string
  status: number
  statusLabel: string
  origin: { name: string, address?: string | null }
  destination: { name: string, address?: string | null }
  dateCreated: string
  referenceName?: string | null
  note?: string | null
  tags?: string[]
  items: TransferItem[]
  timeline: TimelineEntry[]
}

const detail = ref<TransferDetail | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const statusUpdating = ref(false)
const statusError = ref<string | null>(null)
// Keep a snapshot of the original items (by id and qty) to detect changes
const originalItemsSnapshot = ref<Array<{ id: string | number, qty: number }>>([])
// Status constants
const ALL_STATUS = [
  { code: 1, label: 'Sẵn sàng' },
  { code: 2, label: 'Đang xử lý' },
  { code: 3, label: 'Đã chuyển' }
] as const

// Primary action for split-button: next logical status
const primaryAction = computed(() => {
  const s = detail.value?.status ?? 0
  if (s <= 0) return ALL_STATUS[0]
  if (s === 1) return ALL_STATUS[1]
  if (s === 2) return ALL_STATUS[2]
  // When already transferred, keep last as label and disable action
  return ALL_STATUS[2]
})

// Dropdown items exclude current status and primary action
const statusMenuItems = computed<DropdownMenuItem[]>(() => {
  const current = detail.value?.status ?? 0
  return ALL_STATUS
    .filter(a => a.code !== current && a.code !== primaryAction.value.code)
    .map(a => ({
      label: a.label,
      disabled: statusUpdating.value,
      onSelect: (e: Event) => {
        e?.preventDefault?.()
        onStatusAction(a)
      }
    }))
})

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

function statusPillClass(label: string) {
  const key = (label || '').toLowerCase()
  if (key.includes('draft') || key.includes('nháp')) {
    return 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200'
  }
  if (key.includes('đang') || key.includes('processing')) {
    return 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200'
  }
  return 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200'
}

async function loadDetail() {
  loading.value = true
  error.value = null
  try {
    const res = await inventoryTransfersService.getByCode(code.value)
    if (!res?.success) throw new Error(res?.message || 'Tải dữ liệu thất bại')
    const d = res.data as InventoryTransferDetailDTO
    const items: InventoryTransferItemDTO[] = Array.isArray(d.items) ? d.items : []
    detail.value = {
      code: String(d.transferCode || code.value),
      status: Number(d.status || 0),
      statusLabel: String(d.statusText || ''),
      origin: { name: String(d.originName || ''), address: null },
      destination: { name: String(d.destinationName || ''), address: null },
      dateCreated: String(d.createdOn || ''),
      referenceName: d.referenceName || null,
      note: d.note || null,
      tags: (d.tags || '').split(',').map(s => s.trim()).filter(Boolean),
      items: items.map(it => ({
        id: it.id,
        name: `Sản phẩm #${it.productId}`,
        sku: it.sku || null,
        normalizedName: null,
        availableQty: Number(it.availableQuantity || 0),
        qty: Number(it.quantity || 0),
        image: null
      })),
      timeline: []
    }
    // Update original snapshot after successful load
    originalItemsSnapshot.value = (detail.value?.items || []).map(it => ({ id: it.id, qty: it.qty }))
  } catch (e) {
    const err = e as { message?: string }
    error.value = err?.message || 'Không tải được chi tiết chuyển kho'
  } finally {
    loading.value = false
  }
}

onMounted(loadDetail)

const comment = ref('')
const splitLine = ref(false)

function postComment() {
  if (!comment.value.trim() || !detail.value) return
  const entry: TimelineEntry = {
    id: `cmt-${Date.now()}`,
    type: 'comment',
    createdAt: new Date().toISOString(),
    actorName: 'My Store Admin',
    content: comment.value.trim()
  }
  // Add newest on top
  detail.value.timeline.unshift(entry)
  comment.value = ''
}

// Map local timeline entries to the simple history-like shape used in orders page
const historyLike = computed(() => {
  const list = detail.value?.timeline || []
  return list.map(e => ({
    id: e.id,
    createdOn: e.createdAt,
    message: e.type === 'comment' ? (e as TimelineComment).content : (e as TimelineActivity).title,
    actorName: e.type === 'comment' ? (e as TimelineComment).actorName : null
  }))
})

// Whether transfer is completed (hide actions)
const isTransferred = computed(() => (detail.value?.status ?? 0) === 3)

function goBack() {
  router.push('/stock-transfers')
}

function removeItem(idx: number) {
  if (!detail.value) return
  detail.value.items.splice(idx, 1)
}

// Detect if there are unsaved changes (items added/removed or qty changed)
const hasChanges = computed(() => {
  if (!detail.value) return false
  const curr = detail.value.items
  const snap = originalItemsSnapshot.value
  if (curr.length !== snap.length) return true
  const snapMap = new Map<string, number>(snap.map(s => [String(s.id), s.qty]))
  for (const it of curr) {
    const k = String(it.id)
    if (!snapMap.has(k)) return true
    if (Number(it.qty) !== Number(snapMap.get(k))) return true
  }
  return false
})

function saveChanges() {
  // Stub: Implement API call later; for now, just log the intended payload
  if (!detail.value) return
  const payload = {
    code: detail.value.code,
    items: detail.value.items.map(it => ({ id: it.id, qty: it.qty }))
  }
  // After successful save, refresh snapshot to current state
  originalItemsSnapshot.value = detail.value.items.map(it => ({ id: it.id, qty: it.qty }))
}
const toast = useToast()
function onStatusAction(a: { label: string, code: number }) {
  if (statusUpdating.value || !detail.value) return
  if (detail.value.status === a.code) return
  statusUpdating.value = true
  statusError.value = null
  const currentCode = detail.value.code
  const body = { status: a.code, strictFifo: false, rollbackAll: false }
  ;(async () => {
    try {
      const res = await inventoryTransfersService.updateStatus(currentCode, body)
      if (!res?.success) throw new Error(res?.message || 'Cập nhật trạng thái thất bại')
      if (detail.value) {
        detail.value.status = a.code
        detail.value.statusLabel = a.label
        const activity: TimelineActivity = {
          id: `act-${Date.now()}`,
          type: 'activity',
          createdAt: new Date().toISOString(),
          title: `Cập nhật trạng thái: ${a.label}`
        }
        detail.value.timeline.unshift(activity)
      }
      toast.add({ title: 'Đã cập nhật trạng thái', description: a.label, color: 'success' })
    } catch (e) {
      const err = e as { message?: string }
      statusError.value = err?.message || 'Không thể cập nhật trạng thái'
      toast.add({ title: 'Cập nhật trạng thái thất bại', description: statusError.value, color: 'error' })
      console.error('Update status failed', err)
    } finally {
      statusUpdating.value = false
    }
  })()
}
</script>

<template>
  <!-- eslint-disable vue/max-attributes-per-line, vue/html-closing-bracket-newline, vue/singleline-html-element-content-newline, vue/html-indent, vue/first-attribute-linebreak, vue/html-self-closing -->
  <UDashboardPanel id="stock-transfer-detail">
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
                  #{{ detail?.code || '---' }}
                </div>
                <span v-if="detail" :class="statusPillClass(detail.statusLabel)">{{ detail.statusLabel }}</span>
              </div>
              <div v-if="detail" class="text-xs text-gray-500">
                {{ formatDate(detail.dateCreated) }}
              </div>
            </div>
          </div>
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <button
              v-if="!isTransferred"
              class="h-8 px-4 rounded-md text-sm font-medium"
              :class="hasChanges ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'"
              :disabled="!hasChanges"
              @click="saveChanges"
            >
              Lưu
            </button>
            <div v-if="!isTransferred" class="inline-flex items-stretch">
              <UButton
                :label="primaryAction.label"
                color="neutral"
                variant="solid"
                size="sm"
                class="h-8 px-4 rounded-l-md rounded-r-none bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-70 disabled:cursor-not-allowed"
                :loading="statusUpdating"
                :disabled="statusUpdating || (detail?.status === primaryAction.code)"
                @click="onStatusAction(primaryAction)"
              />

              <UDropdownMenu :items="statusMenuItems" :popper="{ placement: 'bottom-end' }">
                <UButton
                  color="neutral"
                  variant="solid"
                  size="sm"
                  icon="i-heroicons-chevron-down-20-solid"
                  class="h-8 px-3 -ml-px rounded-l-none rounded-r-md bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-70 disabled:cursor-not-allowed"
                  :disabled="statusUpdating || statusMenuItems.length === 0"
                />
              </UDropdownMenu>
            </div>
            <div v-else class="inline-flex items-stretch">
              <!-- When transferred, hide actions; keep space minimal or show nothing -->
            </div>
            <div v-if="statusError" class="text-xs text-red-600 ml-2">{{ statusError }}</div>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full max-w-6xl mx-auto px-4 lg:px-6">
        <div v-if="loading" class="py-10 text-center text-gray-500">Đang tải...</div>
        <div v-else-if="error" class="py-10 text-center text-red-600">{{ error }}</div>
        <template v-else>
        <div class="flex flex-col lg:flex-row gap-6">
          <div class="flex-1 space-y-6">
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <div class="flex flex-col md:flex-row gap-4 md:gap-0">
                <div class="flex-1 flex flex-col pr-0 md:pr-6">
                  <label class="block text-sm font-medium mb-1">Kho xuất</label>
                  <div class="text-sm text-gray-900 font-medium">
                    {{ detail?.origin.name || '---' }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ detail?.origin.address || 'Không có địa chỉ' }}
                  </div>
                </div>
                <div class="hidden md:block bg-gray-200 mx-0 my-2" style="min-width:0.5px; width:0.5px; min-height:48px" />
                <div class="flex-1 flex flex-col pl-0 md:pl-6">
                  <label class="block text-sm font-medium mb-1">Kho nhập</label>
                  <div class="text-sm text-gray-900 font-medium">
                    {{ detail?.destination.name || '---' }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ detail?.destination.address || 'Không có địa chỉ' }}
                  </div>
                </div>
              </div>
            </UPageCard>
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Sản phẩm
                <template #actions>
                  <CustomCheckbox v-model="splitLine" class="text-sm font-normal">
                    Tách dòng
                  </CustomCheckbox>
                </template>
              </BaseCardHeader>
              <div class="flex items-center gap-2 mb-4 relative">
                <div class="flex-1">
                  <input type="text" class="w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Tìm theo tên, SKU, quét mã vạch... (F3)">
                </div>
                <button class="h-9 px-4 rounded-md border border-gray-300 bg-gray-50 text-sm font-medium hover:bg-gray-100">
                  Chọn nhiều
                </button>
              </div>
              <div class="-mx-4 lg:-mx-6">
                <template v-if="(detail?.items?.length || 0) > 0">
                  <table class="min-w-full w-full text-sm border-separate border-spacing-0">
                    <thead>
                      <tr class="bg-gray-50">
                        <th class="px-6 py-2 text-left font-semibold">
                          Sản phẩm
                        </th>
                        <th class="px-6 py-2 text-right font-semibold">
                          Tồn kho gốc
                        </th>
                        <th class="px-6 py-2 text-right font-semibold">
                          Số lượng
                        </th>
                        <th class="px-6 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(it, idx) in detail?.items || []" :key="it.id">
                        <td class="px-6 py-2">
                          <div class="flex items-center gap-2">
                            <div class="w-10 h-10 rounded bg-gray-100 inline-flex items-center justify-center text-gray-400">
                              —
                            </div>
                            <div>
                              <div class="font-medium">
                                {{ it.name }}
                              </div>
                              <div class="text-xs text-gray-500">
                                <template v-if="it.sku">SKU: {{ it.sku }}</template>
                                <template v-else>&mdash;</template>
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td class="px-6 py-2 text-right tabular-nums">
                          {{ it.availableQty }}
                        </td>
                        <td class="px-6 py-2 text-right">
                          <input
                            v-model.number="it.qty"
                            type="number"
                            min="0"
                            class="w-16 h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                        </td>
                        <td class="px-6 py-2 text-right">
                          <button class="text-gray-400 hover:text-error" @click="removeItem(idx)">
                            ×
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </template>
                <template v-else>
                  <TableEmptyState title="Chưa có sản phẩm" description="Phiếu chuyển kho này chưa có sản phẩm" />
                </template>
              </div>
            </UPageCard>

            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Lịch sử
              </BaseCardHeader>
              <div class="-mx-6 px-6 pb-4">
                <!-- Composer -->
                <div class="mb-4 rounded-md border border-gray-200">
                  <textarea
                    v-model="comment"
                    rows="3"
                    class="w-full rounded-t-md bg-white text-sm p-3 focus:outline-none"
                    placeholder="Leave a comment..."
                  />
                  <div class="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-b-md">
                    <div class="flex items-center gap-3 text-gray-500">
                      <button
                        type="button"
                        class="hover:text-gray-700"
                        title="Emoji"
                        aria-label="Emoji"
                      >
                        <span>😊</span>
                      </button>
                      <button
                        type="button"
                        class="hover:text-gray-700"
                        title="Mention"
                        aria-label="Mention"
                      >
                        <span>@</span>
                      </button>
                      <button
                        type="button"
                        class="hover:text-gray-700"
                        title="Attach"
                        aria-label="Attach"
                      >
                        <span>📎</span>
                      </button>
                      <span class="text-xs text-gray-500 hidden sm:inline">Only you and other staff can see comments</span>
                    </div>
                    <UButton
                      :disabled="!comment.trim()"
                      color="primary"
                      variant="solid"
                      @click="postComment"
                    >
                      Post
                    </UButton>
                  </div>
                </div>

                <!-- Timeline list styled like Orders page history -->
                <div>
                  <div v-if="!(detail?.timeline && detail.timeline.length)" class="text-sm">
                    <TableEmptyState title="Chưa có lịch sử" description="Chưa có hoạt động nào cho phiếu này" />
                  </div>
                  <ul v-else class="space-y-3">
                    <li v-for="h in historyLike" :key="h.id" class="flex gap-3">
                      <div class="flex flex-col items-center">
                        <div class="w-2 h-2 rounded-full bg-primary-500 mt-1" />
                        <div class="flex-1 w-px bg-gray-200" />
                      </div>
                      <div>
                        <div class="text-xs text-gray-500">
                          {{ formatDate(h.createdOn) }}
                        </div>
                        <div class="text-gray-800">
                          {{ h.message }}
                        </div>
                        <div v-if="h.actorName" class="text-xs text-gray-400">
                          {{ h.actorName }}
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </UPageCard>
          </div>

          <div class="w-full lg:w-80 space-y-6">
            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Ghi chú
              </BaseCardHeader>
              <div class="-mx-6 px-6 text-sm">
                <div v-if="!detail?.note" class="text-gray-500">
                  Chưa có ghi chú
                </div>
                <div v-else class="whitespace-pre-wrap">
                  {{ detail?.note }}
                </div>
              </div>
            </UPageCard>

            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Chi tiết chuyển kho
              </BaseCardHeader>
              <div class="-mx-6 px-6 pt-2 space-y-4 text-sm">
                <div class="flex flex-col">
                  <span class="text-gray-500">Ngày tạo</span>
                  <span class="mt-0.5 text-gray-800">{{ formatDate(detail?.dateCreated || '') }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-gray-500">Tên tham chiếu</span>
                  <span class="mt-0.5 text-gray-800">{{ detail?.referenceName || 'Không có' }}</span>
                </div>
              </div>
            </UPageCard>

            <UPageCard variant="soft" class="bg-white rounded-lg">
              <BaseCardHeader>
                Nhãn
                <template #actions>
                  <button type="button" class="text-primary-600 text-sm font-medium hover:underline">
                    Danh sách tag
                  </button>
                </template>
              </BaseCardHeader>
              <div class="-mx-6 px-6 pt-2 pb-4">
                <div class="flex items-center gap-2">
                  <input
                    type="text"
                    maxlength="40"
                    class="flex-1 h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Thêm tag"
                  >
                  <span class="text-xs text-gray-500">0/40</span>
                </div>
              </div>
            </UPageCard>
          </div>
        </div>

        <div v-if="!isTransferred" class="flex items-center justify-end mt-8 border-t border-transparent pt-4">
          <button
            class="h-9 px-5 rounded-md text-sm font-medium"
            :class="hasChanges ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'"
            :disabled="!hasChanges"
            @click="saveChanges"
          >
            Lưu
          </button>
        </div>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
