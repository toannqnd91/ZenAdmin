<script setup lang="ts">
import type { Admission, ApiResponse } from '~/types'

const { user: userInfo } = useAuthService()
const userName = computed(() => userInfo.value?.display_name || 'bạn')

const heDaoTao = ref('Chính quy')
const heDaoTaoOptions = ['Chính quy', 'Từ xa']

const namTuyenSinh = ref('Năm tuyển sinh 2025')
const namTuyenSinhOptions = ['Năm tuyển sinh 2025']

const { isNotificationsSlideoverOpen } = useDashboard()

const { data: admissionsResponse } = await useApiFetch<ApiResponse>('https://dongtrunghathaophunhan.vn/api/v1/admissions', {
  default: () => ({ code: '', success: false, message: '', data: [] })
})


const q = ref('')

const filteredAdmissions = computed(() => {
  return admissionsResponse.value.data.filter((admission) => {
    return admission.title.search(new RegExp(q.value, 'i')) !== -1 || admission.code.search(new RegExp(q.value, 'i')) !== -1
  })
})

</script>

<template>
  <UDashboardPanel id="home">
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

      <UDashboardToolbar>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <USelect
            v-model="heDaoTao"
            :items="heDaoTaoOptions"
            class="w-50"
            placeholder="Chọn hệ"
          />
          <USelect
            v-model="namTuyenSinh"
            :items="namTuyenSinhOptions"
            class="w-50"
            placeholder="Năm tuyển sinh"
          />
        </div>
      </UDashboardToolbar>
    </template>

    <template #body>
      <p>
        Xin chào <b>{{ userName }}</b>,<br>
        Bạn đang tham gia hệ thống xét tuyển trực tuyến đại học chính quy của Trường Đại học Thái Bình.<br>
        Vui lòng chọn một đợt để tiếp tục:
      </p>

      <AdmissionsList :admissions="filteredAdmissions" />

    </template>
  </UDashboardPanel>
</template>
