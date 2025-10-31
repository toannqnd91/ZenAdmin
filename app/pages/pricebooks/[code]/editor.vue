<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseTable, { type TableColumn } from '@/components/base/BaseTable.vue'
import { useRoute, useRouter } from 'vue-router'
import { priceBooksService } from '@/services'
import type { PriceBookMissingProduct } from '@/types/pricebook'

const route = useRoute()
const router = useRouter()
const code = computed(() => String(route.params.code || '').trim())

function goBack() {
  router.push(`/pricebooks/${code.value}`)
}

// State
const items = ref<PriceBookMissingProduct[]>([])
const loading = ref(false)
const q = ref('')
const rowSelection = ref<Record<string, boolean>>({})
const pagination = ref({ pageIndex: 0, pageSize: 25 })
const totalRecords = ref(0)
const totalPages = ref(1)
const currency = (n: number) => (n || 0).toLocaleString('vi-VN') + 'đ'
const hasSelection = computed(() => Object.values(rowSelection.value).some(Boolean))

// Image helpers (same as /products)
const config = useRuntimeConfig()
const publicCfg = config.public as Record<string, unknown> | undefined
const imageBaseUrl = typeof publicCfg?.imageBaseUrl === 'string' ? (publicCfg!.imageBaseUrl as string) : ''
const getThumbnail = (raw: Record<string, unknown>) => {
  const url = (raw as { thumbnailImageUrl?: string | null }).thumbnailImageUrl ?? null
  if (!url) return '/no-image.svg'
  if (!url.includes('/') && imageBaseUrl) return `${imageBaseUrl}/image/${url}`
  return url
}
const onImgError = (e: Event) => {
  const t = e.target as HTMLImageElement | null
  if (t) t.src = '/no-image.svg'
}
const getRowName = (raw: Record<string, unknown>) => String((raw as { name?: string }).name ?? '')
const getRowSku = (raw: Record<string, unknown>) => String((raw as { sku?: string | null }).sku ?? '—')

// Table rows (map API -> BaseTable)
const tableRows = computed(() =>
  items.value.map(it => ({
    id: it.id,
    product: `${it.name} ${it.sku || ''}`.trim(),
    name: it.name,
    sku: it.sku,
    thumbnailImageUrl: it.thumbnailImageUrl ?? null,
    basePrice: it.basePrice,
    price: it.appliedPrice,
    lock: it.alreadyExistsButInactive === true
  }))
)

const columns: TableColumn[] = [
  { key: 'product', label: 'Sản phẩm', class: 'py-3 text-left font-medium' },
  { key: 'basePrice', label: 'Giá gốc', class: 'py-3 text-right font-medium', align: 'right' },
  { key: 'price', label: 'Giá sản phẩm', class: 'py-3 text-right font-medium pr-12', align: 'right' }
]

const colWidths = ['', '', '']

// Actions / Edit modal
const showEditModal = ref(false)
const submitting = ref(false)
interface RowShape {
  id: number
  name: string
  sku: string
  price: number
  thumbnailImageUrl?: string | null
  lock?: boolean
}
const editingItem = ref<RowShape | null>(null)
const priceInput = ref<string>('')
const formatVND = (v: number | string) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(typeof v === 'string' ? Number(v) : v || 0)
// Parse a VND string like "12.000 đ" into 12000 (strip thousands separators, currency, spaces)
const parseVND = (s: string) => {
  const digits = String(s ?? '').replace(/[^\d-]/g, '')
  return digits ? Number(digits) : 0
}
function onEditRow(row: Record<string, unknown>) {
  const r = row as unknown as RowShape
  editingItem.value = {
    id: Number(r.id),
    name: String(r.name || ''),
    sku: String((r as { sku?: string }).sku || ''),
    price: Number((r as { price?: number }).price || 0),
    thumbnailImageUrl: (r as { thumbnailImageUrl?: string | null }).thumbnailImageUrl ?? null,
    lock: (r as { lock?: boolean }).lock ?? false
  }
  priceInput.value = formatVND(editingItem.value.price)
  showEditModal.value = true
}
const onResetPrice = () => {
  if (!editingItem.value) return
  priceInput.value = formatVND(editingItem.value.price)
}
function onConfirmEdit() {
  if (!editingItem.value) return
  const id = editingItem.value.id
  const newPrice = parseVND(priceInput.value)
  submitting.value = true
  ;(async () => {
    try {
      const res = await priceBooksService.addItemToPriceBook(code.value, {
        productId: id,
        priceType: 0, // 0: fixed price
        value: newPrice,
        isActived: false,
        note: ''
      })
      if (!res.success) throw new Error(res.message || 'Không thể thêm giá sản phẩm')

      // Refresh list (product should no longer be missing)
      await loadPage()

      const toast = useToast()
      toast.add({ title: 'Đã cập nhật giá', color: 'success' })
      showEditModal.value = false
    } catch (err: unknown) {
      const toast = useToast()
      const msg = err instanceof Error ? err.message : String(err)
      toast.add({ title: 'Lỗi cập nhật', description: msg, color: 'error' })
    } finally {
      submitting.value = false
    }
  })()
}
function onPriceInput(e: Event) {
  const el = e.target as HTMLInputElement
  const digits = (el.value || '').replace(/\D/g, '')
  const num = digits ? Number(digits) : 0
  priceInput.value = formatVND(num)
}
// delete action removed per requirement

