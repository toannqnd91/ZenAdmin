<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { customersService } from '@/services'
import type { CustomerGroupItem } from '@/services/customers.service'

type GroupRow = {
  id: number
  name: string
  count: number
  typeText: string
  rawType: 'auto' | 'manual'
}

const loading = ref(false)
const q = ref('')
const rowSelection = ref<Record<string, boolean>>({})
const pagination = ref({ pageIndex: 0, pageSize: 15 })

// Filter: 'all' | 'auto' | 'manual'
const typeFilter = ref<'all' | 'auto' | 'manual'>('all')

const allItems = ref<GroupRow[]>([])

const filteredItems = computed(() => {
  if (typeFilter.value === 'all') return allItems.value
  return allItems.value.filter(it => it.rawType === typeFilter.value)
})

const pageSlice = computed(() => {
  const start = pagination.value.pageIndex * pagination.value.pageSize
  const end = start + pagination.value.pageSize
  return filteredItems.value.slice(start, end)
})

onMounted(async () => {
  loading.value = true
  try {
    const res = await customersService.getCustomerGroupsExternal()
    const groups: CustomerGroupItem[] = res?.data || []
    // Map to table rows
    allItems.value = groups.map((g: CustomerGroupItem) => {
      const rawType: 'auto' | 'manual' = g.autoRun ? 'auto' : 'manual'
      return {
        id: g.id,
        name: g.name,
        count: 0,
        typeText: rawType === 'auto' ? 'Tự động' : 'Thủ công',
        rawType
      }
    })
  } finally {
    loading.value = false
  }
})

// Pagination is controlled via v-model:pagination
</script>

<template>
  <UDashboardPanel id="customer-groups">
    <template #header>
      <UDashboardNavbar title="Nhóm khách hàng">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <CustomerGroupsTable
        v-model:q="q"
        v-model:row-selection="rowSelection"
        v-model:pagination="pagination"
        :data="pageSlice"
        :loading="loading"
      />
    </template>
  </UDashboardPanel>
</template>

<style scoped>
</style>

