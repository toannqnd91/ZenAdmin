<script setup lang="ts">
import { z } from 'zod'
import { newsCategoryService } from '@/services/newsCategory.service'
import { fileService } from '@/services'
import type { FormSubmitEvent } from '#ui/types'

const router = useRouter()
const toast = useToast()
const isLoading = ref(false)
const isUploadingImage = ref(false)
const imagePreview = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const state = reactive({
    name: '',
    description: '',
    parentId: null as number | null,
    imageUrl: '',
    icon: '',
    isVisible: true
})

const schema = z.object({
    name: z.string().min(1, 'Tên danh mục là bắt buộc'),
    description: z.string().optional(),
    parentId: z.number().nullable().optional(),
    imageUrl: z.string().optional(),
    icon: z.string().optional()
})

type Schema = z.output<typeof schema>

const clickFileInput = () => {
    fileInput.value?.click()
}

const handleImageUpload = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
        toast.add({
            title: 'Lỗi',
            description: 'Vui lòng chọn file ảnh',
            color: 'error'
        })
        return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        toast.add({
            title: 'Lỗi',
            description: 'Kích thước ảnh không được vượt quá 5MB',
            color: 'error'
        })
        return
    }

    isUploadingImage.value = true

    try {
        // Create preview
        const reader = new FileReader()
        reader.onload = (e) => {
            imagePreview.value = e.target?.result as string
        }
        reader.readAsDataURL(file)

        // Upload to server
        const response = await fileService.uploadFile(file, 'news-categories')

        if (response && response.success && response.data) {
            const fileData = response.data
            if (fileData && fileData.url) {
                state.imageUrl = fileData.url
                // Keep local preview for better UX
            } else {
                throw new Error('Không tìm thấy URL trong response')
            }
        } else {
            throw new Error('Response không hợp lệ')
        }

        toast.add({
            title: 'Thành công',
            description: 'Tải ảnh lên thành công',
            color: 'success'
        })
    } catch (error) {
        console.error('Upload error:', error)
        toast.add({
            title: 'Lỗi',
            description: 'Có lỗi xảy ra khi tải ảnh lên',
            color: 'error'
        })
    } finally {
        isUploadingImage.value = false
    }
}

const removeImage = () => {
    imagePreview.value = ''
    state.imageUrl = ''
    if (fileInput.value) {
        fileInput.value.value = ''
    }
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
    isLoading.value = true
    try {
        const res = await newsCategoryService.createCategory(state)

        if (res.success) {
            toast.add({
                title: 'Thành công',
                description: 'Tạo danh mục tin tức thành công',
                color: 'success'
            })
            router.push('/news-categories')
        } else {
            toast.add({
                title: 'Lỗi',
                description: res.message || 'Có lỗi xảy ra khi tạo danh mục',
                color: 'error'
            })
        }
    } catch (e: any) {
        const errorMessage = e?.message || 'Có lỗi xảy ra khi tạo danh mục'
        toast.add({
            title: 'Lỗi',
            description: errorMessage,
            color: 'error'
        })
        console.error('Create news category error:', e)
    } finally {
        isLoading.value = false
    }
}

const goBack = () => router.push('/news-categories')
</script>

<template>
    <UDashboardPanel>
        <template #header>
            <UDashboardNavbar title="Thêm danh mục tin tức">
                <template #leading>
                    <div class="flex items-center gap-3">
                        <UButton icon="i-lucide-arrow-left" variant="ghost" to="/news-categories" />
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
                            <NuxtLink to="/news-categories" class="hover:text-primary-600 dark:hover:text-primary-400">
                                Danh mục tin tức
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
                                        Mô tả
                                    </label>
                                    <textarea v-model="state.description" rows="4" placeholder="Nhập mô tả..."
                                        class="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"></textarea>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Hình ảnh URL
                                    </label>
                                    <input v-model="state.imageUrl" type="text" placeholder="https://..."
                                        class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Icon
                                    </label>
                                    <input v-model="state.icon" type="text" placeholder="i-lucide-newspaper"
                                        class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                </div>
                            </div>
                        </UPageCard>
                    </div>

                    <!-- Right Column: Settings -->
                    <div class="w-full lg:w-80 space-y-4">
                        <!-- Status Card -->
                        <UPageCard title="Trạng thái" variant="soft" class="bg-white rounded-lg">
                            <div class="space-y-2">
                                <label class="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" :value="true" v-model="state.isVisible"
                                        class="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500" />
                                    <span class="text-sm text-gray-700 dark:text-gray-300">Hiển thị</span>
                                </label>
                                <label class="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" :value="false" v-model="state.isVisible"
                                        class="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500" />
                                    <span class="text-sm text-gray-700 dark:text-gray-300">Ẩn</span>
                                </label>
                            </div>
                        </UPageCard>

                        <!-- Featured Image Card -->
                        <UPageCard title="Ảnh đại diện" variant="soft" class="bg-white rounded-lg">
                            <div class="space-y-4">
                                <div v-if="imagePreview" class="relative">
                                    <img :src="imagePreview" alt="Preview"
                                        class="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                                    <button type="button"
                                        class="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                                        @click="removeImage">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500"
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <div v-else
                                    class="upload-area border border-dashed border-gray-300 rounded-xl p-6 text-center bg-white dark:bg-gray-800 hover:border-primary-500 dark:hover:border-primary-400 focus-within:border-primary-500 dark:focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-500 transition-colors cursor-pointer"
                                    @click="clickFileInput">
                                    <div class="space-y-2">
                                        <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none"
                                            viewBox="0 0 48 48">
                                            <path
                                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                        <div class="text-sm text-gray-600 dark:text-gray-400">
                                            <span class="font-medium text-primary-600 dark:text-primary-400">Click để
                                                tải lên ảnh đại diện</span>
                                            hoặc kéo thả vào đây
                                        </div>
                                    </div>
                                </div>
                                <input ref="fileInput" type="file" accept="image/*" class="hidden"
                                    @change="handleImageUpload" />
                                <div v-if="isUploadingImage" class="text-center">
                                    <div
                                        class="inline-flex items-center px-4 py-2 text-sm text-primary-600 dark:text-primary-400">
                                        <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                                stroke-width="4" />
                                            <path class="opacity-75" fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Đang tải lên...
                                    </div>
                                </div>
                            </div>
                        </UPageCard>

                        <!-- Parent Category Card -->
                        <UPageCard title="Danh mục cha" variant="soft" class="bg-white rounded-lg">
                            <div>
                                <input v-model.number="state.parentId" type="number"
                                    placeholder="Để trống nếu là danh mục gốc"
                                    class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                <p class="mt-1 text-xs text-gray-500">Nhập ID danh mục cha (nếu có)</p>
                            </div>
                        </UPageCard>

                        <!-- Action Buttons -->
                        <div class="flex items-center justify-end gap-3">
                            <UButton label="Hủy" variant="ghost" color="neutral" @click="goBack" />
                            <UButton type="submit" label="Lưu" :loading="isLoading" />
                        </div>
                    </div>
                </UForm>

            </div>
        </template>
    </UDashboardPanel>
</template>

<style scoped>
.upload-area {
    border: 1px dashed #d1d5db !important;
}

.dark .upload-area {
    border: 1px dashed #4b5563 !important;
}
</style>
