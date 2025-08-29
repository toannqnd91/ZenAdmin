
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import BaseTable from '@/components/base/BaseTable.vue'
import { warehouseService, type WarehouseItem } from '@/services/warehouse.service'

const loading = ref(false)
const warehouses = ref<WarehouseItem[]>([])
const q = ref('')
const rowSelection = ref<Record<string, boolean>>({})

const columns = [
    { key: 'name', label: 'Tên kho' },
    { key: 'createdOn', label: 'Ngày tạo' },
    { key: 'productCount', label: 'Số lượng sản phẩm' },
    { key: 'totalStock', label: 'Số lượng tồn kho' }
]

async function fetchWarehouses() {
    loading.value = true
    try {
        const res = await warehouseService.getWarehouses()
        warehouses.value = Array.isArray(res?.data) ? res.data : []
    } catch {
        warehouses.value = []
    }
    loading.value = false
}

onMounted(fetchWarehouses)
</script>

<template>
    <UDashboardPanel id="warehouses" class="flex flex-col h-full">
        <template #header>
            <UDashboardNavbar title="Kho hàng">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <!-- Có thể thêm các nút/phím tắt ở đây nếu cần -->
            </UDashboardNavbar>
        </template>
        <template #body>
            <div class="w-full flex flex-col h-full">
                <div class="flex-1 min-h-0">
                    <BaseTable
                        v-model:row-selection="rowSelection"
                        :q="q"
                        :data="warehouses"
                        :loading="loading"
                        :columns="columns"
                        title="Danh sách kho"
                    >
                        <template #column-createdOn="{ item }">
                            <span>{{ item.createdOn ? new Date(String(item.createdOn)).toLocaleDateString('vi-VN') : '' }}</span>
                        </template>
                    </BaseTable>
                </div>
            </div>
        </template>
    </UDashboardPanel>
</template>
