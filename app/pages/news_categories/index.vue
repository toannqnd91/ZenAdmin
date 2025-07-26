<script setup lang="ts">

import { ref, onMounted } from 'vue'
import { useApiFetch } from '@/composables/useApiFetch'
import type { NewsCategoriesApiResponse, NewsCategory } from '@/types/newsCategory'

const categories = ref<NewsCategory[]>([])
const loading = ref(false)
const error = ref('')

const fetchCategories = async () => {
    // Chỉ gọi API ở client
    // if (!import.meta.client) return // cũng không được nhé

    loading.value = true
    error.value = ''
    try {
        const body = {
            Pagination: {
                Start: 0,
                TotalItemCount: 0,
                Number: 20,
                NumberOfPages: 10
            },
            Search: {
                QueryObject: {
                    Name: null
                }
            },
            Sort: {
                Field: 'Id',
                Reverse: false
            }
        }
        const { data } = await useApiFetch<NewsCategoriesApiResponse>(API_ENDPOINTS.newsCategories, {
            method: 'POST',
            body
        })
        if (data.value && data.value.success) {
            categories.value = data.value.data
        } else {
            error.value = data.value?.message || 'Lỗi khi lấy dữ liệu.'
        }
    } catch (e) {
        console.error(e)
        error.value = 'Lỗi kết nối API.'
    } finally {
        loading.value = false
    }
}

onMounted(fetchCategories)
</script>

<template>
    <UDashboardPanel id="news-categories">
        <template #header>
            <UDashboardNavbar title="Danh mục tin tức">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
            </UDashboardNavbar>
        </template>

        <UDashboardToolbar>
            <UInput v-model="q" placeholder="Tìm kiếm danh mục..." icon="i-lucide-search" class="w-full max-w-sm" />
        </UDashboardToolbar>
        <div>
            <h1>News Categories</h1>
            <div v-if="loading">Đang tải...</div>
            <div v-else-if="error">{{ error }}</div>
            <ul v-else>
                <li v-for="cat in categories" :key="cat.id" class="mb-2">
                    <strong>{{ cat.name }}</strong>
                    <div>{{ cat.description }}</div>
                </li>
            </ul>
        </div>
    </UDashboardPanel>
</template>