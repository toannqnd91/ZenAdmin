<script setup lang="ts">
import type { TableColumn } from '@/components/base/BaseTable.vue'
import BaseTable from '@/components/base/BaseTable.vue'
import type { Collection } from '@/composables/useCollectionsService'

interface Props {
  data: Collection[]
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
  'delete': [number[]]
}>()

const columns: TableColumn[] = [
  {
    key: 'name',
    label: 'Tên bộ sưu tập',
    class: 'py-3 text-left font-medium'
  },
  // Removed description column
  {
    key: 'isPublished',
    label: 'Trạng thái',
    class: 'py-3 text-left font-medium'
  }
]

// Cấu hình chiều rộng các cột tương tự như WidgetsTable
const colWidths = [
  // '38%', // name (wider since description removed)
  // '10%'  // isPublished
]

const addButton = {
  label: 'Thêm bộ sưu tập',
  href: '/collections/create'
}

// Map collections (strongly typed) to records expected by BaseTable
const tableData = computed(() =>
  props.data.map(c => ({
    id: c.id,
    name: c.name,
    imageUrl: c.imageUrl,
    isPublished: c.isPublished
  }))
)

// Handle delete action - convert string IDs back to numbers
const handleDelete = (selectedIds: string[]) => {
  const numericIds = selectedIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id))
  emit('delete', numericIds)
}
</script>

<template>
  <BaseTable
    :columns="columns"
    :col-widths="colWidths"
    :data="tableData"
    :loading="props.loading"
    :q="props.q"
    :row-selection="props.rowSelection"
    :pagination="props.pagination"
    :add-button="addButton"
    title="Danh sách bộ sưu tập"
    @update:q="emit('update:q', $event)"
    @update:row-selection="emit('update:rowSelection', $event)"
    @update:pagination="emit('update:pagination', $event)"
    @delete="handleDelete"
  >
    <template #column-name="{ item }">
      <div class="flex items-center gap-4">
  <div class="h-11 w-11 rounded-md bg-gray-100 overflow-hidden flex items-center justify-center">
          <img
            :src="(item as any).imageUrl || '/no-image.svg'"
            :alt="(item as any).name"
            class="h-full w-full object-cover"
            @error="e => { const t = e.target as HTMLImageElement; if (t) t.src = '/no-image.svg' }"
          >
        </div>
        <div class="text-[15px] text-gray-900 font-medium">
          {{ (item as any).name }}
        </div>
      </div>
    </template>
  <!-- description column removed -->
    <template #column-isPublished="{ item }">
      <span v-if="(item as any).isPublished" class="text-green-600">Đã xuất bản</span>
      <span v-else class="text-gray-400">Nháp</span>
    </template>
  </BaseTable>
</template>

<script lang="ts">
// Hàm loại bỏ thẻ HTML và giới hạn số từ
function stripHtmlAndLimitWords(html: string, maxWords = 30): string {
  if (!html) return ''
  // Loại bỏ thẻ HTML
  const text = html.replace(/<[^>]*>/g, ' ')
  // Cắt và ghép lại tối đa maxWords từ
  const words = text.split(/\s+/).filter(Boolean)
  return words.slice(0, maxWords).join(' ') + (words.length > maxWords ? '...' : '')
}
</script>
