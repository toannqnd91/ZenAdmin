<script setup lang="ts">
import { useAppTitle } from '@/composables/useAppSettings'

definePageMeta({ layout: 'default' })
const appTitle = useAppTitle()
useHead({ title: `Thêm tin tức mới - ${appTitle}` })
</script>

<template>
  <NewsForm />
</template>
