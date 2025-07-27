<script setup lang="ts">
import { ref, computed, h, defineComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

import { useApiFetch } from '@/composables/useApiFetch'
import { API_ENDPOINTS } from '@/utils/api'
import type { NewsCategoriesApiResponse, NewsCategory } from '@/types/newsCategory'

const UDropdownMenu = resolveComponent('UDropdownMenu')
const UButton = resolveComponent('UButton')
const UCheckbox = resolveComponent('UCheckbox')


const q = ref('')

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

const { data, pending: loading, error } = await useApiFetch<NewsCategoriesApiResponse>(API_ENDPOINTS.newsCategories, {
  method: 'POST',
  body,
  default: () => ({ code: '', success: false, message: '', data: [] })
})

const categories = computed(() => data.value.data || [])

const filtered = computed(() =>
  categories.value.filter(cat => cat.name.toLowerCase().includes(q.value.toLowerCase()))
)


function getRowItems(row: Row<User>) {
  return [
    {
      type: 'label',
      label: 'Actions'
    },
    {
      label: 'Copy customer ID',
      icon: 'i-lucide-copy',
      onSelect() {
        navigator.clipboard.writeText(row.original.id.toString())
        toast.add({
          title: 'Copied to clipboard',
          description: 'Customer ID copied to clipboard'
        })
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'View customer details',
      icon: 'i-lucide-list'
    },
    {
      label: 'View customer payments',
      icon: 'i-lucide-wallet'
    },
    {
      type: 'separator'
    },
    {
      label: 'Delete customer',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect() {
        toast.add({
          title: 'Customer deleted',
          description: 'The customer has been deleted.'
        })
      }
    }
  ]
}

const columns: TableColumn<NewsCategory>[] = [
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
      }),
    // Thêm thuộc tính width cho cột select
    meta: { style: 'width: 20px; min-width: 20px; max-width: 20px;' }
  },
  { accessorKey: 'name', header: 'Tên danh mục' },
  { accessorKey: 'description', header: 'Mô tả' },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => h(
      'div',
      { class: 'flex justify-end pr-2' },
      [
        h(
          UDropdownMenu,
          {
            content: { align: 'end' },
            items: getRowItems(row)
          },
          {
            default: () => h(UButton, {
              icon: 'i-lucide-ellipsis-vertical',
              color: 'neutral',
              variant: 'ghost',
              class: 'ml-auto'
            })
          }
        )
      ]
    ),
    meta: { style: 'width: 48px; min-width: 48px; max-width: 48px;' }
  }
]

watch(data, (val) => {
  console.log('API Response:', val)
}, { immediate: true, deep: true })
</script>

<template>
  <UDashboardPanel id="news-categories">
    <template #header>
      <UDashboardNavbar title="Danh mục tin tức">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <NewsCategoriesAddModal />
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

        <NewsCategoriesDeleteModal>
          <UButton label="Delete" color="error" variant="subtle" icon="i-lucide-trash" />
        </NewsCategoriesDeleteModal>
      </div>

      <UTable
        :data="filtered"
        :columns="columns"
        :loading="loading"
        class="shrink-0"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-3 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default'
        }"
      />

      <div v-if="error" class="text-error mt-4">{{ error }}</div>
    </template>
  </UDashboardPanel>
</template>
