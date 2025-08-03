<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const widgetId = route.params.id as string
const widgetType = route.params.widgetType as string

const customData = ref('')
const isSubmitting = ref(false)

function onUpdate() {
  isSubmitting.value = true
  // TODO: Gọi API cập nhật custom data widget
  setTimeout(() => {
    isSubmitting.value = false
    alert('Custom Data Widget updated!')
    router.push('/widgets')
  }, 1000)
}

function onCancel() {
  router.back()
}
</script>

<template>
  <div class="p-6 w-full">
    <form class="space-y-6" @submit.prevent="onUpdate">
      <div class="text-3xl font-light mb-8">
        Edit Custom Data Widget
      </div>
      <div class="grid grid-cols-12 gap-4 items-center mb-2">
        <label class="col-span-2 text-right pr-2">Widget ID</label>
        <div class="col-span-10 w-full">
          <UInput :value="widgetId" disabled class="w-full" />
        </div>
      </div>
      <div class="grid grid-cols-12 gap-4 items-center mb-2">
        <label class="col-span-2 text-right pr-2">Custom Data</label>
        <div class="col-span-10 w-full">
          <UTextarea v-model="customData" placeholder="Enter custom data..." class="w-full" rows="6" />
        </div>
      </div>
      <div class="flex gap-2 mt-4">
        <UButton
          icon="i-lucide-save"
          color="primary"
          type="submit"
          :loading="isSubmitting"
        >
          Update
        </UButton>
        <UButton color="neutral" variant="soft" @click="onCancel">
          Cancel
        </UButton>
      </div>
    </form>
  </div>
</template>
