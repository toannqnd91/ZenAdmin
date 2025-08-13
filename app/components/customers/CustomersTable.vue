<script setup lang="ts">
import type { TableColumn } from '@/components/base/BaseTable.vue'
import BaseTable from '@/components/base/BaseTable.vue'
import { ref, computed } from 'vue'
import type { User } from '~/types'

const toast = useToast()

const {
  data: users,
  status
} = await useFetch<User[]>('/api/customers', { lazy: true })

const q = ref('')
const rowSelection = ref<Record<string, boolean>>({})
const pagination = ref({ pageIndex: 0, pageSize: 10 })

const columns: TableColumn[] = [
  {
    key: 'name',
    label: 'Tên khách hàng',
    class: 'py-3 text-left font-medium'
  },
  {
    key: 'email',
    label: 'Email',
    class: 'py-3 text-left font-medium'
  },
  {
    key: 'location',
    label: 'Địa chỉ',
    class: 'py-3 text-left font-medium'
  },
  {
    key: 'status',
    label: 'Trạng thái',
    class: 'py-3 text-left font-medium'
  }
]

const addButton = {
  label: 'Thêm khách hàng',
  href: '/customers/create'
}

const handleRowClick = (item: User) => {
  navigateTo(`/customers/${item.id}`)
}

const tableData = computed(() => (users.value || []).map(u => ({
  ...u,
  id: u.id
})))

const colWidths = [
  '28%', // name
  '22%', // email
  '22%', // location
  '18%'  // status
]
</script>


<template>
  <BaseTable
    :q="q"
    :row-selection="rowSelection"
    :pagination="pagination"
    :data="tableData"
    :loading="status === 'pending'"
    title="Danh sách khách hàng"
    :columns="columns"
    :col-widths="colWidths"
    :add-button="addButton"
    search-placeholder="Tìm kiếm khách hàng..."
    :row-click-handler="handleRowClick"
  >
    <template #column-name="{ item }">
      <div class="flex items-center gap-4">
        <UAvatar v-bind="item.avatar" size="lg" />
        <div class="flex flex-col">
          <span class="text-[15px] text-gray-900 font-medium">{{ item.name }}</span>
          <span class="text-sm text-muted line-clamp-2">{{ item.email || 'Không có email' }}</span>
        </div>
      </div>
    </template>
  </BaseTable>
</template>
