<script setup lang="ts">
import type { TableColumn } from '@/components/base/BaseTable.vue'
import BaseTable from '@/components/base/BaseTable.vue'

interface Brand {
  id: number | string
  slug: string
  name: string
  isPublished: boolean
  logoUrl: string
}

interface Props {
  data: Brand[]
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
  'delete': [string[]]
}>()

const columns: TableColumn[] = [
  {
    key: 'name',
    label: 'Tên thương hiệu',
    class: 'py-3 text-left font-medium'
  }
]

const addButton = {
  label: 'Thêm thương hiệu',
  href: '/brands/create'
}

const handleRowClick = (item: Record<string, unknown>) => {
  const brandItem = item as unknown as Brand
  navigateTo(`/brands/${brandItem.id}/update`)
}

const tableData = computed(() =>
  props.data.map((b: Brand) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    isPublished: b.isPublished,
    logoUrl: b.logoUrl
  }))
)
</script>

<template>
  <BaseTable
    :q="q"
    :row-selection="rowSelection"
    :pagination="pagination"
    :data="tableData"
    :loading="loading"
    title="Thương hiệu"
    :columns="columns"
    :add-button="addButton"
    :row-click-handler="handleRowClick"
    search-placeholder="Tìm kiếm thương hiệu..."
    @update:q="emit('update:q', $event)"
    @update:row-selection="emit('update:rowSelection', $event)"
    @update:pagination="emit('update:pagination', $event)"
    @delete="ids => emit('delete', ids)"
  >
    <!-- Custom name column with logo -->
    <template #column-name="{ item }">
      <div class="flex items-center gap-4">
        <div class="h-11 w-11 rounded-md bg-gray-100 overflow-hidden flex items-center justify-center">
          <img
            :src="(item as any).logoUrl || '/no-image.svg'"
            :alt="(item as any).name"
            class="h-full w-full object-cover"
            @error="(e: any) => e.target && (e.target.src='/no-image.svg')"
          >
        </div>
        <div class="text-[15px] text-gray-900 font-medium">
          {{ (item as any).name }}
        </div>
      </div>
    </template>
  <!-- Ẩn cột isPublished -->
  </BaseTable>
</template>
