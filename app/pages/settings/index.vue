<script setup lang="ts">
import { useRoute } from '#imports'
import { defineAsyncComponent } from 'vue'

const GeneralSettings = defineAsyncComponent(() => import('@/components/settings/GeneralSettings.vue'))
const NotificationsSettings = defineAsyncComponent(() => import('@/components/settings/NotificationsSettings.vue'))
const EmployeesSettings = defineAsyncComponent(() => import('@/components/settings/EmployeesSettings.vue'))
const BranchesSettings = defineAsyncComponent(() => import('@/components/settings/BranchesSettings.vue'))
const OrderProcessingSettings = defineAsyncComponent(() => import('@/components/settings/OrderProcessingSettings.vue'))
const PaymentsSettings = defineAsyncComponent(() => import('@/components/settings/PaymentsSettings.vue'))
const CheckoutSettings = defineAsyncComponent(() => import('@/components/settings/CheckoutSettings.vue'))
const TaxesSettings = defineAsyncComponent(() => import('@/components/settings/TaxesSettings.vue'))
const ShippingPartnersSettings = defineAsyncComponent(() => import('@/components/settings/ShippingPartnersSettings.vue'))
const ShippingSettings = defineAsyncComponent(() => import('@/components/settings/ShippingSettings.vue'))
const ChannelsSettings = defineAsyncComponent(() => import('@/components/settings/ChannelsSettings.vue'))
const FilesSettings = defineAsyncComponent(() => import('@/components/settings/FilesSettings.vue'))
const PrintTemplatesSettings = defineAsyncComponent(() => import('@/components/settings/PrintTemplatesSettings.vue'))
const PlansSettings = defineAsyncComponent(() => import('@/components/settings/PlansSettings.vue'))
const AuditLogSettings = defineAsyncComponent(() => import('@/components/settings/AuditLogSettings.vue'))
const AIFeaturesSettings = defineAsyncComponent(() => import('@/components/settings/AIFeaturesSettings.vue'))
const MetafieldsSettings = defineAsyncComponent(() => import('@/components/settings/MetafieldsSettings.vue'))

const route = useRoute()
const currentTab = computed(() => String(route.query.tab || 'general'))
</script>

<template>
  <!-- This page is rendered inside the right-hand content area defined in pages/settings.vue -->
  <div>
    <!-- <h1 class="text-xl font-semibold mb-3">
      {{ currentTab === 'general' ? 'Cấu hình chung' : currentTab === 'notifications' ? 'Thông báo' : 'Cài đặt' }}
    </h1> -->
    <div v-if="currentTab === 'general'">
      <GeneralSettings />
    </div>
    <div v-else-if="currentTab === 'notifications'">
      <NotificationsSettings />
    </div>
    <div v-else-if="currentTab === 'members'">
      <EmployeesSettings />
    </div>
    <div v-else-if="currentTab === 'branches'">
      <BranchesSettings />
    </div>
    <div v-else-if="currentTab === 'payments'">
      <PaymentsSettings />
    </div>
    <div v-else-if="currentTab === 'checkout'">
      <CheckoutSettings />
    </div>
    <div v-else-if="currentTab === 'taxes'">
      <TaxesSettings />
    </div>
    <div v-else-if="currentTab === 'shipping-partners'">
      <ShippingPartnersSettings />
    </div>
    <div v-else-if="currentTab === 'shipping'">
      <ShippingSettings />
    </div>
    <div v-else-if="currentTab === 'channels'">
      <ChannelsSettings />
    </div>
    <div v-else-if="currentTab === 'files'">
      <FilesSettings />
    </div>
    <div v-else-if="currentTab === 'print-templates'">
      <PrintTemplatesSettings />
    </div>
    <div v-else-if="currentTab === 'plans'">
      <PlansSettings />
    </div>
    <div v-else-if="currentTab === 'audit-log'">
      <AuditLogSettings />
    </div>
    <div v-else-if="currentTab === 'ai'">
      <AIFeaturesSettings />
    </div>
    <div v-else-if="currentTab === 'metafields'">
      <MetafieldsSettings />
    </div>
    <div v-else-if="currentTab === 'orders'">
      <OrderProcessingSettings />
    </div>
    <div v-else>
      <UCard>
        <div class="text-sm text-gray-600">
          Đang phát triển mục này ({{ currentTab }})...
        </div>
      </UCard>
    </div>
  </div>
</template>
