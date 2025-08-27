<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Chỉnh sửa tin tức - Cơ Khí Tam Long' })
const route = useRoute()
const newsId = parseInt(route.params.id as string)
</script>

<template>
  <NewsForm :news-id="newsId" />
</template>
