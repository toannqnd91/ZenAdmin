<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { useProjectForm } from '@/composables/useProjectForm'

// Asynchronous component import for TinyMCE
const TinyMCESelfHost = defineAsyncComponent(() => import('@/components/TinyMCESelfHost.vue'))

interface Props { projectId?: number }
const props = defineProps<Props>()

const isEdit = computed(() => typeof props.projectId === 'number' && !isNaN(props.projectId))

const {
    formData,
    isSubmitting,
    isLoading,
    errors,
    publicationStatus,
    statusItems,
    // Tags (reused from news style if needed, or simplified)
    // Categories
    isDropdownOpen,
    searchTerm,
    filteredCategories,
    selectedCategories,
    toggleCategory,
    removeCategory,
    isCategoriesLoading,
    categoriesError,
    // Image
    isUploadingImage,
    imagePreview,
    fileInput,
    handleImageUpload,
    removeImage,
    clickFileInput,
    submitForm
} = await useProjectForm(props.projectId)

const goBack = () => navigateTo('/projects')
const handleCancel = () => navigateTo('/projects')
const handleSubmitClick = () => { void submitForm() }

</script>

<template>
    <UDashboardPanel :id="isEdit ? 'edit-project' : 'add-project'">
        <template #header>
            <UDashboardNavbar :title="isEdit ? 'Chỉnh sửa dự án' : 'Thêm dự án mới'">
                <template #leading>
                    <div class="flex items-center gap-3">
                        <button
                            class="h-8 w-8 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                            @click="goBack">
                            <UIcon name="i-lucide-arrow-left" class="w-5 h-5" />
                        </button>
                    </div>
                </template>
                <template #right>
                    <div class="flex items-center gap-2">
                        <UButton label="Hủy" variant="ghost" color="neutral" @click="handleCancel" />
                        <UButton :label="isEdit ? 'Cập nhật' : 'Lưu'" :loading="isSubmitting"
                            @click="handleSubmitClick" />
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
                            <NuxtLink to="/projects" class="hover:text-primary-600 dark:hover:text-primary-400">Quản lý
                                dự án</NuxtLink>
                        </li>
                        <li class="flex items-center">
                            <UIcon name="i-lucide-chevron-right" class="w-4 h-4 mx-2" />
                            <span class="text-gray-900 dark:text-white font-medium">{{ isEdit ? 'Chỉnh sửa dự án' :
                                'Thêm dự án mới' }}</span>
                        </li>
                    </ol>
                </nav>

                <div v-if="isLoading" class="flex items-center justify-center py-12">
                    <UIcon name="i-lucide-loader-2" class="animate-spin h-8 w-8 text-primary-600 mx-auto mb-4" />
                    <p class="text-gray-500">Đang tải dữ liệu...</p>
                </div>

                <div v-else class="flex flex-col lg:flex-row gap-6">
                    <!-- Left Column -->
                    <div class="flex-1 space-y-6">
                        <UPageCard title="Thông tin dự án" variant="soft" class="bg-white rounded-lg overflow-hidden">
                            <form class="space-y-6" @submit.prevent="submitForm">
                                <!-- Name -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tên
                                        dự án <span class="text-red-500">*</span></label>
                                    <input v-model="formData.name" type="text" placeholder="Nhập tên dự án"
                                        :class="{ 'border-red-500': errors.name }"
                                        class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
                                </div>

                                <!-- Slug & Client (Row) -->
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Slug</label>
                                        <input v-model="formData.slug" type="text" placeholder="tự-động-tạo-từ-tên"
                                            class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    </div>
                                    <div>
                                        <label
                                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Khách
                                            hàng</label>
                                        <input v-model="formData.clientName" type="text"
                                            class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    </div>
                                </div>

                                <!-- Location & Budget (Row) -->
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Địa
                                            điểm</label>
                                        <input v-model="formData.location" type="text"
                                            class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    </div>
                                    <div>
                                        <label
                                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ngân
                                            sách</label>
                                        <input v-model="formData.budget" type="number"
                                            class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    </div>
                                </div>

                                <!-- Dates (Row) -->
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ngày
                                            bắt đầu</label>
                                        <input v-model="formData.startDate" type="datetime-local"
                                            class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    </div>
                                    <div>
                                        <label
                                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ngày
                                            kết thúc</label>
                                        <input v-model="formData.endDate" type="datetime-local"
                                            class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    </div>
                                </div>

                                <!-- Content -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nội
                                        dung chi tiết <span class="text-red-500">*</span></label>
                                    <div
                                        class="rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden bg-white dark:bg-gray-800">
                                        <TinyMCESelfHost v-model="formData.content" editor-id="project-content-editor"
                                            placeholder="Nhập nội dung dự án..." :height="400" />
                                    </div>
                                    <p v-if="errors.content" class="mt-1 text-sm text-red-600">{{ errors.content }}</p>
                                </div>

                                <!-- Description -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mô tả
                                        ngắn <span class="text-red-500">*</span></label>
                                    <div
                                        class="rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden bg-white dark:bg-gray-800">
                                        <TinyMCESelfHost v-model="formData.description" editor-id="project-desc-editor"
                                            placeholder="Nhập mô tả ngắn..." :height="200" plain-text />
                                    </div>
                                    <p v-if="errors.description" class="mt-1 text-sm text-red-600">{{ errors.description
                                    }}</p>
                                </div>
                            </form>
                        </UPageCard>

                        <!-- SEO Meta -->
                        <UPageCard title="SEO Meta Tags" variant="soft" class="bg-white rounded-lg overflow-hidden">
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Meta
                                        Title</label>
                                    <input v-model="formData.metaTitle" type="text"
                                        class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Meta
                                        Keywords</label>
                                    <input v-model="formData.metaKeywords" type="text"
                                        class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Meta
                                        Description</label>
                                    <textarea v-model="formData.metaDescription" rows="3"
                                        class="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"></textarea>
                                </div>
                            </div>
                        </UPageCard>
                    </div>

                    <!-- Right Column -->
                    <div class="w-full lg:w-80 space-y-6">
                        <!-- Publish Status -->
                        <UPageCard title="Trạng thái" variant="soft" class="bg-white rounded-lg">
                            <URadioGroup v-model="publicationStatus" :items="statusItems" class="space-y-2" />
                            <div class="mt-4 space-y-2">
                                <UCheckbox v-model="formData.isFeatured" label="Nổi bật" />
                            </div>
                        </UPageCard>

                        <!-- Image Upload -->
                        <UPageCard title="Ảnh đại diện" variant="soft" class="bg-white rounded-lg">
                            <div class="space-y-4">
                                <div v-if="imagePreview" class="relative">
                                    <img :src="imagePreview" alt="Preview"
                                        class="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700">
                                    <button type="button"
                                        class="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                                        @click="removeImage">
                                        <UIcon name="i-lucide-x" class="w-4 h-4 text-gray-500" />
                                    </button>
                                </div>

                                <div v-else
                                    class="upload-area border border-dashed border-gray-300 rounded-xl p-6 text-center bg-white dark:bg-gray-800 hover:border-primary-500 dark:hover:border-primary-400 focus-within:border-primary-500 cursor-pointer"
                                    @click="clickFileInput">
                                    <div class="space-y-2">
                                        <UIcon name="i-lucide-image" class="mx-auto h-12 w-12 text-gray-400" />
                                        <div class="text-sm text-gray-600 dark:text-gray-400">
                                            <span class="font-medium text-primary-600">Click để tải ảnh</span>
                                        </div>
                                    </div>
                                </div>

                                <input ref="fileInput" type="file" accept="image/*" class="hidden"
                                    @change="handleImageUpload">

                                <div v-if="isUploadingImage" class="text-center text-sm text-primary-600">
                                    <UIcon name="i-lucide-loader-2" class="animate-spin mr-2" /> Đang tải lên...
                                </div>
                            </div>
                        </UPageCard>

                        <!-- Categories -->
                        <UPageCard title="Danh mục" variant="soft" class="bg-white rounded-lg">
                            <div class="relative dropdown-container">
                                <button type="button"
                                    class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white flex items-center justify-between"
                                    @click="isDropdownOpen = !isDropdownOpen">
                                    <span class="text-gray-500 truncate">
                                        {{ selectedCategories.length > 0 ? `Đã chọn ${selectedCategories.length} danh
                                        mục` : 'Chọn danh mục' }}
                                    </span>
                                    <UIcon name="i-lucide-chevron-down" class="w-4 h-4"
                                        :class="{ 'rotate-180': isDropdownOpen }" />
                                </button>

                                <div v-if="isDropdownOpen"
                                    class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
                                    <div class="p-2 border-b border-gray-200 dark:border-gray-700">
                                        <input v-model="searchTerm" type="text" placeholder="Tìm kiếm..."
                                            class="w-full px-3 h-8 text-sm rounded border border-gray-300 dark:border-gray-600">
                                    </div>
                                    <div class="max-h-40 overflow-y-auto">
                                        <div v-if="isCategoriesLoading" class="p-3 text-sm text-gray-500">Đang tải...
                                        </div>
                                        <div v-else-if="!filteredCategories.length" class="p-3 text-sm text-gray-500">
                                            Không tìm thấy</div>
                                        <label v-for="category in filteredCategories" :key="category.id"
                                            class="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                            <UCheckbox :model-value="formData.categoryIds.includes(category.id)"
                                                @update:model-value="toggleCategory(category.id)" />
                                            <span class="text-sm truncate">{{ category.name }}</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <!-- Selected Chips -->
                            <div v-if="selectedCategories.length > 0" class="flex flex-wrap gap-1 mt-3">
                                <span v-for="category in selectedCategories" :key="category.id"
                                    class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary-100 text-primary-800">
                                    {{ category.name }}
                                    <button type="button" class="ml-1 text-primary-600 hover:text-primary-800"
                                        @click="removeCategory(category.id)">×</button>
                                </span>
                            </div>
                            <p v-if="errors.categoryIds" class="mt-1 text-sm text-red-600">{{ errors.categoryIds }}</p>
                        </UPageCard>

                        <!-- Display Order -->
                        <UPageCard title="Thứ tự hiển thị" variant="soft" class="bg-white rounded-lg">
                            <input v-model="formData.displayOrder" type="number"
                                class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                        </UPageCard>
                    </div>
                </div>
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
