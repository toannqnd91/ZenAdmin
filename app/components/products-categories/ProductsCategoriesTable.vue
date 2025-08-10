<script setup lang="ts">
import { computed } from 'vue'

interface ProductCategory {
  id: number | string
  name: string
  description?: string
  imageUrl?: string | null
}

interface Props {
  data: ProductCategory[]
  loading: boolean
  q: string
  rowSelection: Record<string, boolean>
  pagination: { pageIndex: number, pageSize: number }
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:q': [string]
  'update:rowSelection': [Record<string, boolean>]
  'update:pagination': [{ pageIndex: number, pageSize: number }]
}>()

/* filter + paging */
const filtered = computed(() =>
  (props.data || []).filter(c =>
    (c.name || '').toLowerCase().includes((props.q || '').toLowerCase())
  )
)
const start = computed(() => props.pagination.pageIndex * props.pagination.pageSize)
const end = computed(() => start.value + props.pagination.pageSize)
const pageItems = computed(() => filtered.value.slice(start.value, end.value))

/* selection */
const isSelected = (id: string | number) => !!props.rowSelection?.[String(id)]
const setRowSelected = (id: string | number, v: boolean) => {
  const next = { ...(props.rowSelection || {}) }
  next[String(id)] = v
  emit('update:rowSelection', next)
}
const selectedCount = computed(() => Object.values(props.rowSelection || {}).filter(Boolean).length)

const pageAllSelected = computed(() => pageItems.value.length > 0 && pageItems.value.every(it => isSelected(it.id)))
const pageSomeSelected = computed(() => pageItems.value.some(it => isSelected(it.id)))
const selectAllState = computed<'none' | 'some' | 'all'>(() =>
  pageAllSelected.value ? 'all' : (pageSomeSelected.value ? 'some' : 'none')
)

const toggleAllPage = () => {
  const targetValue = !(selectAllState.value === 'all')
  const next = { ...(props.rowSelection || {}) }
  for (const it of pageItems.value) next[String(it.id)] = targetValue
  emit('update:rowSelection', next)
}

/* navigation */
const goto = (id: string | number) => navigateTo(`/products-categories/${id}/update`)
const onBodyClick = (e: Event) => {
  const t = e.target as HTMLElement
  if (t.closest('[data-role="chk"]') || t.closest('button') || t.closest('[role="button"]')) return
  const tr = t.closest('tbody tr') as HTMLTableRowElement | null
  if (!tr) return
  const idx = Array.from(tr.parentElement!.children).indexOf(tr)
  const item = pageItems.value[idx]
  if (item) goto(item.id)
}

const onCheckboxKey = (e: KeyboardEvent, handler: () => void) => {
  if (e.code === 'Space' || e.key === ' ') {
    e.preventDefault()
    handler()
  }
}
</script>

