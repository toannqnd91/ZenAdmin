<script setup lang="ts">
/* eslint-disable vue/html-indent */
import { ref, onMounted } from 'vue'
import BaseTable from '@/components/base/BaseTable.vue'
import { warehouseService } from '@/services/warehouse.service'
import type { WarehouseItem } from '@/services/warehouse.service'
import AddWarehouseModal from '@/components/AddWarehouseModal.vue'

const loading = ref(false)
const warehouses = ref<WarehouseItem[]>([])
const q = ref('')
const rowSelection = ref<Record<string, boolean>>({})

// Global dashboard state (notifications slideover, theme button)
const { isNotificationsSlideoverOpen } = useDashboard()

const columns = [
  { key: 'name', label: 'Tên kho' },
  { key: 'createdOn', label: 'Ngày tạo' },
  { key: 'productCount', label: 'Số lượng sản phẩm' },
  { key: 'totalStock', label: 'Số lượng tồn kho' }
]

// Cấu hình chiều rộng các cột theo thứ tự columns (chuỗi rỗng cho cột linh hoạt)
const colWidths: string[] = ['', '160px', '180px', '180px']

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

// Modal state
const showAddWarehouseModal = ref(false)

// Handler: open modal
function onAddWarehouse() {
  showAddWarehouseModal.value = true
}

function onWarehouseSaved(w: { id: string | number, name: string }) {
  // Prepend new warehouse then refetch for full data (createdOn, counts)
  warehouses.value = [{ id: Number(w.id), name: w.name } as WarehouseItem, ...warehouses.value]
  // Fire and forget refresh
  fetchWarehouses()
}
</script>

<template>
    <UDashboardPanel id="warehouses" class="flex flex-col h-full">
        <template #header>
            <UDashboardNavbar title="Chi nhánh / kho hàng" :ui="{ right: 'gap-3' }">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <template #right>
                    <!-- Divider before global controls (kept for consistent spacing) -->
                    <div class="h-5 w-px bg-gray-200 mx-2" />

                    <!-- Always keep these two at the far right: color mode + notifications -->
                    <UColorModeButton />
                    <UTooltip text="Notifications" :shortcuts="['N']">
                        <UButton
                            color="neutral"
                            variant="ghost"
                            square
                            @click="isNotificationsSlideoverOpen = true"
                        >
                            <UChip color="error" inset>
                                <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
                            </UChip>
                        </UButton>
                    </UTooltip>
                </template>
            </UDashboardNavbar>
        </template>
        <template #body>
            <div class="w-full flex flex-col h-full">
                <div class="flex-1 min-h-0">
                    <BaseTable
                        v-model:row-selection="rowSelection"
                        v-model:q="q"
                        :data="warehouses"
                        :loading="loading"
                        :columns="columns"
                        :col-widths="colWidths"
                        title="Danh sách chi nhánh"
                        :add-button="{ label: 'Thêm chi nhánh', handler: onAddWarehouse }"
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
    <AddWarehouseModal v-model="showAddWarehouseModal" @saved="onWarehouseSaved" />
</template>
