<script setup lang="ts">
import { ref } from 'vue'
import { useFileUpload } from '@/composables/useFileUpload'

defineProps<{ endpoint?: string, multiple?: boolean }>()
const emit = defineEmits<{ (e: 'uploaded', files: any): void }>()

const files = ref<File[]>([])
const { upload } = useFileUpload()
const loading = ref(false)

function handleChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files) {
    files.value = Array.from(target.files)
  }
}

async function handleUpload() {
  if (!files.value.length) return
  loading.value = true
  const { data, error } = await upload(files.value)
  loading.value = false
  if (!error.value) {
    emit('uploaded', data.value)
  }
}
</script>

<template>
  <div class="space-y-2">
    <input type="file" :multiple="multiple" @change="handleChange">
    <UButton
      :loading="loading"
      label="Upload"
      color="primary"
      @click="handleUpload"
    />
  </div>
</template>
