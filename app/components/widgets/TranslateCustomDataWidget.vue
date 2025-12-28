<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { widgetsService } from '~/services/widgets.service'
import { localizationService } from '~/services/localization.service'

const router = useRouter()
const route = useRoute()

const widgetId = parseInt(route.params.id as string)
const entityType = 'WidgetInstanceDTO'

// Widget metadata (read-only)
const widgetName = ref('')
const widgetZone = ref('')
const displayOrder = ref(0)
const publishStart = ref('')
const publishEnd = ref('')

// Translation data
const vnData = ref<any>({ items: [] })
const enData = ref<any>({ items: [] })

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

        // Fetch widget data and translation in parallel
        const [widgetResponse, translationResponse] = await Promise.all([
            widgetsService.getWidgetInstance(widgetId),
            localizationService.getTranslation(entityType, widgetId, 'en-US').catch(() => ({ success: false, data: null }))
        ])

        // Load widget metadata
        if (widgetResponse?.success && widgetResponse.data) {
            const widget = widgetResponse.data

            widgetName.value = widget.name
            widgetZone.value = widget.zone
            displayOrder.value = widget.displayOrder
            publishStart.value = widget.publishStart
            publishEnd.value = widget.publishEnd

            // Parse Vietnamese data
            if (widget.data) {
                try {
                    const parsedData = typeof widget.data === 'string' ? JSON.parse(widget.data) : widget.data

                    // Handle both formats: array directly or object with items
                    let itemsArray = []
                    if (Array.isArray(parsedData)) {
                        // Data is array directly
                        itemsArray = parsedData
                        vnData.value = { items: parsedData }
                    } else if (parsedData.items) {
                        // Data is object with items property
                        itemsArray = parsedData.items
                        vnData.value = parsedData
                    } else {
                        // Unknown format
                        console.warn('Unknown data format:', parsedData)
                        vnData.value = { items: [] }
                    }


                    // Initialize empty English data with same structure
                    enData.value = {
                        items: itemsArray.map((item: any) => ({
                            Caption: '',
                            SubCaption: '',
                            LinkText: '',
                            TargetUrl: item.TargetUrl || item.targetUrl || '',
                            SortOrder: item.SortOrder ?? item.sortOrder ?? 0,
                            ImageUrl: item.ImageUrl || item.imageUrl || '',
                            Description: item.Description || null
                        }))
                    }

                } catch (e) {
                    console.error('Error parsing widget data:', e)
                }
            }
        }

        // Load existing English translation if available
        if (translationResponse?.success && translationResponse.data) {
            try {
                const translationData = translationResponse.data

                // Parse Data field (it's a JSON string containing array)
                if (translationData.Data) {
                    const parsedData = typeof translationData.Data === 'string'
                        ? JSON.parse(translationData.Data)
                        : translationData.Data


                    // Data is array directly
                    if (Array.isArray(parsedData)) {
                        Object.assign(enData.value, {
                            items: parsedData.map((item: any, idx: number) => ({
                                Caption: item.Caption || item.caption || '',
                                SubCaption: item.SubCaption || item.subCaption || '',
                                LinkText: item.LinkText || item.linkText || '',
                                TargetUrl: item.TargetUrl || item.targetUrl || vnData.value.items[idx]?.TargetUrl || '',
                                SortOrder: item.SortOrder ?? item.sortOrder ?? vnData.value.items[idx]?.SortOrder ?? idx,
                                ImageUrl: item.ImageUrl || item.imageUrl || vnData.value.items[idx]?.ImageUrl || '',
                                Description: item.Description ?? item.description ?? null
                            }))
                        })
                    }
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

// Add new item
function addItem() {
    enData.value.items.push({
        Caption: '',
        SubCaption: '',
        LinkText: '',
        TargetUrl: '',
        SortOrder: enData.value.items.length,
        ImageUrl: '',
        Description: null
    })
}

// Remove item
function removeItem(idx: number) {
    if (enData.value.items.length > 1) {
        enData.value.items.splice(idx, 1)
    }
}

// Submit translation
async function handleSubmit() {
    try {
        isSubmitting.value = true

        // Prepare payload - save as Data property (not items)
        const payload: Record<string, string> = {}

        if (enData.value.items && enData.value.items.length > 0) {
            payload.Data = JSON.stringify(enData.value.items)
        }


        const result = await localizationService.updateTranslation(
            entityType,
            widgetId,
            'en-US',
            payload as any
        )


        if (result.success) {
            router.push('/widgets')
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
    router.push('/widgets')
}
</script>

<template>
    <Teleport to="#navbar-actions" v-if="isMounted">
        <div class="flex items-center gap-2">
            <UButton icon="i-lucide-arrow-left" variant="ghost" color="neutral" @click="handleCancel" />
            <UButton label="Lưu bản dịch" icon="i-lucide-save" color="primary" :loading="isSubmitting"
                @click="handleSubmit" />
        </div>
    </Teleport>

    <div class="w-full max-w-6xl mx-auto px-4 lg:px-6 py-6">
        <div v-if="isLoading" class="text-center py-20">
            <UIcon name="i-lucide-loader-2" class="animate-spin text-4xl text-primary mb-4" />
            <p class="text-gray-600">Đang tải dữ liệu...</p>
        </div>

        <form v-else class="flex flex-col lg:flex-row gap-6" @submit.prevent="handleSubmit">
            <!-- Left Column: Translation Form -->
            <div class="flex-1 space-y-6">
                <UPageCard title="English Translation" variant="soft" class="bg-white rounded-lg">
                    <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-6">
                        <!-- Empty state -->
                        <div v-if="!enData.items || enData.items.length === 0" class="text-center py-8">
                            <UIcon name="i-lucide-inbox" class="text-4xl text-gray-400 mb-4" />
                            <p class="text-gray-600 mb-4">Không có items để dịch</p>
                            <p class="text-sm text-gray-500 mb-4">Widget gốc không có dữ liệu items</p>
                            <UButton label="Add Item Manually" icon="i-lucide-plus" variant="soft" @click="addItem" />
                        </div>

                        <!-- Items -->
                        <div v-else v-for="(item, idx) in enData.items" :key="idx"
                            class="py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 relative">

                            <!-- Remove button -->
                            <div class="absolute top-4 right-0">
                                <UButton icon="i-lucide-trash-2" size="sm" color="error" variant="ghost"
                                    @click="() => removeItem(idx)" :disabled="enData.items.length <= 1" />
                            </div>

                            <h3
                                class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                                Item #{{ idx + 1 }}
                            </h3>

                            <div class="space-y-4">
                                <!-- Caption & SubCaption - 2 columns -->
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Caption (EN)
                                            <span class="text-xs text-gray-500 ml-2">(VN: {{ vnData.items[idx]?.Caption
                                                || 'N/A' }})</span>
                                        </label>
                                        <input v-model="item.Caption" type="text" placeholder="Enter English caption"
                                            class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Sub Caption (EN)
                                            <span class="text-xs text-gray-500 ml-2">(VN: {{
                                                vnData.items[idx]?.SubCaption || 'N/A' }})</span>
                                        </label>
                                        <input v-model="item.SubCaption" type="text"
                                            placeholder="Enter English sub caption"
                                            class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                    </div>
                                </div>

                                <!-- LinkText -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Link Text (EN)
                                        <span class="text-xs text-gray-500 ml-2">(VN: {{ vnData.items[idx]?.LinkText ||
                                            'N/A' }})</span>
                                    </label>
                                    <input v-model="item.LinkText" type="text" placeholder="Enter English link text"
                                        class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                </div>

                                <!-- TargetUrl & SortOrder - 2 columns -->
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Target URL
                                        </label>
                                        <input v-model="item.TargetUrl" type="text" disabled
                                            class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400" />
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Sort Order
                                        </label>
                                        <input v-model.number="item.SortOrder" type="number" min="0"
                                            class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Add Item Button -->
                        <div class="pt-4">
                            <UButton label="Add Item" icon="i-lucide-plus" variant="soft" @click="addItem" />
                        </div>
                    </div>
                </UPageCard>
            </div>

            <!-- Right Column: Widget Metadata (Read-only) -->
            <div class="w-full lg:w-80 space-y-6">
                <UPageCard title="Widget Information" variant="soft" class="bg-white rounded-lg">
                    <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Widget Name</label>
                            <input :value="widgetName" type="text" disabled
                                class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500" />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Widget
                                Zone</label>
                            <input v-model="widgetZone" type="text" disabled
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400" />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                            <input :value="displayOrder" type="number" disabled
                                class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500" />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Publish Start</label>
                            <input :value="formatDate(publishStart)" type="text" disabled
                                class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500" />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Publish End</label>
                            <input :value="formatDate(publishEnd)" type="text" disabled
                                class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500" />
                        </div>
                    </div>
                </UPageCard>
            </div>
        </form>
    </div>
</template>
