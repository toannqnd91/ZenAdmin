<script setup lang="ts">
import { ref, computed, h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { useApiFetch } from '@/composables/useApiFetch'
import { API_ENDPOINTS } from '@/utils/api'
import type { Row } from '@tanstack/table-core'

const UDropdownMenu = resolveComponent('UDropdownMenu')
const UButton = resolveComponent('UButton')
const UCheckbox = resolveComponent('UCheckbox')

const toast = useToast()
const table = useTemplateRef('table')

const q = ref('')
const rowSelection = ref({})

interface ProductCategory {
  id: number
  name: string
  description: string
  sortOrder: number
  isDeleted: boolean
  parentId?: number
  categories: ProductCategory[]
}

interface ProductCategoriesApiResponse {
  code: string
  success: boolean
  message: string
  data: ProductCategory[]
}

const body = {
  Pagination: {
    Start: 0,
    TotalItemCount: 0,
    Number: 20,
    NumberOfPages: 10
  },
  Search: {
    QueryObject: {
      Name: null
    }
  },
  Sort: {
    Field: 'Id',
    Reverse: false
  }
}

const { data, pending: loading, error } = await useApiFetch<ProductCategoriesApiResponse>(API_ENDPOINTS.productCategories, {
  method: 'POST',
  body,
  default: () => ({ code: '', success: false, message: '', data: [] })
})

const categories = computed(() => data.value.data || [])

const filtered = computed(() =>
  categories.value.filter(cat => cat.name.toLowerCase().includes(q.value.toLowerCase()))
)

function getRowItems(row: Row<ProductCategory>) {
  return [
    {
      type: 'label',
      label: 'Actions'
    },
    {
      label: 'Copy ID',
      icon: 'i-lucide-copy',
      onSelect() {
        navigator.clipboard.writeText(row.original.id.toString())
        toast.add({
          title: 'Copied to clipboard',
          description: 'ID copied to clipboard'
        })
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'View details',
      icon: 'i-lucide-list'
    },
    {
      label: 'Edit category',
      icon: 'i-lucide-edit'
    },
    {
      type: 'separator'
    },
    {
      label: 'Delete category',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect() {
        toast.add({
          title: 'Category deleted',
          description: 'The category has been deleted.'
        })
      }
    }
  ]
}

const columns: TableColumn<ProductCategory>[] = [
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
    header: 'Tên danh mục'
  },
  {
    accessorKey: 'description',
    header: 'Mô tả'
  },
  {
    accessorKey: 'sortOrder',
    header: 'Thứ tự'
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) =>
      h('div', { class: 'flex justify-end pr-2' }, [
        h(
          UDropdownMenu,
          {
            content: { align: 'end' },
            items: getRowItems(row)
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

watch(data, (val) => {
  console.log('API Response:', val)
}, { immediate: true, deep: true })
</script>

<template>
  <UDashboardPanel id="products-categories">
    <template #header>
      <UDashboardNavbar title="Danh mục sản phẩm">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        
        <template #right>
          <ProductsCategoriesAddModal />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          v-model="q"
          placeholder="Tìm kiếm danh mục..."
          icon="i-lucide-search"
          class="max-w-sm"
        />

        <div class="flex flex-wrap items-center gap-1.5">
          <ProductsCategoriesDeleteModal :count="table?.tableApi?.getFilteredSelectedRowModel().rows.length">
            <UButton
              v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
              label="Delete"
              color="error"
              variant="subtle"
              icon="i-lucide-trash"
            >
              <template #trailing>
                <UKbd>
                  {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length }}
                </UKbd>
              </template>
            </UButton>
          </ProductsCategoriesDeleteModal>
        </div>
      </div>

      <UTable
        ref="table"
        v-model:row-selection="rowSelection"
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
      />

      <div v-if="error" class="text-error mt-4">
        {{ error }}
      </div>

      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="text-sm text-muted">
          {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} of
          {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} row(s) selected.
        </div>

        <div class="flex items-center gap-1.5">
          <UPagination
            :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
            :items-per-page="table?.tableApi?.getState().pagination.pageSize"
            :total="table?.tableApi?.getFilteredRowModel().rows.length"
            @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
