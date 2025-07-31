<script setup lang="ts">
// Trang tạo mới Category Widget
</script>
<template>
  <UDashboardPanel class="flex flex-col h-full">
    <template #header>
      <UDashboardNavbar title="Tạo mới Category Widget">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="p-8 text-center text-lg text-gray-500">
        Đây là giao diện tạo mới <span class="font-bold">Category Widget</span>.
      </div>
    </template>
  </UDashboardPanel>
</template>
