<script setup lang="ts">
// import ProductForm from '@/components/products/ProductForm.vue'

definePageMeta({ layout: 'default' })
const route = useRoute()
const productId = Number(route.params.id)
useHead({ title: 'Cập nhật sản phẩm' })
</script>

<template>
  <ProductsForm :product-id="productId" />
</template>
