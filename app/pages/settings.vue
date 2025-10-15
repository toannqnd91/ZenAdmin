<script setup lang="ts">
import SettingsSidebar from '@/components/SettingsSidebar.vue'
</script>

<template>
  <UDashboardPanel
    id="settings"
    :ui="{ root: 'min-h-[100dvh] flex flex-col', body: 'settings-scroll flex-1' }"
  >
    <template #header>
      <UDashboardNavbar title="Cài đặt">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full max-w-screen-xl mx-auto px-6 py-6">
        <div class="grid grid-cols-12 gap-4">
          <!-- Vertical sidebar navigation -->
          <aside class="col-span-12 md:col-span-3">
            <SettingsSidebar />
          </aside>
          <!-- Main content area -->
          <section class="col-span-12 md:col-span-9 flex flex-col gap-4">
            <NuxtPage />
          </section>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
.settings-scroll {
  overflow-y: scroll; /* always show scrollbar */
  scrollbar-width: thin;
  height: 100%;
  min-height: 0;
}
</style>
