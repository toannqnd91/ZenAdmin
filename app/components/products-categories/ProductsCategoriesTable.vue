<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'

export interface ProductCategory {
  id: number
  name: string
  description: string
  sortOrder: number
  isDeleted: boolean
  parentId?: number
  categories: ProductCategory[]
  imageUrl?: string
}

interface Props {
  data: readonly ProductCategory[]
  loading: boolean
  q: string
  rowSelection: Record<string, unknown>
  pagination: {
    pageIndex: number
    pageSize: number
  }
}

const props = defineProps<Props>()
const _emit = defineEmits<{
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

const columns: TableColumn<ProductCategory>[] = [
  {
    id: 'select',
    header: ({ table }) => {
      return h(UCheckbox, {
        'modelValue': table.getIsSomePageRowsSelected()
          ? 'indeterminate'
          : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          table.toggleAllPageRowsSelected(!!value),
        'ariaLabel': 'Select all'
      })
    },
    cell: ({ row }) => {
      return h(UCheckbox, {
        'modelValue': row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean) => row.toggleSelected(!!value),
        'ariaLabel': `Select row ${row.index + 1}`
      })
    },
    enableSorting: false,
    enableColumnFilter: false
  },
  {
    accessorKey: 'name',
    header: 'Tên danh mục',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-3' }, [
        h('div', {
          class: 'w-12 h-12 bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden'
        }, [
          h('img', {
            src: row.original.imageUrl || '/no-image.svg',
            alt: row.original.name,
            class: 'w-full h-full object-cover',
            style: 'min-width: 100%; min-height: 100%;'
          })
        ]),
        h('div', undefined, [
          h('p', { class: 'font-medium text-highlighted' }, row.original.name),
          h('p', { class: 'text-sm text-muted line-clamp-2' }, row.original.description || 'Không có mô tả')
        ])
      ])
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
                  label: 'Edit category',
                  icon: 'i-lucide-edit',
                  click: () => console.log('Edit category:', row.original)
                }
              ],
              [
                {
                  label: 'Delete category',
                  icon: 'i-lucide-trash',
                  click: () => console.log('Delete category:', row.original)
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
      <UInput
        :model-value="q"
        placeholder="Tìm kiếm danh mục..."
        icon="i-lucide-search"
        class="max-w-sm"
        @update:model-value="$emit('update:q', $event)"
      />

      <div class="flex flex-wrap items-center gap-1.5">
        <ProductsCategoriesDeleteModal :count="(table as any)?.tableApi?.getFilteredSelectedRowModel().rows.length">
          <UButton
            v-if="(table as any)?.tableApi?.getFilteredSelectedRowModel().rows.length"
            label="Delete"
            color="error"
            variant="subtle"
            icon="i-lucide-trash"
          >
            <template #trailing>
              <UKbd>
                {{ (table as any)?.tableApi?.getFilteredSelectedRowModel().rows.length }}
              </UKbd>
            </template>
          </UButton>
        </ProductsCategoriesDeleteModal>
      </div>
    </div>

    <!-- Table -->
    <UTable
      ref="table"
      :model-value="rowSelection"
      :data="filtered"
      :columns="columns"
      :loading="loading"
      class="shrink-0"
      :ui="{
        base: 'table-fixed border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
        tbody: '[&>tr]:last:[&>td]:border-b-0',
        th: 'py-3 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r first:w-10',
        td: 'border-b border-default first:w-10'
      }"
      @update:model-value="$emit('update:rowSelection', $event)"
      @update:pagination="$emit('update:pagination', $event)"
    />

    <!-- Footer -->
    <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
      <div class="text-sm text-muted">
        {{ (table as any)?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} of
        {{ (table as any)?.tableApi?.getFilteredRowModel().rows.length || 0 }} row(s) selected.
      </div>

      <div class="flex items-center gap-1.5">
        <UPagination
          :default-page="((table as any)?.tableApi?.getState().pagination.pageIndex || 0) + 1"
          :items-per-page="(table as any)?.tableApi?.getState().pagination.pageSize"
          :total="(table as any)?.tableApi?.getFilteredRowModel().rows.length"
          @update:page="(p: number) => (table as any)?.tableApi?.setPageIndex(p - 1)"
        />
      </div>
    </div>
  </div>
</template>
