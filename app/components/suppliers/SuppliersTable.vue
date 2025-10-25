<script setup lang="ts">
import type { TableColumn } from '@/components/base/BaseTable.vue'
import BaseTable from '@/components/base/BaseTable.vue'

interface Supplier {
  id: number | string
  code?: string
  slug?: string
  name: string
  phone?: string | null
  email?: string | null
  address?: string | null
  isPublished: boolean
}

interface Props {
  data: Supplier[]
  loading: boolean
  q: string
  rowSelection: Record<string, boolean>
  pagination: { pageIndex: number, pageSize: number }
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:q': [string]
  'update:rowSelection': [Record<string, boolean>]
  'update:pagination': [{ pageIndex: number, pageSize: number }]
  'delete': [string[]]
}>()

const columns: TableColumn[] = [
  {
    key: 'name',
    label: 'Tên nhà cung cấp',
    class: 'py-3 text-left font-medium'
  },
  {
    key: 'phone',
    label: 'Số điện thoại',
    class: 'py-3 text-left font-medium'
  },
  {
    key: 'email',
    label: 'Email',
    class: 'py-3 text-left font-medium'
  },
  {
    key: 'address',
    label: 'Địa chỉ',
    class: 'py-3 text-left font-medium'
  },
  {
    key: 'isPublished',
    label: 'Trạng thái',
    class: 'py-3 text-left font-medium'
  }
]

const addButton = {
  label: 'Thêm nhà cung cấp',
  href: '/suppliers/create'
}

const handleRowClick = (item: Record<string, unknown>) => {
  const supplier = item as unknown as Supplier
  const code = (supplier.code && typeof supplier.code === 'string' && supplier.code.trim())
    ? supplier.code
    : (supplier.slug && typeof supplier.slug === 'string' && supplier.slug.trim())
        ? supplier.slug
        : String(supplier.id)
  navigateTo(`/suppliers/${code}`)
}

const tableData = computed(() =>
  props.data.map((s: Supplier) => ({
    id: s.id,
    code: s.code,
    slug: s.slug,
    name: s.name,
    phone: s.phone,
    email: s.email,
    address: s.address,
    isPublished: s.isPublished ? 'Đã xuất bản' : 'Nháp'
  }))
)
</script>

<template>
  <BaseTable
    :q="q"
    :row-selection="rowSelection"
    :pagination="pagination"
    :data="tableData"
    :loading="loading"
    title="Nhà cung cấp"
    :columns="columns"
    :add-button="addButton"
    :row-click-handler="handleRowClick"
    search-placeholder="Tìm kiếm nhà cung cấp..."
    @update:q="emit('update:q', $event)"
    @update:row-selection="emit('update:rowSelection', $event)"
    @update:pagination="emit('update:pagination', $event)"
    @delete="ids => emit('delete', ids)"
  >
    <template #column-isPublished="{ item }">
      <span :class="item.isPublished === 'Đã xuất bản' ? 'text-green-600' : 'text-gray-400'">
        {{ item.isPublished }}
      </span>
    </template>
  </BaseTable>
</template>
