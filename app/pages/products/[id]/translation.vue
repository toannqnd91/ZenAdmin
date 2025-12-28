<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { localizationService } from '~/services/localization.service'
import { productService } from '~/services/product.service'

const router = useRouter()
const route = useRoute()
const config = useRuntimeConfig()

definePageMeta({
    validate: async (route) => {
        // Check if id is a number
        return /^\d+$/.test(route.params.id as string)
    }
})

const productId = parseInt(route.params.id as string)
const entityType = 'ProductDTO'

// Product metadata (read-only)
const productName = ref('')
const productShortDescription = ref('')
const productDescription = ref('')
const productThumbnailImageUrl = ref('')
const productCreatedOn = ref('')

// Translation data
const vnData = ref({
    name: '',
    shortDescription: '',
    description: ''
})

const enData = ref({
    name: '',
    shortDescription: '',
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
    console.log('=== loadData() called ===')
    console.log('Product ID:', productId)
    console.log('Entity Type:', entityType)

    try {
        isLoading.value = true

        // Fetch product data and translation in parallel with timeout
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out')), 10000)
        )

        const [productResponse, translationResponse] = await Promise.race([
            Promise.all([
                productService.getProductById(productId).catch(err => {
                    console.error('Product Service error:', err)
                    return { success: false, data: null, message: err.message }
                }),
                localizationService.getTranslation(entityType, productId, 'en-US').catch(() => ({ success: false, data: null }))
            ]),
            timeoutPromise
        ]) as any

        console.log('=== GET Product Response ===')
        console.log('Product Response:', productResponse)
        console.log('Product Response Type:', typeof productResponse)

        // Load product metadata
        if (productResponse && productResponse.success && productResponse.data) {
            const product = productResponse.data
            productName.value = product.name || ''
            productShortDescription.value = product.shortDescription || ''
            productDescription.value = product.description || ''
            productThumbnailImageUrl.value = product.thumbnailImageUrl || ''
            productCreatedOn.value = product.createdOn || ''

            // Set VN data
            vnData.value = {
                name: product.name || '',
                shortDescription: product.shortDescription || '',
                description: product.description || ''
            }

            // Initialize empty EN data
            enData.value = {
                name: '',
                shortDescription: '',
                description: ''
            }
        } else if (productResponse && !productResponse.success) {
            console.error('Product API returned error:', productResponse)
            alert('Không thể tải dữ liệu sản phẩm: ' + (productResponse.message || 'Unknown error'))
            router.push('/products')
            return
        } else {
            console.error('Failed to load product data - null response')
            alert('Không thể tải dữ liệu sản phẩm')
            router.push('/products')
            return
        }

        console.log('=== GET Translation Response ===')
        console.log('Translation Response:', translationResponse)

        // Load existing English translation if available
        if (translationResponse?.success && translationResponse.data) {
            try {
                const translationData = translationResponse.data

                enData.value = {
                    name: translationData.Name || translationData.name || '',
                    shortDescription: translationData.ShortDescription || translationData.shortDescription || '',
                    description: translationData.Description || translationData.description || ''
                }

                console.log('Loaded EN Data from translation:', enData.value)
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
    console.log('=== onMounted() called ===')
    isMounted.value = true
    await loadData()
})

// Submit translation
async function handleSubmit() {
    try {
        isSubmitting.value = true

        const payload: Record<string, string> = {
            Name: enData.value.name,
            ShortDescription: enData.value.shortDescription,
            Description: enData.value.description
        }

        console.log('=== POST Translation Request ===')
        console.log('Entity Type:', entityType)
        console.log('Product ID:', productId)
        console.log('Culture:', 'en-US')
        console.log('Payload:', payload)

        const result = await localizationService.updateTranslation(
            entityType,
            productId,
            'en-US',
            payload as any
        )

        console.log('=== POST Translation Response ===')
        console.log('Result:', result)

        if (result.success) {
            console.log('Translation saved successfully')
            router.push('/products')
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
    router.push('/products')
}
</script>

<template>
    <UDashboardPanel>
        <template #header>
            <UDashboardNavbar title="Product Translation">
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

                                <!-- Short Description -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Short Description (EN)
                                        <span class="text-xs text-gray-500 ml-2">(VN: {{ vnData.shortDescription
                                        }})</span>
                                    </label>
                                    <textarea v-model="enData.shortDescription" rows="4"
                                        placeholder="Enter English short description"
                                        class="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"></textarea>
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

                    <!-- Right Column: Product Metadata (Read-only) -->
                    <div class="w-full lg:w-80 space-y-6">
                        <UPageCard title="Product Information" variant="soft" class="bg-white rounded-lg">
                            <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name
                                        (VN)</label>
                                    <input :value="productName" type="text" disabled
                                        class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400" />
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Short
                                        Description
                                        (VN)</label>
                                    <textarea :value="productShortDescription" rows="4" disabled
                                        class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400"></textarea>
                                </div>

                                <div>
                                    <label
                                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description
                                        (VN)</label>
                                    <textarea :value="productDescription" rows="6" disabled
                                        class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400"></textarea>
                                </div>

                                <div>
                                    <label
                                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Created
                                        Date</label>
                                    <input :value="formatDate(productCreatedOn)" type="text" disabled
                                        class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400" />
                                </div>

                                <div v-if="productThumbnailImageUrl">
                                    <label
                                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Image</label>
                                    <img :src="productThumbnailImageUrl" alt="Product image"
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
