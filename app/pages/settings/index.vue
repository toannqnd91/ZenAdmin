<script setup lang="ts">
import { useRoute } from '#imports'
import GeneralSettings from '@/components/settings/GeneralSettings.vue'
import NotificationsSettings from '@/components/settings/NotificationsSettings.vue'

const route = useRoute()
const currentTab = computed(() => String(route.query.tab || 'general'))
</script>

<template>
  <!-- This page is rendered inside the right-hand content area defined in pages/settings.vue -->
  <div>
    <!-- <h1 class="text-xl font-semibold mb-3">
      {{ currentTab === 'general' ? 'Cấu hình chung' : currentTab === 'notifications' ? 'Thông báo' : 'Cài đặt' }}
    </h1> -->
    <div v-if="currentTab === 'general'">
      <GeneralSettings />
    </div>
    <div v-else-if="currentTab === 'notifications'">
      <NotificationsSettings />
    </div>
    <div v-else>
      <UCard>
        <div class="text-sm text-gray-600">
          Đang phát triển mục này ({{ currentTab }})...
        </div>
      </UCard>
    </div>
  </div>
</template>
