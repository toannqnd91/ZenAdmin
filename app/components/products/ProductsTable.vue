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
          src: row.original.thumbnailImageUrl || '/no-image.svg',
          alt: row.original.name,
          class: 'w-12 h-12 object-cover flex-shrink-0',
          onError: (e: Event) => {
            const target = e.target as HTMLImageElement
            target.src = '/no-image.svg'
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
    accessorKey: 'sold',
    header: 'Đã bán',
    cell: ({ row }) => row.original.sold
  },
  {
    accessorKey: 'inventory',
    header: 'Tồn kho',
    cell: ({ row }) => {
      const p = row.original
      // Nếu có variations
      if (Array.isArray(p.variations) && p.variations.length > 1) {
        const allQty = p.variations.map(v => v.stockQuantity)
        const allUnlimited = allQty.every(qty => qty === null || qty === undefined)
        const allSame = allQty.every(qty => qty === allQty[0])
        let label = ''
        let color = ''
        if (allUnlimited) {
          label = 'Unlimited'
        } else if (allSame) {
          label = `${allQty[0]} in stock`
        } else {
          label = 'Mixed'
          color = 'text-error'
        }
        return h('div', {}, [
          h('span', { class: color }, label),
          h('div', { class: 'text-xs text-muted' }, `${p.variations.length} variants`)
        ])
      }
      // Không có variations hoặc chỉ 1
      if (p.stockQuantity === null || p.stockQuantity === undefined) {
        return h('span', {}, 'Unlimited')
      }
      return h('div', {}, [
        h('span', {}, `${p.stockQuantity} in stock`),
        h('div', { class: 'text-xs text-muted' }, `${Array.isArray(p.variations) ? p.variations.length : 1} variants`)
      ])
    }
  },
  {
    accessorKey: 'createdAt',
    header: 'Ngày tạo',
    cell: ({ row }) => {
      const date = new Date(row.original.createdOn)
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

// Handle row click
const handleRowClick = (item: ProductItem) => {
  navigateTo(`/products/${item.id}/update`)
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
    const productItem = filtered.value[actualIndex]
    if (productItem) {
      handleRowClick(productItem)
    }
  }
}
</script>

<template>
  <div class="flex flex-col bg-white">
    <!-- Header (Title + Actions) -->
  <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-default/70">
      <h2 class="text-base font-semibold">Danh sách sản phẩm</h2>
      <div class="flex items-center gap-2 w-full sm:w-auto sm:justify-end">
        <UButton icon="i-lucide-filter" variant="soft" color="neutral" class="shrink-0" aria-label="Filter" />
        <UInput :model-value="q" placeholder="Search Products" icon="i-lucide-search" class="max-w-xs rounded-none bg-transparent"
          @update:model-value="emit('update:q', $event)" />
        <UButton label="New Product" icon="i-lucide-plus" color="primary" variant="solid" class="shrink-0"
          @click="navigateTo('/products/create')" />
      </div>
    </div>

    <!-- Table -->
    <div class="flex flex-col px-4 pb-3 pt-1">
    <UTable ref="table" :model-value="rowSelection" :pagination="pagination" :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
        :data="filtered" :columns="columns" :loading="loading" class="shrink-0" :ui="{
          base: 'table-fixed border-spacing-0 w-full',
      thead: '[&>tr]:bg-transparent [&>tr]:after:content-none [&>tr]:border-b [&>tr]:border-default/70',
      tbody: '[&>tr]:cursor-pointer [&>tr:hover]:bg-gray-50 [&>tr:last>td]:border-b-0',
      th: 'py-3 first:w-10 text-left font-medium text-gray-500',
      td: 'py-4 first:w-10 align-middle border-b border-default/60'
        }"
        @update:model-value="emit('update:rowSelection', $event)"
        @update:pagination="emit('update:pagination', $event)"
        @click="onTableClick"
      />

      <!-- Footer / Pagination Info -->
  <div class="flex items-center justify-between gap-3 pt-3">
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
  </div>
</template>
