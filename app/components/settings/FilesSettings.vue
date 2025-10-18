<script setup lang="ts">
const onUpload = () => {
  // Placeholder action for upload
}
</script>

<template>
  <div class="space-y-4">
    <UPageCard title="Tệp" variant="soft" class="bg-white rounded-lg">
      <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700">
        <div class="py-20">
          <div class="mx-auto max-w-md text-center">
            <div class="mx-auto mb-4 h-40 w-40 text-gray-300">
              <UIcon name="i-lucide-folder-down" class="h-full w-full" />
            </div>
            <div class="text-xl font-semibold mb-1">
              Cửa hàng của bạn chưa có file nào
            </div>
            <div class="text-gray-600 mb-4">
              Bạn có thể tải ảnh, tài liệu lên website và quản lý tại đây
            </div>
            <div class="flex justify-center">
              <UButton
                icon="i-lucide-upload"
                color="primary"
                variant="solid"
                label="Tải file"
                @click="onUpload"
              />
            </div>
          </div>
        </div>
      </div>
    </UPageCard>
    <div class="text-center text-sm text-gray-600">
      Tìm hiểu thêm về
      <NuxtLink to="#" class="text-primary-600">quản lý file</NuxtLink>
    </div>
  </div>
</template>
