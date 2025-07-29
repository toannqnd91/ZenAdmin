<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { NewsItem } from '@/composables/useNews'
import type { Row } from '@tanstack/table-core'
import { getPaginationRowModel } from '@tanstack/table-core'
import { fileService } from '@/services/file.service'

interface Props {
  data: NewsItem[]
  loading: boolean
  q: string
  rowSelection: Record<string, unknown>
  pagination: {
    pageIndex: number
    pageSize: number
  }
  truncateText: (text: string, wordLimit?: number) => string
  getRowItems: (row: Row<NewsItem>) => unknown[]
  onRowClick?: (item: NewsItem) => void
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:q': [value: string]
  'update:rowSelection': [value: Record<string, unknown>]
  'update:pagination': [value: { pageIndex: number, pageSize: number }]
}>()

// Handle row click
const handleRowClick = (item: NewsItem) => {
  if (props.onRowClick) {
    props.onRowClick(item)
  }
}

// Handle table click to detect row clicks
const onTableClick = (event: Event) => {
  const target = event.target as HTMLElement
  const row = target.closest('tbody tr')
  if (row && !target.closest('button') && !target.closest('[role="button"]')) {
    const rowIndex = Array.from(row.parentElement!.children).indexOf(row)
    
    // Calculate actual index considering pagination
    const currentPage = props.pagination.pageIndex
    const pageSize = props.pagination.pageSize
    const actualIndex = currentPage * pageSize + rowIndex
    
    const newsItem = filtered.value[actualIndex]
    if (newsItem) {
      handleRowClick(newsItem)
    }
  }
}

const UDropdownMenu = resolveComponent('UDropdownMenu')
const UButton = resolveComponent('UButton')
const UCheckbox = resolveComponent('UCheckbox')

const table = useTemplateRef('table')

const filtered = computed(() =>
  props.data.filter(item => item.title.toLowerCase().includes(props.q.toLowerCase()))
)

const columns: TableColumn<NewsItem>[] = [
  {
    id: 'select',
    header: ({ table }) =>
      h(UCheckbox, {
        'modelValue': table.getIsSomePageRowsSelected()
          ? 'indeterminate'
          : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          table.toggleAllPageRowsSelected(!!value),
        'ariaLabel': 'Select all'
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        'modelValue': row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
        'ariaLabel': 'Select row'
      })
  },
  {
    accessorKey: 'title',
    header: 'Tiêu đề',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-3' }, [
        h('img', {
          src: fileService.getFileUrl(row.original.imageUrl) || '/no-image.svg',
          alt: row.original.title,
          class: 'w-12 h-12 object-cover flex-shrink-0',
          onError: (e: Event) => {
            const target = e.target as HTMLImageElement
            target.src = '/no-image.svg'
          }
        }),
        h('div', undefined, [
          h('p', { class: 'font-medium text-highlighted' }, row.original.title),
          h('p', { class: 'text-sm text-muted line-clamp-2' }, props.truncateText(row.original.desc))
        ])
      ])
    }
  },
  {
    accessorKey: 'categories',
    header: 'Danh mục',
    cell: ({ row }) => {
      const categories = row.original.categories || []
      return categories.length > 0
        ? categories.map(cat => cat.name).join(', ')
        : 'Chưa phân loại'
    }
  },
  {
    accessorKey: 'createdDate',
    header: 'Ngày tạo',
    cell: ({ row }) => {
      const date = new Date(row.original.createdDate)
      return date.toLocaleDateString('vi-VN')
    }
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) =>
      h('div', { class: 'flex justify-end pr-2' }, [
        h(
          UDropdownMenu,
          {
            items: [
              [
                {
                  label: 'Copy ID',
                  icon: 'i-lucide-copy',
                  click: () => console.log('Copy ID:', row.original.id)
                },
                {
                  label: 'View details',
                  icon: 'i-lucide-list',
                  click: () => console.log('View details:', row.original)
                },
                {
                  label: 'Edit news',
                  icon: 'i-lucide-edit',
                  click: () => console.log('Edit news:', row.original)
                }
              ],
              [
                {
                  label: 'Delete news',
                  icon: 'i-lucide-trash',
                  click: () => console.log('Delete news:', row.original)
                }
              ]
            ]
          },
          {
            default: () =>
              h(UButton, {
                icon: 'i-lucide-ellipsis-vertical',
                color: 'neutral',
                variant: 'ghost',
                class: 'ml-auto'
              })
          }
        )
      ])
  }
]
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Search & Actions Bar -->
    <div class="flex flex-wrap items-center justify-between gap-1.5 mb-4">
      <UInput :model-value="q" placeholder="Tìm kiếm tin tức..." icon="i-lucide-search" class="max-w-sm"
        @update:model-value="emit('update:q', $event)" />

      <div class="flex flex-wrap items-center gap-1.5">
        <NewsDeleteModal :count="(table as any)?.tableApi?.getFilteredSelectedRowModel().rows.length">
          <UButton v-if="(table as any)?.tableApi?.getFilteredSelectedRowModel().rows.length" label="Delete"
            color="error" variant="subtle" icon="i-lucide-trash">
            <template #trailing>
              <UKbd>
                {{ (table as any)?.tableApi?.getFilteredSelectedRowModel().rows.length }}
              </UKbd>
            </template>
          </UButton>
        </NewsDeleteModal>
      </div>
    </div>

    <!-- Data Table -->
    <UTable 
      ref="table" 
      :model-value="rowSelection" 
      :pagination="pagination" 
      :pagination-options="{
        getPaginationRowModel: getPaginationRowModel()
      }" 
      :data="filtered" 
      :columns="columns" 
      :loading="loading" 
      class="shrink-0 flex-1" 
      :ui="{
        base: 'table-fixed border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
        tbody: '[&>tr]:last:[&>td]:border-b-0 [&>tr]:cursor-pointer [&>tr:hover]:bg-gray-50',
        th: 'py-3 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r first:w-10',
        td: 'border-b border-default first:w-10'
      }" 
      @update:model-value="emit('update:rowSelection', $event)"
      @update:pagination="emit('update:pagination', $event)"
      @click="onTableClick"
    />    <!-- Pagination Info - Pinned to bottom -->
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
