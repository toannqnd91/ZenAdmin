import { ref, computed, h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/table-core'
import { useApiFetch } from '@/composables/useApiFetch'
import { getApiEndpoints } from '@/utils/api'
import type { NewsCategoriesApiResponse, NewsCategory } from '@/types/newsCategory'

export const useNewsCategoriesTable = async () => {
  const toast = useToast()
  const { accessToken } = useAuthService()

  // Resolve components
  const UCheckbox = resolveComponent('UCheckbox')
  const UDropdownMenu = resolveComponent('UDropdownMenu')
  const UButton = resolveComponent('UButton')

  // Template refs
  const table = useTemplateRef('table')

  // Reactive state
  const q = ref('')
  const rowSelection = ref({})

  // API request body
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

  console.log('[useProductsCategoriesTable] Fetching with token:', accessToken.value ? 'Token available' : 'No token')

  // Fetch data
  const endpoints = getApiEndpoints()
  const { data, pending: loading, error } = await useApiFetch<NewsCategoriesApiResponse>(endpoints.newsCategories, {
    method: 'POST',
    body
  })

  // Computed
  const categories = computed(() => (data.value as NewsCategoriesApiResponse)?.data || [])

  const filtered = computed(() =>
    categories.value.filter((cat: NewsCategory) => cat.name.toLowerCase().includes(q.value.toLowerCase()))
  )

  // Methods
  function getRowItems(row: Row<NewsCategory>) {
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

  // Table columns
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

  // Watch data changes
  watch(data, (val) => {
    console.log('Products Categories API Response:', val)
  }, { immediate: true, deep: true })

  return {
    // State
    q,
    rowSelection,
    table,

    // Data
    categories: readonly(categories),
    filtered,
    loading: readonly(loading),
    error: readonly(error),

    // Table config
    columns,

    // Methods
    getRowItems,

    // Computed for table API access
    tableApi: computed(() => (table.value as any)?.tableApi)
  }
}
