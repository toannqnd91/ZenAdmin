<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Cập nhật danh mục sản phẩm' })

const route = useRoute()
const categoryId = computed(() => Number(route.params.id))
</script>

<template>
  <ProductsCategoriesForm mode="update" :category-id="categoryId" />
</template>
