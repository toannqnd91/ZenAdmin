<template>
  <div class="flex items-center justify-between border-gray-200 rounded-t-md">
    <div class="text-base font-semibold text-gray-900">
      <slot />
    </div>
    <slot name="actions" />
  </div>
</template>

<script setup lang="ts">
// BaseCardHeader: Dùng slot mặc định cho tiêu đề, slot actions cho nút/phụ kiện bên phải
</script>

<style scoped>
/* Có thể thêm style tùy chỉnh nếu cần */
</style>
