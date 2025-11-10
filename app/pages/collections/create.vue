<script setup lang="ts">
useHead({ title: 'Thêm bộ sưu tập mới' })
definePageMeta({ layout: 'default' })
const router = useRouter()
function goBack() {
  router.push('/collections')
}
</script>

<template>
  <div class="p-6">
    <div class="flex items-center mb-6">
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 h-9 w-9 mr-4"
        @click="goBack"
      >
        <UIcon name="i-lucide-chevron-left" class="size-5" />
      </button>
      <h1 class="text-xl font-semibold text-gray-800">
        Thêm bộ sưu tập mới
      </h1>
    </div>
    <CollectionCreateForm />
  </div>
</template>
