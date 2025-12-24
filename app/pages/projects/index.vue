<script setup lang="ts">
import { useProjectService } from '@/composables/useProjectService'
import ProjectTable from '@/components/projects/ProjectTable.vue'

const {
    q,
    projects,
    loading,
    error,
    truncateContent,
    pagination,
    totalPages,
    totalRecords,
    fetchProjects
} = useProjectService()

const { isNotificationsSlideoverOpen } = useDashboard()

function truncateText(text: string | null | undefined, wordLimit: number = 20): string {
    return truncateContent(text || '', wordLimit * 5)
}

function getRowItems(row: { original: { id: number } }) {
    return [
        {
            type: 'label',
            label: 'Actions'
        },
        {
            label: 'View',
            icon: 'i-lucide-eye'
        },
        {
            label: 'Edit',
            icon: 'i-lucide-edit',
            onSelect: () => navigateTo(`/projects/${row.original.id}/edit`)
        },
        {
            type: 'separator'
        },
        {
            label: 'Delete',
            icon: 'i-lucide-trash',
            color: 'error',
            onSelect: () => alert('Delete feature not implemented yet') // Placeholder
        }
    ]
}

// Handle row click to navigate to update page
function handleRowClick(item: { id: number | string }) {
    navigateTo(`/projects/${item.id}/edit`)
}

function onRowEdit(id: string | number) {
    navigateTo(`/projects/${id}/edit`)
}

function onRowDelete(id: string | number) {
    alert('Delete feature not implemented yet')
}

</script>

<template>
    <UDashboardPanel id="projects" class="flex flex-col h-full">
        <template #header>
            <UDashboardNavbar title="Dự án" :ui="{ right: 'gap-3' }">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <template #right>
                    <UButton label="Quản lý danh mục" icon="i-lucide-folder-cog" variant="ghost" color="neutral"
                        to="/projects/categories" />

                    <!-- Divider before global controls -->
                    <div class="h-5 w-px bg-gray-200 mx-2" />

                    <!-- Color mode + notifications -->
                    <UColorModeButton />
                    <UTooltip text="Notifications" :shortcuts="['N']">
                        <UButton color="neutral" variant="ghost" square @click="isNotificationsSlideoverOpen = true">
                            <UChip color="error" inset>
                                <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
                            </UChip>
                        </UButton>
                    </UTooltip>
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="flex flex-col h-full">
                <ProjectTable v-model:q="q" v-model:pagination="pagination" :data="projects" :loading="loading"
                    :total-pages="totalPages" :total-records="totalRecords" :truncate-text="truncateText"
                    :get-row-items="getRowItems" :on-row-click="handleRowClick" @edit="onRowEdit"
                    @delete="onRowDelete" />

                <div v-if="error" class="text-error mt-4">
                    {{ error }}
                </div>
            </div>
        </template>
    </UDashboardPanel>
</template>