// Fetch missing products with server-side pagination
async function loadPage() {
  if (!code.value) return
  loading.value = true
  try {
    const page = (pagination.value.pageIndex ?? 0) + 1
    const size = pagination.value.pageSize ?? 25
    const res = await priceBooksService.getMissingProductsByCode(code.value, page, size, q.value)
    if (res.success) {
      items.value = res.data?.items || []
      totalRecords.value = res.data?.pagination?.total ?? items.value.length
      totalPages.value = res.data?.pagination?.totalPages ?? 1
    } else {
      console.error('Fetch missing products failed:', res.message)
    }
  } catch (err) {
    console.error('Fetch missing products error:', err)
  } finally {
    loading.value = false
  }
}

onMounted(loadPage)
watch(pagination, loadPage, { deep: true })

// Debounce keyword search
let _t: ReturnType<typeof setTimeout> | undefined
watch(q, (_val) => {
  if (_t) clearTimeout(_t)
  _t = setTimeout(() => {
    pagination.value.pageIndex = 0
    loadPage()
  }, 300)
})
</script>

<!-- eslint-disable vue/max-attributes-per-line, vue/html-closing-bracket-newline, vue/singleline-html-element-content-newline, vue/html-indent, vue/first-attribute-linebreak, vue/html-self-closing -->
<template>
  <UDashboardPanel id="pricebook-editor" class="flex flex-col h-full">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <div class="flex items-center gap-3">
            <button class="h-8 w-8 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50" @click="goBack">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div>
              <div class="text-lg font-semibold">Danh sách sản phẩm chưa trong bảng giá</div>
              <div class="text-xs text-gray-500">Mã: {{ code }}</div>
            </div>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full flex flex-col h-full">
        <div class="flex-1 min-h-0 px-4 lg:px-6 py-5">
          <BaseTable
            v-model:q="q"
            v-model:row-selection="rowSelection"
            v-model:pagination="pagination"
            :query-sync="{ pageKey: 'page', qKey: 'q' }"
            :data="tableRows"
            :loading="loading"
            :total-records="totalRecords"
            :total-pages="totalPages"
            :columns="columns"
            :col-widths="colWidths"
            :show-row-actions="true"
            :actions="[]"
            :show-selection-delete="false"
            title="Danh sách sản phẩm chưa trong bảng giá"
            :show-filter="false"
          >
            <template #search-actions>
              <button class="h-9 px-3 rounded-md bg-primary-600 text-white text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed" type="button" :disabled="!hasSelection">
                Thêm vào danh sách
              </button>
            </template>

              <template #column-product="{ item }">
                <div class="flex items-center gap-4">
                  <div class="h-11 w-11 rounded-md bg-gray-100 overflow-hidden flex items-center justify-center">
                    <img :src="getThumbnail(item as Record<string, unknown>)" :alt="getRowName(item as Record<string, unknown>)" class="h-full w-full object-cover" @error="onImgError">
                  </div>
                  <div class="flex flex-col">
                    <div class="text-[15px] text-gray-900 font-medium">{{ getRowName(item as Record<string, unknown>) }}</div>
                    <div class="text-xs text-gray-500">SKU: {{ getRowSku(item as Record<string, unknown>) }}</div>
                  </div>
                </div>
              </template>

            <template #column-basePrice="{ value }">
              <span class="block text-right text-gray-700">{{ currency(Number(value || 0)) }}</span>
            </template>

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

            <template #row-actions="{ item: _item }">
              <div class="flex items-center justify-end gap-2">
                <button class="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-gray-100" title="Sửa" type="button" @click.stop="onEditRow(_item)">
                  <svg class="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                    <path d="M14.06 4.69l3.75 3.75" />
                  </svg>
                </button>
              </div>
            </template>
          </BaseTable>

          <div class="text-center text-sm text-gray-500 mt-8">
            Tìm hiểu thêm về <a href="#" class="text-primary-600 hover:underline">bảng giá</a>
          </div>

          <!-- Edit price modal -->
          <BaseModal v-model="showEditModal" title="Chỉnh sửa giá sản phẩm" width-class="max-w-2xl">
            <div v-if="editingItem" class="flex items-center justify-between gap-4">
              <div class="flex items-center gap-4">
                <div class="h-11 w-11 rounded-md bg-gray-100 overflow-hidden flex items-center justify-center">
                  <img :src="getThumbnail(editingItem as unknown as Record<string, unknown>)" :alt="editingItem.name" class="h-full w-full object-cover" @error="onImgError">
                </div>
                <div>
                  <div class="text-[15px] font-medium text-blue-600">{{ editingItem.name }}</div>
                  <div class="text-xs text-gray-500">SKU: {{ editingItem.sku || '—' }}</div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span v-if="editingItem.lock" class="text-yellow-600" title="Khoá">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                  </svg>
                </span>
                <div class="relative">
                  <input
                    :value="priceInput"
                    type="text"
                    inputmode="numeric"
                    class="h-9 w-40 pr-10 pl-3 rounded-md border border-gray-300 bg-white text-right text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    @input="onPriceInput"
                    @blur="priceInput = formatVND(parseVND(priceInput))"
                  >
                  <span class="absolute inset-y-0 right-7 flex items-center text-gray-400 select-none">đ</span>
                  <button class="absolute inset-y-0 right-1 px-1 text-gray-500 hover:text-gray-700" type="button" title="Khôi phục" @click="onResetPrice">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 2v6h-6" />
                      <path d="M3 12a9 9 0 0115-6.7L21 8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <template #footer>
              <div class="flex items-center justify-end gap-3 w-full">
                <button type="button" class="h-9 px-4 rounded-md border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50" @click="showEditModal=false">Hủy</button>
                <button type="button" class="h-9 px-5 rounded-md bg-primary-600 text-white text-sm font-medium disabled:opacity-50" :disabled="!editingItem || submitting" @click="onConfirmEdit">Xác nhận</button>
              </div>
            </template>
          </BaseModal>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
