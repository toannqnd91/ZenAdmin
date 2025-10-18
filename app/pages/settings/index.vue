<script setup lang="ts">
import { useRoute } from '#imports'
import GeneralSettings from '@/components/settings/GeneralSettings.vue'
import NotificationsSettings from '@/components/settings/NotificationsSettings.vue'
import EmployeesSettings from '@/components/settings/EmployeesSettings.vue'
import BranchesSettings from '@/components/settings/BranchesSettings.vue'
import OrderProcessingSettings from '@/components/settings/OrderProcessingSettings.vue'
import PaymentsSettings from '@/components/settings/PaymentsSettings.vue'
import CheckoutSettings from '@/components/settings/CheckoutSettings.vue'
import TaxesSettings from '@/components/settings/TaxesSettings.vue'
import ShippingPartnersSettings from '@/components/settings/ShippingPartnersSettings.vue'
import ShippingSettings from '@/components/settings/ShippingSettings.vue'
import ChannelsSettings from '@/components/settings/ChannelsSettings.vue'
import FilesSettings from '@/components/settings/FilesSettings.vue'
import PrintTemplatesSettings from '@/components/settings/PrintTemplatesSettings.vue'
import PlansSettings from '@/components/settings/PlansSettings.vue'
import AuditLogSettings from '@/components/settings/AuditLogSettings.vue'
import AIFeaturesSettings from '@/components/settings/AIFeaturesSettings.vue'
import MetafieldsSettings from '@/components/settings/MetafieldsSettings.vue'

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
