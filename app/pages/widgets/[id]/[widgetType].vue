<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const EditCarouselWidget = defineAsyncComponent(() => import('@/components/widgets/EditCarouselWidget.vue'))
const EditCategoryWidget = defineAsyncComponent(() => import('@/components/widgets/EditCategoryWidget.vue'))
const EditHtmlWidget = defineAsyncComponent(() => import('@/components/widgets/EditHtmlWidget.vue'))
const EditCustomDataWidget = defineAsyncComponent(() => import('@/components/widgets/EditCustomDataWidget.vue'))
const EditSimpleNewsWidget = defineAsyncComponent(() => import('@/components/widgets/EditSimpleNewsWidget.vue'))
const EditNewsWidget = defineAsyncComponent(() => import('@/components/widgets/EditNewsWidget.vue'))
const EditFeatureSectionWidget = defineAsyncComponent(() => import('@/components/widgets/EditFeatureSectionWidget.vue'))

const route = useRoute()
const router = useRouter()

// Get parameters from URL
const widgetId = route.params.id as string
const widgetType = route.params.widgetType as string

// Validate widget type
const validWidgetTypes = [
  'carousel-widget',
  'category-widget',
  'html-widget',
  'product-widget',
  'news-widget',
  'recently-viewed-widget',
  'simple-product-widget',
  'simple-news-widget',
  'spacebar-widget',
  'custom-data-widget',
  'feature-section-widget',
  'feature-section-widget-widget' // Handle duplicate suffix from database
]

if (!validWidgetTypes.includes(widgetType.toLowerCase())) {
  throw createError({
    statusCode: 404,
    statusMessage: `Unknown widget type: ${widgetType}`
  })
}
</script>

<template>
  <UDashboardPanel class="flex flex-col h-full w-full">
    <template #header>
      <UDashboardNavbar title="Widget Translation">
        <template #leading>
          <UButton icon="i-lucide-arrow-left" variant="ghost" color="neutral" @click="router.push('/widgets')" />
        </template>
        <template #right>
          <div id="navbar-actions" class="flex items-center gap-2"></div>
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <component :is="widgetType === 'carousel-widget' ? EditCarouselWidget
        : widgetType === 'category-widget' ? EditCategoryWidget
          : widgetType === 'html-widget' ? EditHtmlWidget
            : widgetType === 'custom-data-widget' ? EditCustomDataWidget
              : widgetType === 'simple-news-widget' ? EditSimpleNewsWidget
                : widgetType === 'news-widget' ? EditNewsWidget
                  : widgetType === 'feature-section-widget' || widgetType === 'feature-section-widget-widget' ? EditFeatureSectionWidget
                    : null
        "
        v-if="['carousel-widget', 'category-widget', 'html-widget', 'custom-data-widget', 'simple-news-widget', 'news-widget', 'feature-section-widget', 'feature-section-widget-widget'].includes(widgetType)" />
      <div v-else class="w-full mt-6">
        <UCard class="w-full">
          <div class="text-center py-8">
            <UIcon name="i-lucide-settings" class="text-4xl text-primary mb-4" />
            <h2 class="text-xl font-semibold mb-2">
              Edit {{widgetType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}}
            </h2>
            <p class="text-gray-600 mb-4">
              Widget ID: {{ widgetId }}
            </p>
            <p class="text-sm text-gray-500">
              {{ widgetType }} edit form will be implemented here
            </p>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
