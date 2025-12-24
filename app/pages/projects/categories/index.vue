<script setup lang="ts">
import { projectService } from '@/services'
import type { ProjectCategory } from '@/types/project'
import BaseTable from '@/components/base/BaseTable.vue'

const categories = ref<ProjectCategory[]>([])
const loading = ref(false)
const q = ref('')
const rowSelection = ref({})
const pagination = ref({ pageIndex: 0, pageSize: 50 })

// Filter categories locally based on `q` since API fetch returns all
const filteredCategories = computed(() => {
    if (!q.value) return categories.value
    const lower = q.value.toLowerCase()
    return categories.value.filter(c => c.name.toLowerCase().includes(lower))
})

// Columns config (remove 'actions' as BaseTable handles it)
const columns = [
    { key: 'name', label: 'Tên danh mục' },
    { key: 'slug', label: 'Slug' },
    { key: 'displayOrder', label: 'Thứ tự' },
    { key: 'isActive', label: 'Trạng thái' }
]

async function fetchCategories() {
    loading.value = true
    try {
        const res = await projectService.getCategories()
        if (res.success && res.data) {
            categories.value = res.data
        }
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
}

async function handleDelete(id: number) {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return
    try {
        const res = await projectService.deleteCategory(id)
        if (res.success) {
            fetchCategories()
        } else {
            alert(res.message || 'Có lỗi xảy ra')
        }
    } catch (e) {
        alert('Có lỗi xảy ra')
    }
}

onMounted(fetchCategories)
</script>

<template>
    <UDashboardPanel class="flex flex-col h-full">
        <template #header>
            <UDashboardNavbar title="Danh mục dự án">
                <template #leading>
                    <UButton icon="i-lucide-arrow-left" variant="ghost" to="/projects" />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="h-full flex flex-col">
                <BaseTable v-model:q="q" v-model:row-selection="rowSelection" v-model:pagination="pagination"
                    :data="filteredCategories" :loading="loading" :columns="columns" title="Danh sách danh mục"
                    :add-button="{ label: 'Thêm danh mục', href: '/projects/categories/create' }"
                    search-placeholder="Tìm kiếm danh mục..." :show-row-actions="true" class="flex-1">
                    <!-- Custom isActive column -->
                    <template #column-isActive="{ item }">
                        <UBadge :color="item.isActive ? 'success' : 'neutral'" variant="soft">
                            {{ item.isActive ? 'Kích hoạt' : 'Ẩn' }}
                        </UBadge>
                    </template>

                    <!-- Row actions -->
                    <template #row-actions="{ item }">
                        <div class="flex gap-2 justify-end">
                            <UButton icon="i-lucide-edit" variant="ghost" color="primary"
                                :to="`/projects/categories/${item.id}/edit`" />
                            <UButton icon="i-lucide-trash" variant="ghost" color="error"
                                @click="handleDelete(item.id as number)" />
                        </div>
                    </template>
                </BaseTable>
            </div>
        </template>
    </UDashboardPanel>
</template>
