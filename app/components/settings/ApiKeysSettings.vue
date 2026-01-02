```
<script setup lang="ts">
import { apiKeysService, type ApiKey } from '@/services/apiKeys.service'

const toast = useToast()

// State
const apiKeys = ref<ApiKey[]>([])
const isCreateModalOpen = ref(false)
const isLoading = ref(false)
const isLoadingData = ref(false)

const form = reactive({
    name: '',
    description: '',
    expiresAt: '',
    allowedIPs: '',
    rateLimit: 0 as number | null
})

// Fetch API keys on mount
async function fetchApiKeys() {
    try {
        isLoadingData.value = true
        const response = await apiKeysService.getApiKeys()
        if (response.success && response.data) {
            apiKeys.value = response.data
        }
    } catch (error) {
        console.error('Failed to fetch API keys:', error)
        toast.add({
            title: 'Lỗi tải dữ liệu',
            description: 'Không thể tải danh sách API keys',
            color: 'error'
        })
    } finally {
        isLoadingData.value = false
    }
}

function openCreateModal() {
    form.name = ''
    form.description = ''
    form.expiresAt = ''
    form.allowedIPs = ''
    form.rateLimit = 0

    isCreateModalOpen.value = true
}

async function createApiKey() {
    if (!form.name.trim()) {
        toast.add({
            title: 'Lỗi',
            description: 'Vui lòng nhập tên khoá API',
            color: 'error'
        })
        return
    }

    try {
        isLoading.value = true
        await apiKeysService.createApiKey({
            name: form.name,
            description: form.description || undefined,
            expiresAt: form.expiresAt || undefined,
            allowedIPs: form.allowedIPs || undefined,
            rateLimit: form.rateLimit || undefined
        })

        isCreateModalOpen.value = false
        toast.add({ title: 'Tạo khoá thành công', color: 'success' })

        // Refresh the list
        await fetchApiKeys()
    } catch (error: any) {
        console.error('Failed to create API key:', error)
        toast.add({
            title: 'Lỗi tạo khoá',
            description: error?.response?.data?.message || 'Không thể tạo khoá API',
            color: 'error'
        })
    } finally {
        isLoading.value = false
    }
}

async function deleteApiKey(id: number) {
    if (!confirm('Bạn có chắc chắn muốn xoá khoá này?')) return

    try {
        await apiKeysService.deleteApiKey(id)
        toast.add({ title: 'Đã xoá khoá API', color: 'success' })

        // Refresh the list
        await fetchApiKeys()
    } catch (error: any) {
        console.error('Failed to delete API key:', error)
        toast.add({
            title: 'Lỗi xoá khoá',
            description: error?.response?.data?.message || 'Không thể xoá khoá API',
            color: 'error'
        })
    }
}

function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast.add({ title: 'Đã sao chép vào clipboard', color: 'success' })
}



// Format date for display
function formatDate(dateString: string | null): string {
    if (!dateString) return 'Never'
    try {
        return new Date(dateString).toLocaleDateString('vi-VN')
    } catch {
        return dateString
    }
}

// Truncate key for display
function truncateKey(key: string): string {
    if (!key) return ''
    if (key.length <= 10) return key
    return key.substring(0, Math.floor(key.length / 3)) + '...'
}

// Fetch data on mount
onMounted(() => {
    fetchApiKeys()
})
</script>

<template>
    <div class="space-y-4">
        <UPageCard variant="soft" class="bg-white rounded-lg">
            <div class="-mx-6 px-6">
                <BaseCardHeader>
                    Quản lý khoá API
                    <template #actions>
                        <UButton icon="i-lucide-plus-circle" color="primary" variant="soft" size="sm"
                            label="Tạo khoá mới" @click="openCreateModal" />
                    </template>
                </BaseCardHeader>
                <p class="mt-2 text-sm text-gray-500">Quản lý các khoá API để truy cập vào hệ thống từ bên ngoài.</p>
            </div>

            <div class="-mx-6 border-t border-gray-200">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th scope="col"
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                                    Tên
                                    & Mô tả</th>
                                <th scope="col"
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Khoá
                                    (Token)</th>
                                <th scope="col"
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ngày tạo
                                </th>
                                <th scope="col"
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Lần dùng
                                    cuối</th>
                                <th scope="col" class="relative px-6 py-3"><span class="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr v-for="key in apiKeys" :key="key.id">
                                <td class="px-6 py-4 text-sm text-gray-900">
                                    <div class="font-semibold text-gray-900">{{ key.name }}</div>
                                    <div class="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]"
                                        :title="key.description">{{
                                            key.description || 'Không có mô tả' }}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono bg-gray-50 rounded select-all"
                                    :title="key.fullKey">
                                    {{ truncateKey(key.fullKey) }}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{
                                    formatDate(key.createdAt) }}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{
                                    formatDate(key.lastUsedAt) }}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div class="flex items-center justify-end gap-1">
                                        <button
                                            class="p-1.5 transition-colors text-gray-400 hover:text-primary-600 dark:text-gray-500 dark:hover:text-primary-400 rounded-md hover:bg-primary-50 dark:hover:bg-primary-950/30"
                                            title="Sao chép khoá" @click="copyToClipboard(key.fullKey)">
                                            <UIcon name="i-lucide-copy" class="w-4 h-4" />
                                        </button>
                                        <button
                                            class="p-1.5 transition-colors text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30"
                                            title="Xoá khoá" @click="deleteApiKey(key.id)">
                                            <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </UPageCard>

        <!-- Create Modal using BaseModal -->
        <BaseModal v-model="isCreateModalOpen" title="Tạo khoá API mới" width-class="max-w-2xl"
            body-class="px-6 py-5 space-y-6 text-sm">
            <form class="space-y-6" @submit.prevent="createApiKey">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Tên khoá API -->
                    <div class="md:col-span-2">
                        <label class="block text-xs font-medium text-gray-600 mb-1">
                            Tên khoá API <span class="text-red-500">*</span>
                        </label>
                        <input v-model="form.name" type="text"
                            class="w-full h-9 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Ví dụ: Website Integration" />
                    </div>

                    <!-- Mô tả -->
                    <div class="md:col-span-2">
                        <label class="block text-xs font-medium text-gray-600 mb-1">Mô tả</label>
                        <textarea v-model="form.description" rows="2"
                            class="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                            placeholder="Mô tả mục đích sử dụng..."></textarea>
                    </div>

                    <!-- Ngày hết hạn -->
                    <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">Ngày hết hạn</label>
                        <input v-model="form.expiresAt" type="date"
                            class="w-full h-9 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>

                    <!-- Giới hạn request -->
                    <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">Giới hạn (req/phút)</label>
                        <input v-model="form.rateLimit" type="number"
                            class="w-full h-9 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="0" />
                    </div>

                    <!-- IP được phép -->
                    <div class="md:col-span-2">
                        <label class="block text-xs font-medium text-gray-600 mb-1">IP được phép</label>
                        <textarea v-model="form.allowedIPs" rows="2"
                            class="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                            placeholder="192.168.1.1, 10.0.0.1"></textarea>
                    </div>
                </div>
            </form>

            <template #footer>
                <button type="button"
                    class="h-9 px-4 rounded-md border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50"
                    @click="isCreateModalOpen = false">
                    Huỷ
                </button>
                <button type="button"
                    class="h-9 px-5 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
                    :disabled="isLoading" @click="createApiKey">
                    {{ isLoading ? 'Đang tạo...' : 'Lưu' }}
                </button>
            </template>
        </BaseModal>
    </div>
</template>
```
