<script setup lang="ts">
import { ref, computed, h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { useApiFetch } from '@/composables/useApiFetch'
import { API_ENDPOINTS } from '@/utils/api'
import type { Row } from '@tanstack/table-core'
import { getPaginationRowModel } from '@tanstack/table-core'

const UDropdownMenu = resolveComponent('UDropdownMenu')
const UButton = resolveComponent('UButton')
const UCheckbox = resolveComponent('UCheckbox')
const UAvatar = resolveComponent('UAvatar')

const toast = useToast()
const table = useTemplateRef('table')

const q = ref('')
const rowSelection = ref({})

const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

interface NewsItem {
  id: number
  title: string
  desc: string
  url: string
  content: string
  imageUrl?: string
  createdDate: string
  categories: Array<{
    id: number
    name: string
    url?: string
  }>
}

interface NewsApiResponse {
  code: string
  success: boolean
  message: string
  data: {
    items: NewsItem[]
    totalRecord: number
    numberOfPages: number
  }
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

const { data, pending: loading, error } = await useApiFetch<NewsApiResponse>(API_ENDPOINTS.news, {
  method: 'POST',
  body,
  default: () => ({ code: '', success: false, message: '', data: { items: [], totalRecord: 0, numberOfPages: 0 } })
})

const news = computed(() => data.value.data?.items || [])

const filtered = computed(() =>
  news.value.filter(item => item.title.toLowerCase().includes(q.value.toLowerCase()))
)

function truncateText(text: string, wordLimit: number = 20): string {
  if (!text) return ''
  const words = text.split(' ')
  if (words.length <= wordLimit) return text
  return words.slice(0, wordLimit).join(' ') + '...'
}

function getRowItems(row: Row<NewsItem>) {
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
      label: 'Edit news',
      icon: 'i-lucide-edit'
    },
    {
      type: 'separator'
    },
    {
      label: 'Delete news',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect() {
        toast.add({
          title: 'News deleted',
          description: 'The news has been deleted.'
        })
      }
    }
  ]
}

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
        h(UAvatar, {
          src: row.original.imageUrl || undefined,
          alt: row.original.title,
          size: 'lg'
        }),
        h('div', undefined, [
          h('p', { class: 'font-medium text-highlighted' }, row.original.title),
          h('p', { class: 'text-sm text-muted line-clamp-2' }, truncateText(row.original.desc))
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
  <UDashboardPanel id="news">
    <template #header>
      <UDashboardNavbar title="Tin tức">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <NewsAddModal>
            <UButton
              label="New News"
              color="primary"
              variant="solid"
              icon="i-lucide-plus"
            />
          </NewsAddModal>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          v-model="q"
          placeholder="Tìm kiếm tin tức..."
          icon="i-lucide-search"
          class="max-w-sm"
        />

        <div class="flex flex-wrap items-center gap-1.5">
          <NewsDeleteModal :count="table?.tableApi?.getFilteredSelectedRowModel().rows.length">
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
          </NewsDeleteModal>
        </div>
      </div>

      <UTable
        ref="table"
        v-model:row-selection="rowSelection"
        v-model:pagination="pagination"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel()
        }"
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

      <div v-if="error" class="text-error mt-4">
        {{ error }}
      </div>
    </template>
  </UDashboardPanel>
</template>
