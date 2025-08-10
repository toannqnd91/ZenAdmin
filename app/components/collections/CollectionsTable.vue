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
}>()

const columns: TableColumn[] = [
  {
    key: 'name',
    label: 'Tên bộ sưu tập'
  },
  {
    key: 'description',
    label: 'Mô tả'
  },
  {
    key: 'isPublished',
    label: 'Trạng thái'
  }
]

// Map collections (strongly typed) to records expected by BaseTable
const tableData = computed(() =>
  props.data.map(c => ({
    id: c.id,
    name: c.name,
    description: c.description,
    imageUrl: c.imageUrl,
    isPublished: c.isPublished
  }))
)
</script>

<template>
  <BaseTable
    :columns="columns"
  :data="tableData"
    :loading="props.loading"
    :q="props.q"
    :row-selection="props.rowSelection"
    :pagination="props.pagination"
    title="Danh sách bộ sưu tập"
    @update:q="emit('update:q', $event)"
    @update:row-selection="emit('update:rowSelection', $event)"
    @update:pagination="emit('update:pagination', $event)"
  >
    <template #column-name="{ item }">
      <div class="flex items-center gap-2">
  <img v-if="item.imageUrl" :src="item.imageUrl as string" class="w-8 h-8 rounded object-cover">
        <span>{{ item.name }}</span>
      </div>
    </template>
    <template #column-description="{ item }">
      <span>{{ item.description || 'Không có mô tả' }}</span>
    </template>
    <template #column-isPublished="{ item }">
      <span v-if="item.isPublished" class="text-green-600">Đã xuất bản</span>
      <span v-else class="text-gray-400">Nháp</span>
    </template>
  </BaseTable>
</template>
