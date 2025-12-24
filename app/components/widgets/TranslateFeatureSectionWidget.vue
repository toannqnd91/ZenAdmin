<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { localizationService } from '~/services/localization.service'
import { widgetsService } from '~/services/widgets.service'

const router = useRouter()
const route = useRoute()

const widgetId = parseInt(route.params.id as string)
const entityType = 'WidgetInstanceDTO'

const isLoading = ref(false)
const isSaving = ref(false)
const isMounted = ref(false)

// Widget metadata (read-only)
const widgetName = ref('')
const widgetZone = ref('')
const displayOrder = ref(0)
const publishStart = ref('')
const publishEnd = ref('')

// Vietnamese data (read-only for reference)
const vnData = ref<any>({})

// English translation data
const enData = ref({
    mainTitle: '',
    subTitle: '',
    contentTitle: '',
    contentDescription: '',
    sections: [] as Array<{ title: string; description: string; sortOrder: number }>
})

onMounted(async () => {
    isMounted.value = true
    await loadData()
})

async function loadData() {
    isLoading.value = true
    try {
        // Load widget data (Vietnamese)
        const widgetResponse = await widgetsService.getWidgetInstance(widgetId)
        if (widgetResponse && widgetResponse.success && widgetResponse.data) {
            const data = widgetResponse.data

            // Load widget metadata
            widgetName.value = data.name || ''
            widgetZone.value = data.widgetZone || ''
            displayOrder.value = data.displayOrder || 0
            publishStart.value = data.publishStart || ''
            publishEnd.value = data.publishEnd || ''

            // Parse Vietnamese JSON data
            const jsonDataString = data.data || data.htmlData
            if (jsonDataString) {
                const jsonData = typeof jsonDataString === 'string' ? JSON.parse(jsonDataString) : jsonDataString
                vnData.value = jsonData

                // Initialize English sections structure based on Vietnamese sections
                if (jsonData.sections && jsonData.sections.length > 0) {
                    enData.value.sections = jsonData.sections.map((s: any, idx: number) => ({
                        title: '',
                        description: '',
                        sortOrder: s.sortOrder || idx + 1
                    }))
                }
            }
        }

        // Load existing English translation
        const result = await localizationService.getTranslation(entityType, widgetId, 'en-US')

        if (result && result.success && result.data) {
            // Parse Data field if it exists (might be JSON string)
            let translationData = result.data
            if (result.data.Data) {
                try {
                    const parsedData = typeof result.data.Data === 'string'
                        ? JSON.parse(result.data.Data)
                        : result.data.Data
                    translationData = { ...parsedData, ...result.data }
                } catch (e) {
                    console.error('Error parsing Data field:', e)
                }
            }

            // Use Object.assign to ensure reactivity
            Object.assign(enData.value, {
                mainTitle: translationData.mainTitle || '',
                subTitle: translationData.subTitle || '',
                contentTitle: translationData.contentTitle || '',
                contentDescription: translationData.contentDescription || ''
            })

            // Load section translations
            if (translationData.sections && Array.isArray(translationData.sections)) {
                translationData.sections.forEach((enSection: any, idx: number) => {
                    if (enData.value.sections[idx]) {
                        enData.value.sections[idx].title = enSection.title || ''
                        enData.value.sections[idx].description = enSection.description || ''
                    }
                })
            }
        }
    } catch (error) {
        console.error('Error loading data:', error)
    } finally {
        isLoading.value = false
    }
}

function addSection() {
    const newSortOrder = enData.value.sections.length > 0
        ? Math.max(...enData.value.sections.map(s => s.sortOrder)) + 1
        : 1
    enData.value.sections.push({
        title: '',
        description: '',
        sortOrder: newSortOrder
    })
}

function removeSection(idx: number) {
    if (enData.value.sections.length <= 1) return
    enData.value.sections.splice(idx, 1)
}

async function handleSubmit() {
    isSaving.value = true
    try {
        // Build complete widget data combining English translations with Vietnamese non-translatable fields
        const widgetData = {
            mainTitle: enData.value.mainTitle || '',
            subTitle: enData.value.subTitle || '',
            mainImageUrl: vnData.value.mainImageUrl || '', // Keep Vietnamese image URL
            contentTitle: enData.value.contentTitle || '',
            contentDescription: enData.value.contentDescription || '',
            layout: vnData.value.layout || 'image-left', // Keep Vietnamese layout
            backgroundStyle: vnData.value.backgroundStyle || '', // Keep Vietnamese background
            sections: enData.value.sections.map((enSection, idx) => {
                const vnSection = vnData.value.sections?.[idx] || {}
                return {
                    title: enSection.title || '',
                    description: enSection.description || '',
                    imageUrl: vnSection.imageUrl || '', // Keep Vietnamese image URL
                    iconClass: vnSection.iconClass || '', // Keep Vietnamese icon
                    sortOrder: enSection.sortOrder
                }
            })
        }

        // Send as single Data field with JSON string
        const payload = {
            Data: JSON.stringify(widgetData)
        }


        const result = await localizationService.updateTranslation(
            entityType,
            widgetId,
            'en-US',
            payload as any
        )

        if (result && result.success) {
            alert('Translation saved successfully!')
            router.push('/widgets')
        } else {
            alert('Failed to save translation: ' + (result?.message || 'Unknown error'))
        }
    } catch (error) {
        console.error('Error saving translation:', error)
        alert('Failed to save translation')
    } finally {
        isSaving.value = false
    }
}

