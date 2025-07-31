<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { WidgetInstance } from '@/composables/useWidgets'
import type { Row } from '@tanstack/table-core'

interface Props {
  data: WidgetInstance[]
  loading: boolean
  q: string
  rowSelection: Record<string, unknown>
  pagination: {
    pageIndex: number
    pageSize: number
  }
  getRowItems: (row: Row<WidgetInstance>) => unknown[]
  formatDate: (date: string) => string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:q': [value: string]
  'update:rowSelection': [value: Record<string, unknown>]
  'update:pagination': [value: { pageIndex: number, pageSize: number }]
}>()

const table = useTemplateRef('table')

const filtered = computed(() =>
  props.data.filter(item => item.name.toLowerCase().includes(props.q.toLowerCase()))
)

const columns: TableColumn<WidgetInstance>[] = [
  {
    accessorKey: 'name',
    header: 'Tên widget',
    cell: ({ row }) => h('span', row.original.name)
  },
  {
    accessorKey: 'widgetType',
    header: 'Loại widget',
    cell: ({ row }) => h('span', row.original.widgetType)
  },
  {
    accessorKey: 'widgetZone',
    header: 'Vị trí',
    cell: ({ row }) => h('span', row.original.widgetZone)
  },
  {
    accessorKey: 'publishStart',
    header: 'Bắt đầu',
    cell: ({ row }) => h('span', props.formatDate(row.original.publishStart))
  },
  {
    accessorKey: 'publishEnd',
    header: 'Kết thúc',
    cell: ({ row }) => h('span', props.formatDate(row.original.publishEnd))
  },
  {
    accessorKey: 'displayOrder',
    header: 'Thứ tự',
    cell: ({ row }) => h('span', row.original.displayOrder)
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => h('div', { class: 'flex justify-end pr-2' }, [
      ...props.getRowItems(row).map((item: any) => {
        if (item.type === 'label') {
          return null
        }
        if (item.type === 'separator') {
          return null
        }
        return h('button', {
          class: [
            'inline-flex items-center justify-center w-8 h-8 rounded',
            'hover:bg-gray-100',
            'mr-2'
          ],
          title: item.label,
          onClick: item.onSelect
        }, [
          h(resolveComponent('UIcon'), { name: item.icon, class: 'w-5 h-5 text-gray-500' })
        ])
      })
    ])
  }
]
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Search Bar -->
    <div class="flex flex-wrap items-center justify-between gap-1.5 mb-4">
      <UInput :model-value="q" placeholder="Tìm kiếm widget..." icon="i-lucide-search" class="max-w-sm"
        @update:model-value="emit('update:q', $event)" />
    </div>

    <!-- Data Table -->
    <UTable
      ref="table"
      :model-value="rowSelection"
      :pagination="pagination"
      :data="filtered"
      :columns="columns"
      :loading="loading"
      class="shrink-0 flex-1"
      :ui="{
        base: 'table-fixed border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
        tbody: '[&>tr]:last:[&>td]:border-b-0 [&>tr]:cursor-pointer [&>tr:hover]:bg-gray-50',
        th: 'py-3 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
        td: 'border-b border-default'
      }"
      @update:model-value="emit('update:rowSelection', $event)"
      @update:pagination="emit('update:pagination', $event)"
    />

    <!-- Pagination Info -->
    <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
      <div class="text-sm text-muted">
        {{ (table as any)?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} of
        {{ (table as any)?.tableApi?.getFilteredRowModel().rows.length || 0 }} row(s) selected.
      </div>

      <div class="flex items-center gap-1.5">
        <UPagination :default-page="((table as any)?.tableApi?.getState().pagination.pageIndex || 0) + 1"
          :items-per-page="(table as any)?.tableApi?.getState().pagination.pageSize"
          :total="(table as any)?.tableApi?.getFilteredRowModel().rows.length"
          @update:page="(p: number) => (table as any)?.tableApi?.setPageIndex(p - 1)" />
      </div>
    </div>
  </div>
</template>
