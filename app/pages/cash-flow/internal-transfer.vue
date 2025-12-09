<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import RemoteSearchSelect from '@/components/RemoteSearchSelect.vue'
import BaseCardHeader from '~/components/BaseCardHeader.vue'

const router = useRouter()

// Form state
const transferFrom = ref<{ id: string, name: string } | null>({ id: 'cash', name: 'Tiền mặt' })
const transferTo = ref<{ id: string, name: string } | null>({ id: 'bank', name: 'Tài khoản ngân hàng' })

const sourceBranch = ref<{ id: number, name: string } | null>(null)
const sourceAccount = ref<{ id: number, name: string } | null>(null)

const destBranch = ref<{ id: number, name: string } | null>(null)
const destAccount = ref<{ id: number, name: string } | null>(null)

const amount = ref<string>('')
const description = ref<string>('Chuyển quỹ nội bộ')
const transferDate = ref<string>(new Date().toISOString().split('T')[0] || '')
const transferCode = ref<string>('')
const reference = ref<string>('')
const attachments = ref<File[]>([])

// Mock data fetchers
async function fetchFundTypes(q: string) {
  const items = [
    { id: 'cash', name: 'Tiền mặt' },
    { id: 'bank', name: 'Tài khoản ngân hàng' }
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
  // TODO: Implement API call to create internal transfer
  console.log('Creating internal transfer:', {
    transferFrom: transferFrom.value,
    transferTo: transferTo.value,
    sourceBranch: sourceBranch.value,
    sourceAccount: sourceAccount.value,
    destBranch: destBranch.value,
    destAccount: destAccount.value,
    amount: amount.value,
    description: description.value,
    date: transferDate.value,
    code: transferCode.value,
    reference: reference.value,
    attachments: attachments.value
  })
  // After successful creation, navigate back
  goBack()
}

// Dynamic labels based on selection
const sourceLabel = computed(() => {
  return transferFrom.value?.id === 'bank' ? 'Tài khoản chuyển' : 'Chi nhánh chuyển'
})

const destLabel = computed(() => {
  return transferTo.value?.id === 'bank' ? 'Tài khoản nhận' : 'Chi nhánh nhận'
})
</script>

<template>
  <UDashboardPanel id="internal-transfer" class="flex flex-col h-full">
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
              Chuyển quỹ nội bộ
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

                    <!-- Transfer Type Row -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">
                          Chuyển từ<span class="text-red-500">*</span>
                        </label>
                        <RemoteSearchSelect
                          v-model="transferFrom"
                          :fetch-fn="fetchFundTypes"
                          placeholder="Chọn loại quỹ"
                          label-field="name"
                          :trigger-class="'h-9 w-full'"
                          :full-width="true"
                        />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">
                          Chuyển đến<span class="text-red-500">*</span>
                        </label>
                        <RemoteSearchSelect
                          v-model="transferTo"
                          :fetch-fn="fetchFundTypes"
                          placeholder="Chọn loại quỹ"
                          label-field="name"
                          :trigger-class="'h-9 w-full'"
                          :full-width="true"
                        />
                      </div>
                    </div>

                    <!-- Source/Dest Selection Row -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <!-- Source -->
                      <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">
                          {{ sourceLabel }}<span class="text-red-500">*</span>
                        </label>
                        <!-- Show Bank Account select if From=Bank -->
                        <RemoteSearchSelect
                          v-if="transferFrom?.id === 'bank'"
                          v-model="sourceAccount"
                          :fetch-fn="fetchBankAccounts"
                          placeholder="Chọn tài khoản"
                          label-field="name"
                          :trigger-class="'h-9 w-full'"
                          :full-width="true"
                        />
                        <!-- Show Branch select if From=Cash -->
                        <RemoteSearchSelect
                          v-else
                          v-model="sourceBranch"
                          :fetch-fn="fetchBranches"
                          placeholder="Chọn chi nhánh"
                          label-field="name"
                          :trigger-class="'h-9 w-full'"
                          :full-width="true"
                        />
                      </div>

                      <!-- Destination -->
                      <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">
                          {{ destLabel }}<span class="text-red-500">*</span>
                        </label>
                        <!-- Show Bank Account select if To=Bank -->
                        <RemoteSearchSelect
                          v-if="transferTo?.id === 'bank'"
                          v-model="destAccount"
                          :fetch-fn="fetchBankAccounts"
                          placeholder="Chọn tài khoản"
                          label-field="name"
                          :trigger-class="'h-9 w-full'"
                          :full-width="true"
                        />
                        <!-- Show Branch select if To=Cash -->
                        <RemoteSearchSelect
                          v-else
                          v-model="destBranch"
                          :fetch-fn="fetchBranches"
                          placeholder="Chọn chi nhánh"
                          label-field="name"
                          :trigger-class="'h-9 w-full'"
                          :full-width="true"
                        />
                      </div>
                    </div>

                    <!-- Amount -->
                    <div class="grid grid-cols-1 gap-4">
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
                        Diễn giải
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
                        Ngày nhận tiền<span class="text-red-500">*</span>
                      </label>
                      <input
                        v-model="transferDate"
                        type="date"
                        class="h-9 w-full px-3 rounded-md border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      >
                    </div>

                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-1">
                        Mã phiếu
                      </label>
                      <input
                        v-model="transferCode"
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
