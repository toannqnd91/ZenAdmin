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
  debtBalance: number
  totalPurchase: number
  netPurchase: number
  // Backend may return either status/statusEnum or legacy isPublished
  status?: string | null
  statusEnum?: number | null
  isPublished?: boolean
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
    key: 'address',
    label: 'Địa chỉ',
    class: 'py-3 text-left font-medium'
  },
  {
    key: 'phone',
    label: 'Số điện thoại',
    class: 'py-3 text-left font-medium'
  },
  {
    key: 'debtBalance',
    label: 'Nợ cần trả',
    class: 'py-3 text-left font-medium'
  },
  {
    key: 'totalPurchase',
    label: 'Tổng mua',
    class: 'py-3 text-left font-medium'
  },
  {
    key: 'isPublished',
    label: 'Trạng thái',
    class: 'py-3 text-left font-medium'
  }
]

// Column widths align with the columns order above
// Note: BaseTable automatically handles checkbox column width, don't include it here
const colWidths = [
  '', // Tên nhà cung cấp
  '200px', // Địa chỉ
  '140px', // Số điện thoại
  '140px', // Nợ cần trả
  '150px', // Tổng mua
  '120px' // Trạng thái
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
  props.data.map((s: Supplier) => {
    const mapStatus = (ss: Supplier): { label: string, cls: string } => {
      const raw = (ss.status || '').trim()
      if (raw) {
        const k = raw.toLowerCase()
        if (k === 'active') return { label: 'Hoạt động', cls: 'text-green-600' }
        if (k === 'inactive') return { label: 'Ngừng hoạt động', cls: 'text-gray-500' }
        return { label: raw, cls: 'text-gray-700' }
      }
      if (typeof ss.statusEnum === 'number') {
        // 1 -> Active, others -> Inactive (fallback)
        return ss.statusEnum === 1
          ? { label: 'Hoạt động', cls: 'text-green-600' }
          : { label: 'Ngừng hoạt động', cls: 'text-gray-500' }
      }
      if (typeof ss.isPublished === 'boolean') {
        return ss.isPublished
          ? { label: 'Đã xuất bản', cls: 'text-green-600' }
          : { label: 'Nháp', cls: 'text-gray-400' }
      }
      return { label: '-', cls: 'text-gray-400' }
    }

    const st = mapStatus(s)

    const safe = (v: unknown) => v == null || v === '' ? '-' : v
    const formatCurrency = (val: number) => {
      if (val === 0) return '0₫'
      return val.toLocaleString('vi-VN') + '₫'
    }

    return {
      id: s.id,
      code: s.code,
      slug: s.slug,
      name: safe(s.name) as string,
      phone: safe(s.phone) as string,
      debtBalance: formatCurrency(s.debtBalance),
      debtBalanceRaw: s.debtBalance,
      totalPurchase: formatCurrency(s.totalPurchase),
      totalPurchaseRaw: s.totalPurchase,
      address: safe(s.address) as string,
      statusLabel: st.label,
      statusClass: st.cls
    }
  })
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
    :col-widths="colWidths"
    :add-button="addButton"
    :row-click-handler="handleRowClick"
    search-placeholder="Tìm kiếm nhà cung cấp..."
    @update:q="emit('update:q', $event)"
    @update:row-selection="emit('update:rowSelection', $event)"
    @update:pagination="emit('update:pagination', $event)"
    @delete="ids => emit('delete', ids)"
  >
    <template #column-name="{ item }">
      {{ item.name }}
    </template>

    <template #column-phone="{ item }">
      {{ item.phone }}
    </template>

    <template #column-debtBalance="{ item }">
      <span 
        :class="(item as any).debtBalanceRaw < 0 ? 'text-green-600' : (item as any).debtBalanceRaw > 0 ? 'text-red-600' : 'text-gray-600'"
        class="font-medium"
      >
        {{ (item as any).debtBalance }}
      </span>
    </template>

    <template #column-totalPurchase="{ item }">
      <span class="text-gray-900 font-medium">
        {{ (item as any).totalPurchase }}
      </span>
    </template>

    <template #column-address="{ item }">
      {{ item.address }}
    </template>

    <template #column-isPublished="{ item }">
      <span :class="item.statusClass">
        {{ item.statusLabel }}
      </span>
    </template>
  </BaseTable>
</template>
