<script setup lang="ts">
import type { Scholarship, ApiResponse } from '~/types'
import ScholarshipsList from '~/components/ScholarshipsList.vue'

const { isNotificationsSlideoverOpen } = useDashboard()

const { data: scholarshipsResponse } = await useApiFetch<ApiResponse>('https://demo.cokhitamlong.vn/api/v1/scholarships', {
  default: () => ({ code: '', success: false, message: '', data: [] })
})

const selectedScholarshipId = ref<number | null>(null)
const selectedCriteria = ref<number[]>([])

const selectedScholarship = computed<Scholarship | undefined>(() =>
  scholarshipsResponse.value.data.find(s => s.id === selectedScholarshipId.value)
)

watch(selectedScholarshipId, () => {
  selectedCriteria.value = []
})

// Log response to console
// watch(scholarshipsResponse, (val) => {
//   console.log('Scholarships API response:', val)
// }, { immediate: true })

// watch(selectedScholarshipId, (val) => {
//   console.log('ID học bổng đã chọn:', val)
// })

// watch(selectedCriteria, (val) => {
//   console.log('ID các điều kiện đã chọn:', val)
// })

</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Đăng ký học bổng">
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
      <div class="flex flex-col gap-4">
        <h2 class="text-lg font-semibold">Chọn học bổng</h2>

        <!-- Sử dụng ScholarshipsList.vue -->
        <ScholarshipsList
          :scholarships="scholarshipsResponse.data || []"
          v-model="selectedScholarshipId"
        />

        <div v-if="(scholarshipsResponse.data || []).length === 0" class="text-gray-500">
          Không có học bổng nào.
        </div>

        <!-- Điều kiện tham gia học bổng -->
        <div v-if="selectedScholarship" class="gap-2">
          <!-- <div v-html="selectedScholarship.description" class="prose mb-2" /> -->
          <h2 class="text-lg font-semibold">Chọn điều kiện:</h2>

          <div class="mt-4 space-y-3">
            <UCheckbox
              v-for="criteria in selectedScholarship.criterias"
              :key="criteria.id"
              :model-value="selectedCriteria.includes(criteria.id)"
              @update:model-value="checked => {
                if (checked) {
                  selectedCriteria.push(criteria.id)
                } else {
                  selectedCriteria = selectedCriteria.filter(id => id !== criteria.id)
                }
              }"
              :label="criteria.description"
            />
            </div>
        </div>

        <!-- Nút tải lên -->
        <div v-if="selectedScholarshipId" class="gap-2">
          <h2 class="text-lg font-semibold">Minh chứng:</h2>
          <div class="mt-4">
            <UButton
              color="primary"
              label="Tải lên"
              icon="i-lucide-upload"
              class="w-auto"
              @click="() => {
                console.log('Đăng ký học bổng:', selectedScholarshipId.value)
                console.log('Điều kiện đã chọn:', selectedCriteria.value)
              }"
            />
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="text-sm text-muted">
          Đã chọn học bổng: <span class="font-semibold">{{ selectedScholarship?.name || 'Chưa chọn' }}</span>
        </div>

        <div class="flex items-center gap-1.5">
          <!-- Lưu lại đã chọn -->
          <UButton
            color="primary"
            label="Gửi hồ sơ"
            :disabled="!selectedScholarshipId || selectedCriteria.length === 0"
            @click="() => {
              console.log('Đăng ký học bổng:', selectedScholarshipId.value)
              console.log('Điều kiện đã chọn:', selectedCriteria.value)
            }"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>