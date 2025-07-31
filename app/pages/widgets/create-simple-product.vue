<script setup lang="ts">
// Trang tạo mới Simple Product Widget
</script>
<template>
  <UDashboardPanel class="flex flex-col h-full">
    <template #header>
      <UDashboardNavbar title="Tạo mới Simple Product Widget">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="p-8 text-center text-lg text-gray-500">
        Đây là giao diện tạo mới <span class="font-bold">Simple Product Widget</span>.
      </div>
    </template>
  </UDashboardPanel>
</template>
