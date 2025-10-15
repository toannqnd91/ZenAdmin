<script setup lang="ts">
import { useRoute } from '#imports'
import GeneralSettings from '@/components/settings/GeneralSettings.vue'

const route = useRoute()
const currentTab = computed(() => String(route.query.tab || 'general'))
</script>

<template>
  <!-- This page is rendered inside the right-hand content area defined in pages/settings.vue -->
  <div>
    <h1 class="text-2xl font-semibold mb-6">
      {{ currentTab === 'general' ? 'Cấu hình chung' : 'Cài đặt' }}
    </h1>
    <div v-if="currentTab === 'general'">
      <GeneralSettings />
    </div>
    <div v-else>
      <UCard>
        <div class="text-sm text-gray-600">Đang phát triển mục này ({{ currentTab }})...</div>
      </UCard>
    </div>
  </div>
</template>
