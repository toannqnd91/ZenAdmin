<script setup lang="ts">
import { useRoute } from 'vue-router'
import type { StepperItem } from '@nuxt/ui'
import type { FormError, FormSubmitEvent } from '@nuxt/ui'


const { isNotificationsSlideoverOpen } = useDashboard()

const items = ref<StepperItem[]>([
  {
    title: 'Bước 1',
    description: 'Thông tin cá nhân',
    icon: 'i-lucide-user'
  },
  {
    title: 'Bước 2',
    description: 'Thông tin học tập',
    icon: 'i-lucide-book-open'
  },
  {
    title: 'Bước 3',
    description: 'Đăng ký nguyện vọng',
    icon: 'i-lucide-list-checks'
  },
  {
    title: 'Bước 4',
    description: 'Rà soát và nộp hồ sơ',
    icon: 'i-lucide-file-check'
  }
])

const state = reactive<Partial<Schema & NestedSchema>>({ })

const validate = (state: any): FormError[] => {
  const errors = []
  if (!state.email) errors.push({ name: 'email', message: 'Required' })
  if (!state.password) errors.push({ name: 'password', message: 'Required' })
  return errors
}

</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Đăng ký xét tuyển">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
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
      <UStepper :items="items" class="w-full mb-8" />

      <div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full lg:max-w-6xl mx-auto">
        <!-- Form đăng ký -->
        <UForm :validate="validate" :state="state" class="space-y-4" @submit="onSubmit">

          <!-- Thông tin cơ bản -->
          <div>
            <h2 class="font-bold text-base mb-2">Thông tin cơ bản</h2>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div class="flex flex-col">
                <label for="middleName" class="font-medium mb-1">Họ đệm</label>
                <UInput id="middleName" v-model="state.middleName" placeholder="Họ đệm" />
              </div>
              <div class="flex flex-col">
                <label for="firstName" class="font-medium mb-1">Tên</label>
                <UInput id="firstName" v-model="state.firstName" placeholder="Tên" />
              </div>
              <div class="flex flex-col">
                <label for="idNumber" class="font-medium mb-1">Số CMND/CCCD</label>
                <UInput id="idNumber" v-model="state.idNumber" placeholder="Số CMND/CCCD" />
              </div>
              <div class="flex flex-col">
                <label for="idIssuedDate" class="font-medium mb-1">Ngày cấp</label>
                <UInput id="idIssuedDate" v-model="state.idIssuedDate" type="date" placeholder="Ngày cấp" />
              </div>
            </div>
          </div>

          <!-- Thông tin bổ sung -->
          <div>
            <h2 class="font-bold text-base mb-2">Thông tin bổ sung</h2>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <UInput label="Ngày sinh" type="date" required />
              <USelect label="Giới tính" :options="['Nam', 'Nữ', 'Khác']" required />
              <USelect label="Dân tộc" :options="['Kinh', 'Khác']" required />
              <USelect label="Quốc tịch" :options="['Việt Nam', 'Khác']" required />
              <USelect label="Tôn giáo" :options="['Không', 'Có']" required />
              <USelect label="Nơi sinh" :options="['Trong nước', 'Nước ngoài']" required />
              <USelect label="Tỉnh/Thành phố nơi sinh" :options="[]" />
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <USelect label="Hộ khẩu thường trú - Tỉnh/Thành phố" :options="[]" />
              <USelect label="Quận/Huyện" :options="[]" />
              <USelect label="Xã/Phường" :options="[]" />
            </div>
            <UInput label="Địa chỉ cụ thể" class="mt-2" />
          </div>

          <!-- Thông tin liên hệ -->
          <div>
            <h2 class="font-bold text-base mb-2">Thông tin liên hệ</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <UInput label="Địa chỉ nhận thư báo" required />
              <UButton label="Lấy giống hộ khẩu thường trú" color="primary" variant="soft" />
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <USelect label="Tỉnh/Thành phố" :options="[]" />
              <USelect label="Quận/Huyện" :options="[]" />
              <USelect label="Xã/Phường" :options="[]" />
            </div>
            <UInput label="Địa chỉ cụ thể" class="mt-2" />
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <UInput label="SĐT phụ huynh" />
              <UInput label="Email phụ huynh" />
            </div>
          </div>

          <!-- Thông tin học tập lớp 12 -->
          <div>
            <h2 class="font-bold text-base mb-2">Thông tin học tập lớp 12</h2>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <USelect label="Chọn tỉnh/TP" :options="[]" required />
              <USelect label="Chọn quận/huyện" :options="[]" required />
              <UInput label="Tên trường" required />
              <UInput label="Mã trường" />
              <UInput label="Tên lớp" />
              <USelect label="Học lực" :options="[]" />
              <USelect label="Hạnh kiểm" :options="[]" />
              <USelect label="Đối tượng ưu tiên" :options="[]" />
              <USelect label="Khu vực ưu tiên" :options="[]" />
              <UInput label="Năm tốt nghiệp" value="2025" />
            </div>
          </div>
        </UForm>
      </div>


    </template>
  </UDashboardPanel>
</template>
