<script setup lang="ts">
import { ref } from 'vue'
import type { StepperItem } from '@nuxt/ui'

const { isNotificationsSlideoverOpen } = useDashboard()

const items = ref<StepperItem[]>([
  { title: 'Bước 1', description: 'Thông tin cá nhân', icon: 'i-lucide-user' },
  { title: 'Bước 2', description: 'Thông tin học tập', icon: 'i-lucide-book-open' },
  { title: 'Bước 3', description: 'Đăng ký nguyện vọng', icon: 'i-lucide-list-checks' },
  { title: 'Bước 4', description: 'Rà soát và nộp hồ sơ', icon: 'i-lucide-file-check' }
])

const currentStep = ref(0)

const handleNext = () => {
  if (currentStep.value < items.value.length - 1) {
    currentStep.value++
  } else {
    console.log('Gửi hồ sơ...')
  }
}

const handleBack = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

// Fetch student information from API
const { data: studentInfoResponse, pending } = await useApiFetch<{
  code: string
  success: boolean
  message: string
  data: {
    fullName: string
    gender: number
    dateOfBirth: string
    idNumber: string
    educationType: string
    major: string
    nationality: string
    ethnicity: string
    religion: string
    economicType: string
    graduationYearRange: string
    priorityObject: string
    priorityArea: string
    phoneNumber: string
    parentPhoneNumber: string
  }
}>('https://tbu-test.vnnsoft.com/api/v1/StudentInfo')

// Console log kết quả API
console.log('API Response:', studentInfoResponse.value)
console.log('Pending:', pending.value)

// Use API data or fallback to empty object
const responseData = computed(() => {
  const data = studentInfoResponse.value?.data || {}
  console.log('Response Data:', data)
  return data
})

// Định nghĩa mapping từ field sang label tiếng Việt
const fieldLabels = {
  fullName: "Họ và tên",
  dateOfBirth: "Ngày sinh", 
  idNumber: "CMND/CCCD",
  gender: "Giới tính",
  educationType: "Loại hình đào tạo",
  major: "Ngành",
  graduationYearRange: "Niên khóa",
  nationality: "Quốc tịch",
  ethnicity: "Dân tộc",
  religion: "Tôn giáo",
  priorityObject: "Đối tượng ưu tiên",
  priorityArea: "Khu vực ưu tiên",
  phoneNumber: "SĐT",
  parentPhoneNumber: "SĐT phụ huynh"
}

// Thứ tự hiển thị các trường
const fieldOrder = [
  'fullName', 'dateOfBirth', 'idNumber', 'gender',
  'educationType', 'major', 'graduationYearRange', 'nationality', 
  'ethnicity', 'religion', 'priorityObject', 'priorityArea',
  'phoneNumber', 'parentPhoneNumber'
]

// Format dữ liệu để hiển thị
const formatValue = (key: string, value: any) => {
  switch (key) {
    case 'gender':
      return value === 1 ? 'Nam' : 'Nữ'
    case 'dateOfBirth':
      return value ? new Date(value).toLocaleDateString('vi-VN') : ''
    default:
      return value || ''
  }
}

// Chia dữ liệu thành các hàng 2 cặp label-value
const personalInfoRows = computed(() => {
  const rows = []
  for (let i = 0; i < fieldOrder.length; i += 2) {
    const row = []
    
    // Item đầu tiên trong hàng
    const firstField = fieldOrder[i]
    row.push({
      label: fieldLabels[firstField],
      value: formatValue(firstField, responseData.value[firstField])
    })
    
    // Item thứ hai trong hàng (nếu có)
    if (fieldOrder[i + 1]) {
      const secondField = fieldOrder[i + 1]
      row.push({
        label: fieldLabels[secondField],
        value: formatValue(secondField, responseData.value[secondField])
      })
    }
    
    rows.push(row)
  }
  return rows
})
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
            <UButton color="neutral" variant="ghost" square @click="isNotificationsSlideoverOpen = true">
              <UChip color="error" inset>
                <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
              </UChip>
            </UButton>
          </UTooltip>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UStepper v-model="currentStep" :items="items" class="w-full mb-6" />

      <!-- Loading state -->
      <div v-if="pending" class="text-center py-8">
        <div class="text-muted">Đang tải thông tin...</div>
      </div>

      <!-- Nội dung bước 1 -->
      <div v-else-if="currentStep === 0" class="w-full max-w-5xl mx-auto">
        <div class="border border-gray-400 overflow-hidden">
          <div class="text-sm">
            <template v-for="(row, i) in personalInfoRows" :key="i">
              <div class="grid grid-cols-4 divide-x divide-gray-300">
                <template v-for="(item, j) in row" :key="j">
                  <div class="font-medium text-primary px-3 py-2 border-b border-gray-300">
                    {{ `${i * 2 + j + 1}. ${item.label}` }}
                  </div>
                  <div class="px-3 py-2 border-b border-gray-300">
                    {{ item.value }}
                  </div>
                </template>
                <!-- Nếu hàng cuối chỉ có 1 item, thêm 2 ô trống -->
                <template v-if="row.length === 1">
                  <div class="px-3 py-2 border-b border-gray-300"></div>
                  <div class="px-3 py-2 border-b border-gray-300"></div>
                </template>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Các bước còn lại (placeholder) -->
      <div v-if="currentStep === 1" class="text-center text-muted mt-8">Bước 2 - Thông tin học tập</div>
      <div v-if="currentStep === 2" class="text-center text-muted mt-8">Bước 3 - Nguyện vọng</div>
      <div v-if="currentStep === 3" class="text-center text-muted mt-8">Bước 4 - Rà soát hồ sơ</div>

      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="flex items-center gap-1.5">
          <UButton
            color="gray"
            label="Quay lại"
            icon="i-lucide-arrow-left"
            @click="handleBack"
            class="w-auto"
          />
        </div>
        <div class="flex items-center gap-1.5">
          <UButton
            color="primary"
            label="Tiếp theo"
            class="w-auto"
            @click="handleNext"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>