<script setup lang="ts">
import { useAppTitle } from '@/composables/useAppSettings'

definePageMeta({ layout: 'default' })
const appTitle = useAppTitle()
useHead({ title: `Chỉnh sửa tin tức - ${appTitle}` })
const route = useRoute()
const newsId = parseInt(route.params.id as string)
</script>

<template>
  <NewsForm :news-id="newsId" />
</template>
