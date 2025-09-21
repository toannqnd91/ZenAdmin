
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

// Cấu hình chiều rộng các cột theo thứ tự columns
const colWidths: string[] = [null, '160px', '180px', '180px']

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
                        :col-widths="colWidths"
                        title="Danh sách kho"
                    >
                        <template #column-name="{ item }">
                            <div class="flex items-center gap-2">
                                <span>{{ item.name }}</span>
                                <UBadge
                                    v-if="item && item.isDefault"
                                    color="primary"
                                    variant="soft"
                                    size="sm"
                                >
                                    Mặc định
                                </UBadge>
                            </div>
                        </template>
                        <template #column-createdOn="{ item }">
                            <span>{{ item.createdOn ? new Date(String(item.createdOn)).toLocaleDateString('vi-VN') : '' }}</span>
                        </template>
                    </BaseTable>
                </div>
            </div>
        </template>
    </UDashboardPanel>
</template>
