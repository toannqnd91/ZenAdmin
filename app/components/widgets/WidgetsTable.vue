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
    header: 'Name',
    cell: ({ row }) => h('span', row.original.name)
  },
  {
    accessorKey: 'widgetType',
    header: 'Widget Type',
    cell: ({ row }) => h('span', row.original.widgetType)
  },
  {
    accessorKey: 'widgetZone',
    header: 'Widget Zone',
    cell: ({ row }) => h('span', row.original.widgetZone)
  },
  {
    accessorKey: 'publishStart',
    header: 'Publish Start',
    cell: ({ row }) => h('span', props.formatDate(row.original.publishStart))
  },
  {
    accessorKey: 'publishEnd',
    header: 'Publish End',
    cell: ({ row }) => h('span', props.formatDate(row.original.publishEnd))
  },
  {
    accessorKey: 'displayOrder',
    header: 'Display Order',
    cell: ({ row }) => h('span', row.original.displayOrder)
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => h('div', { class: 'flex justify-end pr-2' }, [
      ...props.getRowItems(row).map((item: any) => {
        if (item.type === 'separator') {
          return h('span', { class: 'mx-2 text-gray-300' }, '|')
        }
        if (item.type === 'label') {
          return h('span', { class: 'font-bold mr-2' }, item.label)
        }
        return h('button', {
          class: [
            'inline-flex items-center justify-center w-8 h-8 rounded',
            item.color === 'error' ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white',
            'mr-2'
          ],
          title: item.label,
          onClick: item.onSelect
        }, [
          h('i', { class: item.icon }),
        ])
      })
    ])
  }
]
</script>

<template>
  <UTable
    ref="table"
    :model-value="rowSelection"
    :pagination="pagination"
    :data="filtered"
    :columns="columns"
    :loading="loading"
    class="shrink-0 flex-1"
    @update:model-value="emit('update:rowSelection', $event)"
    @update:pagination="emit('update:pagination', $event)"
  />
</template>
