<script setup lang="ts">
import { useAppTitle } from '@/composables/useAppSettings'

definePageMeta({ layout: 'default' })
const appTitle = useAppTitle()
useHead({ title: `Thêm danh mục sản phẩm - ${appTitle}` })
</script>

<template>
  <ProductsCategoriesForm />
</template>
