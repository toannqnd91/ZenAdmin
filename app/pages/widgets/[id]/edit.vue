<script setup lang="ts">
const route = useRoute()
const id = route.params.id
</script>

<template>
  <UDashboardPanel class="flex flex-col h-full">
    <template #header>
      <UDashboardNavbar :title="`Chỉnh sửa Widget #${id}`">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="p-8 text-center text-lg text-gray-500">
        Trang chỉnh sửa widget <span class="font-bold">#{{ id }}</span>
      </div>
    </template>
  </UDashboardPanel>
</template>
