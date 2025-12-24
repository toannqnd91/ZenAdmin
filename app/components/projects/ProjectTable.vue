<script setup lang="ts">
import type { TableColumn } from '@/components/base/BaseTable.vue'
import BaseTable from '@/components/base/BaseTable.vue'
import { fileService } from '@/services/file.service'
import type { Project } from '@/types/project'

interface Props {
    data: Project[]
    loading?: boolean
    q: string
    // rowSelection: Record<string, boolean> // Keeping interface simple for now unless multi-select is requested but base table might expect it
    pagination: { pageIndex: number, pageSize: number }
    totalPages?: number
    totalRecords?: number
    truncateText: (text: string | null, wordLimit?: number) => string
    onRowClick?: (item: Project) => void
}

const props = defineProps<Props>()
const emit = defineEmits<{
    (e: 'update:q', value: string): void
    (e: 'update:pagination', value: { pageIndex: number, pageSize: number }): void
    (e: 'edit', id: string | number): void
    (e: 'delete', id: string | number): void
}>()

// rowSelection dummy to satisfy BaseTable if needed or just pass empty object
const rowSelection = ref({})

const columns: TableColumn[] = [
    {
        key: 'name',
        label: 'Tên dự án',
        class: 'py-3 text-left font-medium'
    },
    {
        key: 'createdDate',
        label: 'Ngày tạo',
        class: 'py-3 text-left font-medium'
    },
    {
        key: 'status',
        label: 'Trạng thái',
        class: 'py-3 text-left font-medium'
    }
]

const handleImageError = (e: Event) => {
    const target = e.target as HTMLImageElement
    if (target) target.src = '/no-image.svg'
}

const handleRowClick = (item: Project) => {
    if (props.onRowClick) props.onRowClick(item)
}
</script>

<template>
    <BaseTable :q="q" :row-selection="rowSelection" :pagination="pagination" :data="data" :loading="loading"
        title="Danh sách dự án" :columns="columns" :add-button="{ label: 'Thêm dự án', href: '/projects/create' }"
        search-placeholder="Tìm kiếm dự án..." :row-click-handler="handleRowClick" :total-pages="props.totalPages"
        :total-records="props.totalRecords" class="" @update:q="emit('update:q', $event)"
        @update:pagination="emit('update:pagination', $event)" @row-edit="emit('edit', $event)"
        @row-delete="emit('delete', $event)">
        <!-- Custom name column with image and description -->
        <template #column-name="{ item }">
            <div class="flex items-center gap-4">
                <div
                    class="h-11 w-11 min-w-[44px] min-h-[44px] aspect-square rounded-md bg-gray-100 overflow-hidden flex items-center justify-center">
                    <img :src="fileService.getFileUrl(item.imageUrl) || '/no-image.svg'" :alt="item.name"
                        class="h-full w-full object-cover" @error="handleImageError">
                </div>
                <div class="flex flex-col">
                    <span class="text-[15px] text-gray-900 font-medium">{{ item.name }}</span>
                    <span class="text-sm text-muted line-clamp-2">{{ props.truncateText(item.description) }}</span>
                </div>
            </div>
        </template>

        <!-- Custom createdDate column -->
        <template #column-createdDate="{ item }">
            <span>{{ new Date(item.createdDate).toLocaleDateString('vi-VN') }}</span>
        </template>

        <!-- Custom status column -->
        <template #column-status="{ item }">
            <UBadge :color="item.isPublished ? 'success' : 'neutral'" variant="soft">
                {{ item.isPublished ? 'Đã xuất bản' : 'Nháp' }}
            </UBadge>
        </template>

        <!-- Row actions -->
        <template #row-actions="{ item }">
            <slot name="row-actions" :item="item">
                <!-- Default actions passed via @edit and @delete events from BaseTable are handled there usually via slot or prop logic in BaseTable
             If BaseTable expects us to render actions here, we should see NewsTable. 
             NewsTable uses: <template #row-actions="{ item }"> <slot ...> </template>
and passes getRowItems to BaseTable.
-->
            </slot>
        </template>
    </BaseTable>
</template>
