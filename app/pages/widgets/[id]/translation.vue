<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { widgetsService } from '~/services/widgets.service'
import TranslateFeatureSectionWidget from '~/components/widgets/TranslateFeatureSectionWidget.vue'
import TranslateCarouselWidget from '~/components/widgets/TranslateCarouselWidget.vue'
import TranslateCustomDataWidget from '~/components/widgets/TranslateCustomDataWidget.vue'

const router = useRouter()
const route = useRoute()

const widgetId = parseInt(route.params.id as string)
const isLoading = ref(true)
const widgetType = ref('')

onMounted(async () => {
    await loadWidgetType()
})

async function loadWidgetType() {
    isLoading.value = true
    try {
        const response = await widgetsService.getWidgetInstance(widgetId)
        if (response && response.success && response.data) {
            widgetType.value = response.data.widgetType || ''
        }
    } catch (error) {
        console.error('Error loading widget type:', error)
        alert('Failed to load widget')
        router.push('/widgets')
    } finally {
        isLoading.value = false
    }
}

// Determine which translation component to render
const translationComponent = computed(() => {
    const type = widgetType.value.toLowerCase()

    if (type.includes('feature') || type.includes('featuresection')) {
        return TranslateFeatureSectionWidget
    }

    if (type.includes('carousel')) {
        return TranslateCarouselWidget
    }

    if (type.includes('customdata')) {
        return TranslateCustomDataWidget
    }

    // Add more widget types here
    // if (type.includes('html')) return TranslateHtmlWidget

    return null
})
</script>

<template>
    <UDashboardPanel id="widget-translation">
        <template #header>
            <UDashboardNavbar title="Widget Translation">
                <template #leading>
                    <UButton icon="i-lucide-arrow-left" variant="ghost" color="neutral"
                        @click="router.push('/widgets')" />
                </template>
                <template #right>
                    <div id="navbar-actions" class="flex items-center gap-2"></div>
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div v-if="isLoading" class="flex items-center justify-center h-full">
                <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl text-primary mb-2" />
                <p class="text-sm text-gray-600 dark:text-gray-400 ml-3">Loading...</p>
            </div>

            <div v-else-if="!translationComponent" class="flex items-center justify-center h-full">
                <div class="text-center">
                    <UIcon name="i-lucide-alert-circle" class="text-4xl text-gray-400 mb-4" />
                    <p class="text-lg text-gray-600 dark:text-gray-400 mb-2">Translation not supported</p>
                    <p class="text-sm text-gray-500 dark:text-gray-500 mb-4">
                        Translation is not yet available for widget type: {{ widgetType }}
                    </p>
                    <UButton label="Back to Widgets" @click="router.push('/widgets')" />
                </div>
            </div>

            <component v-else :is="translationComponent" />
        </template>
    </UDashboardPanel>
</template>
