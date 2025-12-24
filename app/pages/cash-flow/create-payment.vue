<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import RemoteSearchSelect from '@/components/RemoteSearchSelect.vue'
import BaseCardHeader from '~/components/BaseCardHeader.vue'

const router = useRouter()

// Form state
const paymentType = ref<'cash' | 'bank'>('cash')
const selectedBankAccount = ref<{ id: number, name: string } | null>(null)
const selectedGroup = ref<{ id: number, name: string } | null>(null)
const selectedObject = ref<{ id: number, name: string } | null>(null)
const reason = ref<string>('')
const selectedPaymentMethod = ref<{ id: number, name: string } | null>(null)
const amount = ref<string>('')
const description = ref<string>('')
const selectedBranch = ref<{ id: number, name: string } | null>(null)
const paymentDate = ref<string>(new Date().toISOString().split('T')[0] || '')
const paymentCode = ref<string>('')
const reference = ref<string>('')
const attachments = ref<File[]>([])

// Mock data fetchers
async function fetchGroups(q: string) {
  const items = [
    { id: 1, name: 'Khách hàng' },
    { id: 2, name: 'Nhà cung cấp' },
    { id: 3, name: 'Nhân viên' },
    { id: 4, name: 'Đối tác vận chuyển' },
    { id: 5, name: 'Đối tác thanh toán' },
    { id: 6, name: 'Đối tượng khác' }
  ]
  const qq = q.toLowerCase()
  return qq ? items.filter(i => i.name.toLowerCase().includes(qq)) : items
}

async function fetchObjects(q: string) {
  const items = [
    { id: 1, name: 'Khách hàng A' },
    { id: 2, name: 'Khách hàng B' },
    { id: 3, name: 'Nhà cung cấp C' }
  ]
  const qq = q.toLowerCase()
  return qq ? items.filter(i => i.name.toLowerCase().includes(qq)) : items
}


async function fetchBranches(q: string) {
  const items = [
    { id: 1, name: 'Chi nhánh Hà Nội' },
    { id: 2, name: 'Chi nhánh TP.HCM' },
    { id: 3, name: 'Chi nhánh Đà Nẵng' }
  ]
  const qq = q.toLowerCase()
  return qq ? items.filter(i => i.name.toLowerCase().includes(qq)) : items
}

async function fetchBankAccounts(q: string) {
  const items = [
    { id: 1, name: 'TK Vietcombank - 1234567890' },
    { id: 2, name: 'TK Techcombank - 0987654321' },
    { id: 3, name: 'TK BIDV - 1122334455' }
  ]
  const qq = q.toLowerCase()
  return qq ? items.filter(i => i.name.toLowerCase().includes(qq)) : items
}

async function fetchPaymentMethods(q: string) {
  const items = [
    { id: 1, name: 'Chuyển khoản' },
    { id: 2, name: 'Ví điện tử' },
    { id: 3, name: 'Thẻ tín dụng' }
  ]
  const qq = q.toLowerCase()
  return qq ? items.filter(i => i.name.toLowerCase().includes(qq)) : items
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files) {
    attachments.value = Array.from(target.files)
  }
}

function goBack() {
  router.push('/cash-flow')
}

function handleSubmit() {
  // TODO: Implement API call to create payment
    paymentType: paymentType.value,
    bankAccount: selectedBankAccount.value,
    group: selectedGroup.value,
    object: selectedObject.value,
    reason: reason.value,
    amount: amount.value,
    description: description.value,
    branch: selectedBranch.value,
    date: paymentDate.value,
    code: paymentCode.value,
    reference: reference.value,
    paymentMethod: selectedPaymentMethod.value,
    attachments: attachments.value
  })
  // After successful creation, navigate back
  goBack()
}
</script>

