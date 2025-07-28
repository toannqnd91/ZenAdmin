<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { ProductItem } from '@/composables/useProducts'
import type { Row } from '@tanstack/table-core'
import { getPaginationRowModel } from '@tanstack/table-core'

interface Props {
  data: ProductItem[]
  loading: boolean
  q: string
  rowSelection: Record<string, unknown>
  pagination: {
    pageIndex: number
    pageSize: number
  }
  truncateText: (text: string | null | undefined, wordLimit?: number) => string
  getFirstImageUrl: (imageUrls: string[]) => string | undefined
  getRowItems: (row: Row<ProductItem>) => unknown[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:q': [value: string]
  'update:rowSelection': [value: Record<string, unknown>]
  'update:pagination': [value: { pageIndex: number, pageSize: number }]
}>()

const UDropdownMenu = resolveComponent('UDropdownMenu')
const UButton = resolveComponent('UButton')
const UCheckbox = resolveComponent('UCheckbox')

const table = useTemplateRef('table')

const filtered = computed(() =>
  props.data.filter(item => item.name.toLowerCase().includes(props.q.toLowerCase()))
)

const columns: TableColumn<ProductItem>[] = [
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
    accessorKey: 'name',
    header: 'Tên sản phẩm',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-3' }, [
        h('img', {
          src: props.getFirstImageUrl(row.original.imageUrls) || '/no-avatar.jpg',
          alt: row.original.name,
          class: 'w-12 h-12 object-cover flex-shrink-0',
          onError: (e: Event) => {
            const target = e.target as HTMLImageElement
            target.src = '/no-avatar.jpg'
          }
        }),
        h('div', undefined, [
          h('p', { class: 'font-medium text-highlighted' }, row.original.name),
          h('p', { class: 'text-sm text-muted line-clamp-2' }, props.truncateText(row.original.description))
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
    accessorKey: 'createdAt',
    header: 'Ngày tạo',
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt)
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
                  label: 'Edit product',
                  icon: 'i-lucide-edit',
                  click: () => console.log('Edit product:', row.original)
                }
              ],
              [
                {
                  label: 'Delete product',
                  icon: 'i-lucide-trash',
                  click: () => console.log('Delete product:', row.original)
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
      <UInput :model-value="q" placeholder="Tìm kiếm sản phẩm..." icon="i-lucide-search" class="max-w-sm"
        @update:model-value="emit('update:q', $event)" />

      <div class="flex flex-wrap items-center gap-1.5">
        <ProductsDeleteModal :count="(table as any)?.tableApi?.getFilteredSelectedRowModel().rows.length">
          <UButton v-if="(table as any)?.tableApi?.getFilteredSelectedRowModel().rows.length" label="Delete"
            color="error" variant="subtle" icon="i-lucide-trash">
            <template #trailing>
              <UKbd>
                {{ (table as any)?.tableApi?.getFilteredSelectedRowModel().rows.length }}
              </UKbd>
            </template>
          </UButton>
        </ProductsDeleteModal>
      </div>
    </div>

    <!-- Data Table -->
    <UTable ref="table" :model-value="rowSelection" :pagination="pagination" :pagination-options="{
      getPaginationRowModel: getPaginationRowModel()
    }" :data="filtered" :columns="columns" :loading="loading" class="shrink-0 flex-1" :ui="{
        base: 'table-fixed border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
        tbody: '[&>tr]:last:[&>td]:border-b-0',
        th: 'py-3 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r first:w-10',
        td: 'border-b border-default first:w-10'
      }" @update:model-value="emit('update:rowSelection', $event)"
      @update:pagination="emit('update:pagination', $event)" />

    <!-- Pagination Info - Pinned to bottom -->
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
