<script setup lang="ts">
import { z } from 'zod'
import { projectService } from '@/services/project.service'
import type { FormSubmitEvent } from '#ui/types'

const router = useRouter()
const toast = useToast()
const isLoading = ref(false)

const state = reactive({
    name: '',
    slug: '',
    description: '',
    displayOrder: 1,
    isActive: true
})

const schema = z.object({
    name: z.string().min(1, 'Tên danh mục là bắt buộc'),
    slug: z.string().optional(),
    description: z.string().optional(),
    displayOrder: z.number().min(0, 'Thứ tự hiển thị phải lớn hơn hoặc bằng 0')
})

type Schema = z.output<typeof schema>

async function onSubmit(event: FormSubmitEvent<Schema>) {
    isLoading.value = true
    try {
        const res = await projectService.createCategory(state)

        if (res.success) {
            toast.add({
                title: 'Thành công',
                description: 'Tạo danh mục dự án thành công',
                color: 'green'
            })
            router.push('/projects/categories')
        } else {
            toast.add({
                title: 'Lỗi',
                description: res.message || 'Có lỗi xảy ra khi tạo danh mục',
                color: 'red'
            })
        }
    } catch (e: any) {
        const errorMessage = e?.message || 'Có lỗi xảy ra khi tạo danh mục'
        toast.add({
            title: 'Lỗi',
            description: errorMessage,
            color: 'red'
        })
        console.error('Create category error:', e)
    } finally {
        isLoading.value = false
    }
}

const goBack = () => router.push('/projects/categories')
</script>

<template>
    <UDashboardPanel>
        <template #header>
            <UDashboardNavbar title="Thêm danh mục dự án">
                <template #leading>
                    <div class="flex items-center gap-3">
                        <UButton icon="i-lucide-arrow-left" variant="ghost" to="/projects/categories" />
                    </div>
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="w-full max-w-6xl mx-auto px-4 lg:px-6">
                <!-- Breadcrumb -->
                <nav class="mb-6" aria-label="Breadcrumb">
                    <ol class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <li>
                            <NuxtLink to="/projects/categories"
                                class="hover:text-primary-600 dark:hover:text-primary-400">
                                Danh mục dự án
                            </NuxtLink>
                        </li>
                        <li class="flex items-center">
                            <svg class="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd"
                                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                    clip-rule="evenodd" />
                            </svg>
                            <span class="text-gray-900 dark:text-white font-medium">Thêm danh mục</span>
                        </li>
                    </ol>
                </nav>

                <UForm :schema="schema" :state="state" class="flex flex-col lg:flex-row gap-6" @submit="onSubmit">
                    <!-- Left Column: Info -->
                    <div class="flex-1 space-y-6">
                        <UPageCard title="Thông tin chung" variant="soft" class="bg-white rounded-lg">
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Tên danh mục <span class="text-red-500">*</span>
                                    </label>
                                    <input v-model="state.name" type="text" placeholder="Nhập tên danh mục..."
                                        class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Slug
                                    </label>
                                    <input v-model="state.slug" type="text" placeholder="tu-dong-tao-tu-ten"
                                        class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    <p class="mt-1 text-xs text-gray-500">Để trống sẽ tự động tạo từ tên</p>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Mô tả
                                    </label>
                                    <textarea v-model="state.description" rows="4" placeholder="Nhập mô tả..."
                                        class="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"></textarea>
                                </div>
                            </div>
                        </UPageCard>

                        <div class="flex items-center justify-end gap-3 mt-6">
                            <UButton label="Hủy" variant="ghost" color="neutral" @click="goBack" />
                            <UButton type="submit" label="Lưu" :loading="isLoading" />
                        </div>
                    </div>

                    <!-- Right Column: Settings -->
                    <div class="w-full lg:w-80 space-y-6">
                        <UPageCard title="Cấu hình" variant="soft" class="bg-white rounded-lg">
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Trạng thái
                                    </label>
                                    <div class="flex items-center gap-2">
                                        <UToggle v-model="state.isActive" />
                                        <span class="text-sm text-gray-700 dark:text-gray-300">
                                            {{ state.isActive ? 'Kích hoạt' : 'Ẩn' }}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Thứ tự hiển thị
                                    </label>
                                    <input v-model.number="state.displayOrder" type="number"
                                        class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                </div>
                            </div>
                        </UPageCard>
                    </div>
                </UForm>

            </div>
        </template>
    </UDashboardPanel>
</template>
