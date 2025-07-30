<script setup lang="ts">
definePageMeta({ layout: 'default' })
// News page logic will be added here
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Trang chủ">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <h2 class="text-lg font-semibold mb-4">Chào mừng đến với trang chủ</h2>
        <p>Đây là nơi bạn có thể quản lý tất cả các sản phẩm của mình.</p>
      </div>
    </template>
  </UDashboardPanel>
</template>