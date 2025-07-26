<script setup lang="ts">
import { useRoute } from 'vue-router'
import type { Admission, ApiResponse } from '~/types'
import type { BreadcrumbItem } from '@nuxt/ui'

const { isNotificationsSlideoverOpen } = useDashboard()

const route = useRoute()
const id = route.params.id

const { data: admissionRes, pending } = await useApiFetch<ApiResponse>(`https://dongtrunghathaophunhan.vn/api/v1/admission/${id}`)
const admission = computed<Admission | null>(() => admissionRes.value?.data ?? null)

const items = ref<BreadcrumbItem[]>([
  {
    label: 'Trang chủ',
    icon: 'i-lucide-house'
  },
  {
    label: 'Đăng ký xét tuyển',
    icon: 'i-lucide-file-text',
    to: '/dang-ky-xet-tuyen'
  }, {
    label: admission.value?.title || 'Chi tiết đợt tuyển sinh',
    icon: 'i-lucide-list-checks',
    to: `/dang-ky-xet-tuyen/${id}`
  }
])

// Log response to console
// watch(admissionRes, (val) => {
//   console.log('Admission API response:', val) 
// }, { immediate: true })

// watch(admission, (val) => {
//   console.log('Admission:', val)
// }, { immediate: true })

</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Đăng ký xét tuyển">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UColorModeButton />

          <UTooltip text="Notifications" :shortcuts="['N']">
            <UButton
              color="neutral"
              variant="ghost"
              square
              @click="isNotificationsSlideoverOpen = true"
            >
              <UChip color="error" inset>
                <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
              </UChip>
            </UButton>
          </UTooltip>
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UBreadcrumb :items="items" class="mb-4" />
      <div v-if="pending">Đang tải...</div>
      <div v-else-if="admission">
        <h2 class="text-xl font-bold mb-2">{{ admission.title }}</h2>
        <div class="mb-2 text-muted">Mã: {{ admission.code }}</div>
        <div class="mb-2">Ngày kết thúc: {{ admission.endDate }}</div>
        <div class="mb-2">Ngày công bố kết quả: {{ admission.resultAnnouncement }}</div>
        <div class="mt-4 prose" v-if="admission.description" v-html="admission.description"></div>      
      </div>
      <div v-else>
        Không tìm thấy thông tin đợt tuyển sinh.
      </div>

      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="flex items-center gap-1.5">
          <UButton
            color="gray"
            label="Quay lại"
            icon="i-lucide-arrow-left"
            @click="$router.back()"
            class="w-auto"
          />
        </div>
        <div class="flex items-center gap-1.5">
          <UButton
            color="primary"
            label="Tiếp theo"
            class="w-auto"
            @click="$router.push(`/dang-ky-xet-tuyen/${id}/dang-ky`)"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>