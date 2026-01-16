<script setup lang="ts">
import EditCarouselWidget from '@/components/widgets/EditCarouselWidget.vue'
import EditCategoryWidget from '@/components/widgets/EditCategoryWidget.vue'
import EditHtmlWidget from '@/components/widgets/EditHtmlWidget.vue'
import EditCustomDataWidget from '@/components/widgets/EditCustomDataWidget.vue'
import EditSimpleNewsWidget from '@/components/widgets/EditSimpleNewsWidget.vue'
import EditSimpleProductWidget from '@/components/widgets/EditSimpleProductWidget.vue'
import EditNewsWidget from '@/components/widgets/EditNewsWidget.vue'
import EditFeatureSectionWidget from '@/components/widgets/EditFeatureSectionWidget.vue'

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
      <UDashboardNavbar
        :title="`Edit ${widgetType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`">
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
                : widgetType === 'simple-product-widget' ? EditSimpleProductWidget
                  : widgetType === 'news-widget' ? EditNewsWidget
                    : widgetType === 'feature-section-widget' || widgetType === 'feature-section-widget-widget' ? EditFeatureSectionWidget
                      : null
        "
        v-if="['carousel-widget', 'category-widget', 'html-widget', 'custom-data-widget', 'simple-news-widget', 'simple-product-widget', 'news-widget', 'feature-section-widget', 'feature-section-widget-widget'].includes(widgetType)" />
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
