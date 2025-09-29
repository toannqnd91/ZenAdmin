<script setup lang="ts">
definePageMeta({ layout: 'default' })
import { useAppTitle } from '@/composables/useAppSettings'
const appTitle = useAppTitle()
useHead({ title: `Thêm tin tức mới - ${appTitle}` })
</script>

<template>
  <NewsForm />
</template>
