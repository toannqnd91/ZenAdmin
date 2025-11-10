<script setup lang="ts">
import { useRouter } from 'vue-router'

definePageMeta({ layout: 'default' })
useHead({ title: 'Thêm danh mục sản phẩm' })

const router = useRouter()
function goBack() {
  if (history.length > 1) router.back()
  else router.push('/products-categories')
}
</script>

<template>
  <ProductsCategoriesForm />
</template>
