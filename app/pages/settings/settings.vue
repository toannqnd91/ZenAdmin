<script setup lang="ts">
import SettingsSidebar from '@/components/SettingsSidebar.vue'
</script>

<template>
  <UDashboardPanel id="settings" :ui="{ body: '' }">
    <template #header>
      <UDashboardNavbar title="Cài đặt">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div>
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
      </div>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
.settings-scroll {
  overflow: auto scroll;
  scrollbar-width: thin;
  position: relative;
  height: calc(100% - 52px);
}
</style>
