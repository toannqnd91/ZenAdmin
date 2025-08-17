<script setup lang="ts">
import { ref } from 'vue'
import { useSuppliersService } from '@/composables/useSuppliersService'

const { data, loading, error } = useSuppliersService()
const q = ref('')
const rowSelection = ref<Record<string, boolean>>({})
const pagination = ref({ pageIndex: 0, pageSize: 10 })
</script>

<template>
    <UDashboardPanel id="suppliers">
        <template #header>
            <UDashboardNavbar title="Nhà cung cấp">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <SuppliersTable
                v-model:q="q"
                v-model:row-selection="rowSelection"
                v-model:pagination="pagination"
                :data="data"
                :loading="loading"
            />
            <div v-if="error" class="text-error mt-4">
                {{ error }}
            </div>
        </template>
    </UDashboardPanel>
</template>