<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { localizationService } from '~/services/localization.service'
import { projectService } from '~/services/project.service'

const router = useRouter()
const route = useRoute()

definePageMeta({
    validate: async (route) => {
        return /^\d+$/.test(route.params.id as string)
    }
})

const projectId = parseInt(route.params.id as string)
const entityType = 'ProjectDTO'

// Project metadata (read-only)
const projectName = ref('')
const projectDescription = ref('')
const projectImageUrl = ref('')
const projectCreatedDate = ref('')

// Translation data
const vnData = ref({
    name: '',
    description: ''
})

const enData = ref({
    name: '',
    description: ''
})

const isLoading = ref(true)
const isSubmitting = ref(false)
const isMounted = ref(false)

// Format date for display
function formatDate(dateString: string): string {
    if (!dateString) return ''
    try {
        const date = new Date(dateString)
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    } catch {
        return ''
    }
}

// Load data
async function loadData() {
    try {
        isLoading.value = true

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out')), 10000)
        )

        const [projectResponse, translationResponse] = await Promise.race([
            Promise.all([
                projectService.getProject(projectId).catch(err => {
                    console.error('Project Service error:', err)
                    return { success: false, data: null, message: err.message }
                }),
                localizationService.getTranslation(entityType, projectId, 'en-US').catch(() => ({ success: false, data: null }))
            ]),
            timeoutPromise
        ]) as any

        // Load project metadata
        if (projectResponse && projectResponse.success && projectResponse.data) {
            const project = projectResponse.data
            projectName.value = project.name || ''
            projectDescription.value = project.description || ''
            projectImageUrl.value = project.imageUrl || ''
            projectCreatedDate.value = project.createdDate || ''

            // Set VN data
            vnData.value = {
                name: project.name || '',
                description: project.description || ''
            }

            // Initialize empty EN data
            enData.value = {
                name: '',
                description: ''
            }
        } else if (projectResponse && !projectResponse.success) {
            console.error('Project API returned error:', projectResponse)
            alert('Không thể tải dữ liệu dự án: ' + (projectResponse.message || 'Unknown error'))
            router.push('/projects')
            return
        } else {
            console.error('Failed to load project data - null response')
            alert('Không thể tải dữ liệu dự án')
            router.push('/projects')
            return
        }

        // Load existing English translation if available
        if (translationResponse?.success && translationResponse.data) {
            try {
                const translationData = translationResponse.data

                enData.value = {
                    name: translationData.Name || translationData.name || '',
                    description: translationData.Description || translationData.description || ''
                }
            } catch (e) {
                console.error('Error parsing translation data:', e)
            }
        }
    } catch (error) {
        console.error('Error loading data:', error)
    } finally {
        isLoading.value = false
    }
}

onMounted(async () => {
    isMounted.value = true
    await loadData()
})

// Submit translation
async function handleSubmit() {
    try {
        isSubmitting.value = true

        const payload: Record<string, string> = {
            Name: enData.value.name,
            Description: enData.value.description
        }

        const result = await localizationService.updateTranslation(
            entityType,
            projectId,
            'en-US',
            payload as any
        )

        if (result.success) {
            router.push('/projects')
        } else {
            console.error('Failed to save translation:', result.message)
            alert('Lỗi: ' + (result.message || 'Không thể lưu bản dịch'))
        }
    } catch (error) {
        console.error('Error saving translation:', error)
        alert('Có lỗi xảy ra khi lưu bản dịch')
    } finally {
        isSubmitting.value = false
    }
}

function handleCancel() {
    router.push('/projects')
}
</script>

<template>
    <UDashboardPanel>
        <template #header>
            <UDashboardNavbar title="Project Translation">
                <template #leading>
                    <UButton icon="i-lucide-arrow-left" variant="ghost" color="neutral" @click="handleCancel" />
                </template>
                <template #right>
                    <UButton label="Lưu bản dịch" icon="i-lucide-save" color="primary" :loading="isSubmitting"
                        @click="handleSubmit" />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="w-full max-w-6xl mx-auto px-4 lg:px-6 py-6 transition-opacity duration-300"
                :class="{ 'opacity-100': isMounted, 'opacity-0': !isMounted }">
                <div v-if="isLoading" class="text-center py-20">
                    <UIcon name="i-lucide-loader-2" class="animate-spin text-4xl text-primary mb-4" />
                    <p class="text-gray-600 dark:text-gray-400">Đang tải dữ liệu...</p>
                </div>

                <div v-else class="flex flex-col lg:flex-row gap-6">
                    <!-- Left Column: Translation Form -->
                    <div class="flex-1 space-y-6">
                        <UPageCard title="Nội dung chính - English Translation" variant="soft"
                            class="bg-white rounded-lg">
                            <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-4">
                                <!-- Name -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Name (EN)
                                        <span class="text-xs text-gray-500 ml-2">(VN: {{ vnData.name }})</span>
                                    </label>
                                    <input v-model="enData.name" type="text" placeholder="Enter English name"
                                        class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                </div>

                                <!-- Description -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Description (EN)
                                        <span class="text-xs text-gray-500 ml-2">(VN: {{ vnData.description }})</span>
                                    </label>
                                    <textarea v-model="enData.description" rows="8"
                                        placeholder="Enter English description"
                                        class="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"></textarea>
                                </div>
                            </div>
                        </UPageCard>
                    </div>

                    <!-- Right Column: Project Metadata (Read-only) -->
                    <div class="w-full lg:w-80 space-y-6">
                        <UPageCard title="Project Information" variant="soft" class="bg-white rounded-lg">
                            <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name
                                        (VN)</label>
                                    <input :value="projectName" type="text" disabled
                                        class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400" />
                                </div>

                                <div>
                                    <label
                                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description
                                        (VN)</label>
                                    <textarea :value="projectDescription" rows="6" disabled
                                        class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400"></textarea>
                                </div>

                                <div>
                                    <label
                                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Created
                                        Date</label>
                                    <input :value="formatDate(projectCreatedDate)" type="text" disabled
                                        class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400" />
                                </div>

                                <div v-if="projectImageUrl">
                                    <label
                                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Image</label>
                                    <img :src="projectImageUrl" alt="Project image"
                                        class="w-full rounded-md border border-gray-200 dark:border-gray-700" />
                                </div>
                            </div>
                        </UPageCard>
                    </div>
                </div>
            </div>
        </template>
    </UDashboardPanel>
</template>