<template>
  <UDashboardPanel id="create-payment" class="flex flex-col h-full">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <div class="flex items-center gap-3">
            <button
              class="h-8 w-8 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              @click="goBack"
            >
              <svg
                class="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div class="text-lg font-semibold">
              Tạo phiếu chi
            </div>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full max-w-screen-xl mx-auto px-6 py-6">
        <form @submit.prevent="handleSubmit">
          <div class="flex flex-col lg:flex-row gap-6">
            <!-- Left Column: Main Information -->
            <div class="flex-1 flex flex-col gap-6">
              <UPageCard variant="soft" class="bg-white rounded-lg">
                <BaseCardHeader>Thông tin chung</BaseCardHeader>
                <div class="-mx-6 px-6">
                  <div class="space-y-4">

                    <!-- Payment Type Tabs -->
                    <div class="flex gap-2">
                      <button
                        type="button"
                        :class="[
                          'flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors',
                          paymentType === 'cash'
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        ]"
                        @click="paymentType = 'cash'"
                      >
                        <UIcon name="i-lucide-wallet" class="size-4" />
                        <span class="font-medium">Tiền mặt</span>
                      </button>
                      <button
                        type="button"
                        :class="[
                          'flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors',
                          paymentType === 'bank'
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        ]"
                        @click="paymentType = 'bank'"
                      >
                        <UIcon name="i-lucide-building-2" class="size-4" />
                        <span class="font-medium">Tài khoản ngân hàng</span>
                      </button>
                    </div>

                    <!-- Bank Account Field (only for bank payment type) -->
                    <div v-if="paymentType === 'bank'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">
                          Tài khoản chi tiền<span class="text-red-500">*</span>
                        </label>
                        <RemoteSearchSelect
                          v-model="selectedBankAccount"
                          :fetch-fn="fetchBankAccounts"
                          placeholder="Chọn tài khoản"
                          label-field="name"
                          :trigger-class="'h-9 w-full'"
                          :full-width="true"
                        />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">
                          Nhóm đối tượng chi<span class="text-red-500">*</span>
                        </label>
                        <RemoteSearchSelect
                          v-model="selectedGroup"
                          :fetch-fn="fetchGroups"
                          placeholder="Chọn nhóm"
                          label-field="name"
                          :trigger-class="'h-9 w-full'"
                          :full-width="true"
                        />
                      </div>
                    </div>

                    <!-- Cash Payment Fields -->
                    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">
                          Nhóm đối tượng chi<span class="text-red-500">*</span>
                        </label>
                        <RemoteSearchSelect
                          v-model="selectedGroup"
                          :fetch-fn="fetchGroups"
                          placeholder="Chọn nhóm"
                          label-field="name"
                          :trigger-class="'h-9 w-full'"
                          :full-width="true"
                        />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">
                          Đối tượng chi
                        </label>
                        <RemoteSearchSelect
                          v-model="selectedObject"
                          :fetch-fn="fetchObjects"
                          placeholder="Chọn đối tượng"
                          label-field="name"
                          :trigger-class="'h-9 w-full'"
                          :full-width="true"
                        />
                      </div>
                    </div>

                    <!-- Đối tượng chi for bank (second row) -->
                    <div v-if="paymentType === 'bank'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">
                          Đối tượng chi
                        </label>
                        <RemoteSearchSelect
                          v-model="selectedObject"
                          :fetch-fn="fetchObjects"
                          placeholder="Chọn đối tượng"
                          label-field="name"
                          :trigger-class="'h-9 w-full'"
                          :full-width="true"
                        />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">
                          Lý do chi<span class="text-red-500">*</span>
                        </label>
                        <input
                          v-model="reason"
                          type="text"
                          placeholder="Nhập lý do chi"
                          class="h-9 w-full px-3 rounded-md border border-gray-300 bg-white placeholder:text-gray-400 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        >
                      </div>
                    </div>

                    <!-- Form Fields Row 2 (for cash only, bank has it above) -->
                    <div v-if="paymentType === 'cash'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">
                          Lý do chi<span class="text-red-500">*</span>
                        </label>
                        <input
                          v-model="reason"
                          type="text"
                          placeholder="Nhập lý do chi"
                          class="h-9 w-full px-3 rounded-md border border-gray-300 bg-white placeholder:text-gray-400 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        >
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">
                          Giá trị<span class="text-red-500">*</span>
                        </label>
                        <div class="relative">
                          <input
                            v-model="amount"
                            type="text"
                            placeholder="Nhập giá trị"
                            class="h-9 w-full px-3 pr-8 rounded-md border border-gray-300 bg-white placeholder:text-gray-400 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                          >
                          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                            đ
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- Amount field for bank (single column) -->
                    <div v-else class="grid grid-cols-1 gap-4">
                      <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">
                          Giá trị<span class="text-red-500">*</span>
                        </label>
                        <div class="relative">
                          <input
                            v-model="amount"
                            type="text"
                            placeholder="Nhập giá trị"
                            class="h-9 w-full px-3 pr-8 rounded-md border border-gray-300 bg-white placeholder:text-gray-400 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                          >
                          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                            đ
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- Description Field -->
                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-1">
                        Diễn giải<span class="text-red-500">*</span>
                      </label>
                      <textarea
                        v-model="description"
                        placeholder="Nhập diễn giải"
                        rows="3"
                        class="w-full px-3 py-2 rounded-md border border-gray-300 bg-white placeholder:text-gray-400 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                      />
                    </div>
                  </div>
                </div>
              </UPageCard>

              <!-- Attachments Section -->
              <UPageCard variant="soft" class="bg-white rounded-lg">
                <BaseCardHeader>Ảnh chứng từ</BaseCardHeader>
                <div class="-mx-6 px-6">
                  <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <div class="flex flex-col items-center gap-2">
                      <UIcon name="i-lucide-image" class="size-8 text-gray-400" />
                      <p class="text-sm text-gray-600">
                        Kéo thả hoặc
                        <label class="text-primary-600 hover:text-primary-700 cursor-pointer font-medium">
                          tải ảnh từ thiết bị
                          <input
                            type="file"
                            multiple
                            accept="image/jpeg,image/png"
                            class="hidden"
                            @change="handleFileUpload"
                          >
                        </label>
                      </p>
                      <p class="text-xs text-gray-500">
                        (Dung lượng tối đa 2MB/ảnh , hỗ trợ JPEG hoặc PNG. Tối đa 10 ảnh)
                      </p>
                    </div>
                  </div>
                  <div v-if="attachments.length > 0" class="flex flex-wrap gap-2">
                    <div
                      v-for="(file, idx) in attachments"
                      :key="idx"
                      class="px-3 py-1 bg-gray-100 rounded-md text-sm text-gray-700"
                    >
                      {{ file.name }}
                    </div>
                  </div>
                </div>
              </UPageCard>
            </div>

            <!-- Right Column: Additional Information -->
            <div class="lg:w-80 flex flex-col gap-6">
              <UPageCard variant="soft" class="bg-white rounded-lg">
                <BaseCardHeader>Thông tin bổ sung</BaseCardHeader>
                <div class="-mx-6 px-6">
                  <div class="space-y-4">

                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-1">
                        Chi nhánh chi<span class="text-red-500">*</span>
                      </label>
                      <RemoteSearchSelect
                        v-model="selectedBranch"
                        :fetch-fn="fetchBranches"
                        placeholder="Chọn chi nhánh"
                        label-field="name"
                        :trigger-class="'h-9 w-full'"
                        :full-width="true"
                      />
                    </div>

                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-1">
                        Ngày chi tiền<span class="text-red-500">*</span>
                      </label>
                      <input
                        v-model="paymentDate"
                        type="date"
                        class="h-9 w-full px-3 rounded-md border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      >
                    </div>

                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-1">
                        Mã phiếu chi
                      </label>
                      <input
                        v-model="paymentCode"
                        type="text"
                        placeholder="Nhập mã"
                        class="h-9 w-full px-3 rounded-md border border-gray-300 bg-white placeholder:text-gray-400 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      >
                    </div>

                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                        Tham chiếu
                        <UTooltip text="Mã tham chiếu đến chứng từ gốc">
                          <UIcon name="i-lucide-info" class="size-4 text-gray-400" />
                        </UTooltip>
                      </label>
                      <input
                        v-model="reference"
                        type="text"
                        placeholder="Nhập tham chiếu"
                        class="h-9 w-full px-3 rounded-md border border-gray-300 bg-white placeholder:text-gray-400 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      >
                    </div>

                  </div>
                </div>
              </UPageCard>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end">
            <button
              type="submit"
              class="h-9 px-6 rounded-md bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm"
            >
              Tạo phiếu
            </button>
          </div>
        </form>
      </div>
    </template>
  </UDashboardPanel>
</template>
