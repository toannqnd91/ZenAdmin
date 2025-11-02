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
const refreshing = ref(false)
const q = ref('')
const rowSelection = ref<Record<string, boolean>>({})
const pagination = ref({ pageIndex: 0, pageSize: 20 })

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
  const res = await customersService.getCustomerGroupsExternalCached({
    onUpdated: (groups) => {
      const list: CustomerGroupItem[] = Array.isArray(groups) ? groups : []
      allItems.value = list.map((g: CustomerGroupItem) => {
        const rawType: 'auto' | 'manual' = g.autoRun ? 'auto' : 'manual'
        return {
          id: g.id,
          name: g.name,
          count: 0,
          typeText: rawType === 'auto' ? 'Tự động' : 'Thủ công',
          rawType
        }
      })
    }
  })
  const groups: CustomerGroupItem[] = Array.isArray(res.data) ? res.data as CustomerGroupItem[] : []
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
  if (res.fromCache) {
    loading.value = false
    refreshing.value = true
    res.refreshPromise?.finally(() => {
      refreshing.value = false
    })
  } else {
    loading.value = false
    refreshing.value = false
  }
})

// Pagination is controlled via v-model:pagination (20 rows per page)
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

