<script setup lang="ts">
import BrandCreateForm from '@/components/brands/BrandCreateForm.vue'
import { useAppTitle } from '@/composables/useAppSettings'

definePageMeta({ layout: 'default' })
const appTitle = useAppTitle()
useHead({ title: `Thêm thương hiệu mới - ${appTitle}` })
</script>

<template>
  <UDashboardPanel id="brand-create">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <div class="flex items-center gap-3">
            <NuxtLink
              to="/brands"
              class="h-8 w-8 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >
              <UIcon name="i-lucide-chevron-left" class="size-5" />
            </NuxtLink>
            <div>
              <div class="flex items-center gap-3">
                <span class="text-lg font-semibold">Thêm thương hiệu mới</span>
              </div>
              <div class="text-xs text-gray-500">
                Điền thông tin cơ bản và lưu để tạo.
              </div>
            </div>
          </div>
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="w-full max-w-screen-md mx-auto px-6 pb-10">
        <UPageCard variant="soft" class="bg-white rounded-lg">
          <BrandCreateForm />
        </UPageCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