function handleCancel() {
    router.push('/widgets')
}

function formatDate(isoString: string): string {
    if (!isoString) return ''
    try {
        const date = new Date(isoString)
        const day = date.getDate().toString().padStart(2, '0')
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const year = date.getFullYear()
        const hours = date.getHours().toString().padStart(2, '0')
        const minutes = date.getMinutes().toString().padStart(2, '0')
        return `${day}/${month}/${year} ${hours}:${minutes}`
    } catch {
        return ''
    }
}
</script>

<template>
    <Teleport to="#navbar-actions" v-if="isMounted">
        <div class="flex items-center gap-2">
            <UButton label="Lưu thay đổi" icon="i-lucide-save" color="primary" :loading="isSaving"
                @click="handleSubmit" />
        </div>
    </Teleport>

    <div class="w-full max-w-6xl mx-auto px-4 lg:px-6 py-6">
        <div v-if="isLoading" class="text-center py-20">
            <UIcon name="i-lucide-loader-2" class="animate-spin text-4xl text-primary mb-4" />
            <p class="text-gray-600 dark:text-gray-400">Đang tải dữ liệu...</p>
        </div>

        <div v-else class="flex flex-col lg:flex-row gap-6">
            <!-- Left Column: Translation Content -->
            <div class="flex-1 space-y-6">
                <!-- Main Content -->
                <UPageCard title="Nội dung chính - English Translation" variant="soft" class="bg-white rounded-lg">
                    <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Main Title
                                    <span class="text-xs text-gray-500 ml-2">(VN: {{ vnData.mainTitle }})</span>
                                </label>
                                <input v-model="enData.mainTitle" type="text" placeholder="Enter English main title"
                                    class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Sub Title
                                    <span class="text-xs text-gray-500 ml-2">(VN: {{ vnData.subTitle }})</span>
                                </label>
                                <input v-model="enData.subTitle" type="text" placeholder="Enter English sub title"
                                    class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Content Title
                                <span class="text-xs text-gray-500 ml-2">(VN: {{ vnData.contentTitle }})</span>
                            </label>
                            <input v-model="enData.contentTitle" type="text" placeholder="Enter English content title"
                                class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Content Description
                            </label>
                            <div
                                class="mb-2 p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                                <p class="text-xs text-gray-500 dark:text-gray-400">VN: {{ vnData.contentDescription }}
                                </p>
                            </div>
                            <textarea v-model="enData.contentDescription" rows="6"
                                placeholder="Enter English content description"
                                class="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"></textarea>
                        </div>
                    </div>
                </UPageCard>

                <!-- Sections -->
                <UPageCard title="Sections - English Translation" variant="soft" class="bg-white rounded-lg">
                    <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-4">
                        <div v-for="(section, idx) in enData.sections" :key="idx"
                            class="py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 relative">
                            <div class="absolute top-4 right-0">
                                <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs"
                                    title="Xoá section" @click="() => removeSection(idx)"
                                    :disabled="enData.sections.length <= 1" />
                            </div>

                            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">Section #{{ idx + 1 }}
                            </h3>

                            <div class="space-y-3">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Title
                                        <span class="text-xs text-gray-500 ml-2"
                                            v-if="vnData.sections && vnData.sections[idx]">
                                            (VN: {{ vnData.sections[idx].title }})
                                        </span>
                                    </label>
                                    <input v-model="section.title" type="text" placeholder="Enter English section title"
                                        class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Description
                                    </label>
                                    <div v-if="vnData.sections && vnData.sections[idx]"
                                        class="mb-2 p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                                        <p class="text-xs text-gray-500 dark:text-gray-400">VN: {{
                                            vnData.sections[idx].description }}</p>
                                    </div>
                                    <textarea v-model="section.description" rows="3"
                                        placeholder="Enter English section description"
                                        class="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"></textarea>
                                </div>
                            </div>
                        </div>


                        <div class="flex justify-end pt-2">
                            <UButton label="Thêm Section" icon="i-lucide-plus" variant="soft" @click="addSection" />
                        </div>
                    </div>
                </UPageCard>
            </div>
            <!-- End Left Column -->

            <!-- Right Column: Widget Metadata (Read-only) -->
            <div class="w-full lg:w-80 space-y-6">
                <UPageCard title="Thông tin widget" variant="soft" class="bg-white rounded-lg">
                    <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tên
                                Widget</label>
                            <input :value="widgetName" disabled
                                class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vị trí
                                (Zone)</label>
                            <input :value="widgetZone" disabled
                                class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Thứ tự hiển
                                thị</label>
                            <input :value="displayOrder" disabled
                                class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Widget
                                ID</label>
                            <input :value="widgetId" disabled
                                class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                        </div>
                    </div>
                </UPageCard>

                <UPageCard title="Thời gian xuất bản" variant="soft" class="bg-white rounded-lg">
                    <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ngày bắt
                                đầu</label>
                            <input :value="formatDate(publishStart)" disabled
                                class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ngày kết
                                thúc</label>
                            <input :value="formatDate(publishEnd)" disabled
                                class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                        </div>
                    </div>
                </UPageCard>
            </div>
            <!-- End Right Column -->
        </div>
    </div>
</template>
