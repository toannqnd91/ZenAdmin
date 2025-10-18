<script setup lang="ts">
</script>

<template>
  <div class="space-y-4">
    <!-- Tổng quan về tài khoản -->
    <UPageCard title="Tổng quan về tài khoản" variant="soft" class="bg-white rounded-lg">
      <template #header-actions>
        <UButton
          color="primary"
          variant="link"
          label="Xem chi tiết gói"
          class="text-sm"
        />
      </template>
      <div class="-mx-6 px-6 pt-1 border-t-1 border-gray-200 dark:border-gray-700">
        <!-- Nội dung tổng quan có thể bổ sung sau -->
      </div>
    </UPageCard>

    <!-- Hóa đơn thanh toán -->
    <UPageCard title="Hóa đơn thanh toán" variant="soft" class="bg-white rounded-lg">
      <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
        <div class="text-gray-500">
          Website của bạn chưa có giao dịch nào
        </div>
      </div>
    </UPageCard>
  </div>
</template>