<template>
  <div class="bg-white border-gray-200">
    <!-- Top bar -->
    <div class="flex items-center justify-between gap-3 px-6 py-5">
      <h2 class="text-lg font-semibold">
        Danh mục sản phẩm
      </h2>

      <div class="flex items-center gap-3">
        <button
          class="h-9 w-9 inline-flex items-center justify-center rounded-md
                  border border-gray-300 bg-white hover:bg-gray-50
                  focus:outline-none focus:ring-2 focus:ring-blue-400"
          style="aspect-ratio: 1 / 1 !important;"
          title="Filter"
          aria-label="Filter"
        >
          <svg
            class="w-4 h-4 text-gray-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M6 3h12v4l-4 4v8l-4-2v-6l-4-4V3z" />
          </svg>
        </button>

        <div class="relative w-full max-w-xs">
          <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-500">
            <svg
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
              />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm danh mục..."
            class="h-9 w-full pl-9 pr-3 rounded-md border border-gray-300 bg-white placeholder:text-gray-400 text-gray-800 focus:outline-none focus:border-gray-400 focus:ring-0 text-sm"
            :value="q"
            @input="$emit('update:q', ($event.target as HTMLInputElement).value)"
          >
        </div>

        <button
          class="h-9 px-4 inline-flex items-center gap-2 rounded-md bg-[#1b64f2] hover:bg-[#155ae0] text-white font-medium whitespace-nowrap"
          @click="navigateTo('/products-categories/create')"
        >
          Thêm danh mục
          <svg
            class="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </div>

    <div class="border-t border-gray-200" />

    <!-- Selection toolbar -->
    <div
      v-if="selectedCount > 0"
      class="px-6"
    >
      <div class="flex items-center h-14 border-b border-gray-200">
        <!-- căn trái để mép checkbox trùng lề tiêu đề -->
        <div class="w-14 h-full flex items-center justify-start">
          <button
            type="button"
            class="inline-flex items-center justify-center h-5 w-5 rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-1
                   bg-[#1b64f2] border-[#1b64f2] text-white"
            aria-label="Toggle all on page"
            @click="toggleAllPage"
          >
            <svg
              v-if="selectAllState!=='all'"
              class="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
            >
              <path d="M5 12h14" />
            </svg>
            <svg
              v-else
              class="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        </div>

        <span class="text-lg font-medium ml-2">{{ selectedCount }} selected</span>

        <div class="flex items-center gap-2 ml-6">
          <button
            type="button"
            class="h-9 inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 text-sm bg-white hover:bg-gray-50"
          >
            Change Status
            <svg
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M16.862 5.487a2.06 2.06 0 0 1 2.915 2.914l-9.193 9.193-3.09.343a.5.5 0 0 1-.553-.553l.343-3.09 9.193-9.193Z" />
              <path d="M15.5 7.5l1 1" />
            </svg>
          </button>
          <button
            type="button"
            class="h-9 inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 text-sm bg-white hover:bg-gray-50"
          >
            Archived
            <svg
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect
                x="3"
                y="7"
                width="18"
                height="13"
                rx="2"
              />
              <path d="M16 3v4M8 3v4M3 7h18" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div
      class="px-6"
      @click="onBodyClick"
    >
      <table class="w-full table-fixed text-sm">
        <thead
          v-show="selectedCount === 0"
          class="text-gray-500"
        >
          <tr class="h-14">
            <th class="py-0 w-14">
              <div class="w-14 h-full flex items-center justify-start">
                <button
                  data-role="chk"
                  type="button"
                  role="checkbox"
                  :aria-checked="selectAllState==='all' ? 'true' : (selectAllState==='some' ? 'mixed' : 'false')"
                  :title="selectAllState==='all' ? 'Unselect all' : 'Select all'"
                  :class="[
                    'inline-flex items-center justify-center h-5 w-5 rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-1',
                    selectAllState==='none'
                      ? 'bg-white border-gray-300 text-gray-400 focus:ring-blue-400'
                      : 'bg-[#1b64f2] border-[#1b64f2] text-white focus:ring-blue-400'
                  ]"
                  @click="toggleAllPage"
                  @keydown="onCheckboxKey($event, toggleAllPage)"
                >
                  <svg
                    v-if="selectAllState==='all'"
                    class="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <svg
                    v-else-if="selectAllState==='some'"
                    class="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                  >
                    <path d="M5 12h14" />
                  </svg>
                </button>
              </div>
            </th>
            <th class="py-3 text-left font-medium">
              Tên danh mục
            </th>
            <th class="py-3 text-left font-medium">
              Mô tả
            </th>
            <th class="py-3 text-right font-medium pr-4" />
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="c in pageItems"
            :key="c.id"
            class="group/row border-t border-gray-200 row-band"
            :class="{ 'is-active': isSelected(c.id) }"
          >
            <!-- Row checkbox -->
            <td class="py-4 w-14 align-middle">
              <div class="w-14 h-full flex items-center justify-start">
                <button
                  data-role="chk"
                  type="button"
                  role="checkbox"
                  :aria-checked="isSelected(c.id) ? 'true' : 'false'"
                  :class="[
                    'inline-flex items-center justify-center h-5 w-5 rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-1',
                    isSelected(c.id)
                      ? 'bg-[#1b64f2] border-[#1b64f2] text-white focus:ring-blue-400'
                      : 'bg-white border-gray-300 text-gray-400 focus:ring-blue-400'
                  ]"
                  @click="setRowSelected(c.id, !isSelected(c.id))"
                  @keydown="onCheckboxKey($event, () => setRowSelected(c.id, !isSelected(c.id)))"
                >
                  <svg
                    v-if="isSelected(c.id)"
                    class="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
              </div>
            </td>

            <!-- name + thumbnail -->
            <td class="py-4">
              <div class="flex items-center gap-4">
                <div class="h-14 w-14 rounded-md bg-gray-100 overflow-hidden flex items-center justify-center">
                  <img
                    :src="c.imageUrl || '/no-image.svg'"
                    :alt="c.name"
                    class="h-full w-full object-cover"
                    @error="(e: any) => e.target && (e.target.src='/no-image.svg')"
                  >
                </div>
                <div class="text-[15px] text-gray-900 font-medium">
                  {{ c.name }}
                </div>
              </div>
            </td>

            <!-- description -->
            <td class="py-4">
              <div class="text-sm text-gray-500">
                {{ c.description || 'Không có mô tả' }}
              </div>
            </td>

            <!-- actions -->
            <td class="py-4 pr-4">
              <div class="flex justify-end">
                <button
                  type="button"
                  class="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-gray-100"
                  @click.stop
                >
                  <svg
                    class="w-5 h-5 text-gray-700"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <circle
                      cx="12"
                      cy="6"
                      r="1"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="1"
                    />
                    <circle
                      cx="12"
                      cy="18"
                      r="1"
                    />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="h-6 border-t border-gray-200" />
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between px-6 pb-4">
      <div class="text-sm text-gray-500">
        {{ selectedCount }} selected.
      </div>
      <div
        v-if="filtered.length > pagination.pageSize"
        class="flex items-center gap-2"
      >
        <button
          class="px-3 py-1.5 border rounded-md text-sm"
          :disabled="pagination.pageIndex===0"
          @click="$emit('update:pagination', { ...pagination, pageIndex: pagination.pageIndex-1 })"
        >
          Prev
        </button>
        <span class="text-sm">Page {{ pagination.pageIndex + 1 }}</span>
        <button
          class="px-3 py-1.5 border rounded-md text-sm"
          :disabled="(pagination.pageIndex + 1) * pagination.pageSize >= filtered.length"
          @click="$emit('update:pagination', { ...pagination, pageIndex: pagination.pageIndex+1 })"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Hiệu ứng "đậm ở giữa – mờ dần 2 bên", giống đoạn bạn tham khảo */
.row-band:hover,
.row-band.is-active{
  /* 270deg: trái -> phải (giữa đậm #f9f8f7) */
  background-image: linear-gradient(
    270deg,
    rgba(255, 255, 255, 0) 0%,
    #f9f8f7 25%,
    #f9f8f7 71%,
    rgba(255, 255, 255, 0) 100%
  );
}
/* Mượt mà khi vào/ra hover */
.row-band{
  transition: background-image .2s ease;
}
</style>
