<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import RemoteSearchSelect from '@/components/RemoteSearchSelect.vue'
import BaseCardHeader from '~/components/BaseCardHeader.vue'
import { customersService } from '@/services'
import { supplierService } from '@/services/supplier.service'
import { employeesService } from '@/services/employees.service'
import { cashBookService, CashBookTypeEnum, CashBookMethodEnum } from '@/services/cashbook.service'
import { WarehouseService } from '@/services/warehouse.service'

const warehouseService = new WarehouseService()

const router = useRouter()

// Form state
const paymentType = ref<'cash' | 'bank'>('cash')
const selectedBankAccount = ref<{ id: number, name: string } | null>(null)
const bankAccountText = ref<string>('') // Temporary text input for bank account
const selectedGroup = ref<{ id: number, name: string } | null>(null)
const selectedObject = ref<{ id: number, name: string } | null>(null)
const reason = ref<string>('')
const selectedPaymentMethod = ref<{ id: number, name: string } | null>(null)
const amount = ref<string>('')
const description = ref<string>('')
const selectedBranch = ref<{ id: number, name: string } | null>(null)
const receiptDate = ref<string>(new Date().toISOString().split('T')[0] || '')
const receiptCode = ref<string>('')
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

// Fetch functions for different object types
async function fetchCustomers(q: string) {
  try {
    const res = await customersService.getCustomers({ 
      search: { name: q || null },
      pagination: { start: 0, number: 15 } 
    })
    if (res.success && res.data?.data) {
      return res.data.data.map((c: any) => ({
        id: c.id,
        name: c.fullName || c.name || '',
        phone: c.phoneNumber || '',
        code: c.customerCode || '',
        avatarUrl: c.avatarUrl || null
      }))
    }
    return []
  } catch {
    return []
  }
}

async function fetchMoreCustomers(q: string, page: number) {
  try {
    const perPage = 15
    const res = await customersService.getCustomers({ 
      search: { name: q || null },
      pagination: { start: page * perPage, number: perPage } 
    })
    if (res.success && res.data?.data) {
      return {
        items: res.data.data.map((c: any) => ({
          id: c.id,
          name: c.fullName || c.name || '',
          phone: c.phoneNumber || '',
          code: c.customerCode || '',
          avatarUrl: c.avatarUrl || null
        })),
        hasMore: res.data.data.length >= perPage
      }
    }
    return { items: [], hasMore: false }
  } catch {
    return { items: [], hasMore: false }
  }
}

async function fetchSuppliers(q: string) {
  try {
    const res = await supplierService.getSuppliers({ search: q || undefined, pagination: { start: 0, number: 15 } }) as any
    
    if (res.success && res.data?.items) {
      return res.data.items.map((s: any) => ({
        id: s.id,
        name: s.name || '',
        phone: s.phone || '',
        code: s.code || '',
        avatarUrl: null
      }))
    }
    return []
  } catch (err) {
    console.error('fetchSuppliers error:', err)
    return []
  }
}

async function fetchMoreSuppliers(q: string, page: number) {
  try {
    const perPage = 15
    const res = await supplierService.getSuppliers({ search: q || undefined, pagination: { start: page * perPage, number: perPage } }) as any
    if (res.success && res.data?.items) {
      return {
        items: res.data.items.map((s: any) => ({
          id: s.id,
          name: s.name || '',
          phone: s.phone || '',
          code: s.code || '',
          avatarUrl: null
        })),
        hasMore: res.data.items.length >= perPage
      }
    }
    return { items: [], hasMore: false }
  } catch (err) {
    console.error('fetchMoreSuppliers error:', err)
    return { items: [], hasMore: false }
  }
}

async function fetchEmployees(q: string) {
  try {
    const res = await employeesService.getEmployees()
    if (res.success && res.data && Array.isArray(res.data)) {
      const allItems = res.data.map((e: any) => ({
        id: e.id,
        name: e.fullName || e.name || '',
        code: e.code || '',
        phone: e.phoneNumber || '',
        avatarUrl: null
      }))
      const qq = q.toLowerCase()
      const filtered = qq ? allItems.filter((i: any) => i.name.toLowerCase().includes(qq)) : allItems
      return filtered.slice(0, 15)
    }
    return []
  } catch {
    return []
  }
}

async function fetchMoreEmployees(q: string, page: number) {
  try {
    const res = await employeesService.getEmployees()
    if (res.success && res.data && Array.isArray(res.data)) {
      const allItems = res.data.map((e: any) => ({
        id: e.id,
        name: e.fullName || e.name || '',
        code: e.code || '',
        phone: e.phoneNumber || '',
        avatarUrl: null
      }))
      const qq = q.toLowerCase()
      const filtered = qq ? allItems.filter((i: any) => i.name.toLowerCase().includes(qq)) : allItems
      
      const perPage = 15
      const start = page * perPage
      const items = filtered.slice(start, start + perPage)
      return {
        items,
        hasMore: start + items.length < filtered.length
      }
    }
    return { items: [], hasMore: false }
  } catch {
    return { items: [], hasMore: false }
  }
}

// Fallback for other object types (mock data)
async function fetchOtherObjects(q: string) {
  const items = [
    { id: 1, name: 'Đối tượng khác 1', phone: '', code: '', avatarUrl: null },
    { id: 2, name: 'Đối tượng khác 2', phone: '', code: '', avatarUrl: null }
  ]
  const qq = q.toLowerCase()
  return qq ? items.filter(i => i.name.toLowerCase().includes(qq)) : items
}

async function fetchMoreOtherObjects(q: string, page: number) {
  return { items: [], hasMore: false }
}

// Dynamic fetch functions based on selected group
const objectFetchFn = computed(() => {
  if (!selectedGroup.value) return fetchOtherObjects
  
  const groupName = (selectedGroup.value as { name?: string }).name?.toLowerCase() || ''
  
  if (groupName.includes('khách hàng')) return fetchCustomers
  if (groupName.includes('nhà cung cấp')) return fetchSuppliers
  if (groupName.includes('nhân viên')) return fetchEmployees
  
  return fetchOtherObjects
})

const objectFetchMoreFn = computed(() => {
  if (!selectedGroup.value) return fetchMoreOtherObjects
  
  const groupName = (selectedGroup.value as { name?: string }).name?.toLowerCase() || ''
  
  if (groupName.includes('khách hàng')) return fetchMoreCustomers
  if (groupName.includes('nhà cung cấp')) return fetchMoreSuppliers
  if (groupName.includes('nhân viên')) return fetchMoreEmployees
  
  return fetchMoreOtherObjects
})

// Watch selectedGroup and reset selectedObject when group changes
watch(selectedGroup, () => {
  selectedObject.value = null
})


async function fetchBranches(q: string) {
  try {
    const res = await warehouseService.getWarehouses()
    if (res.success && res.data && Array.isArray(res.data)) {
      const branches = res.data.map((w: any) => ({
        id: w.id,
        name: w.name
      }))
      const qq = q.toLowerCase()
      return qq ? branches.filter(i => i.name.toLowerCase().includes(qq)) : branches
    }
    return []
  } catch (err) {
    console.error('fetchBranches error:', err)
    return []
  }
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

async function handleSubmit() {
  try {
    // Prepare request body according to API spec
    const requestBody = {
      type: CashBookTypeEnum.Thu, // 1 = Thu (Receipt)
      method: paymentType.value === 'cash' ? CashBookMethodEnum.TienMat : CashBookMethodEnum.ChuyenKhoan, // 1=TienMat, 2=ChuyenKhoan
      amount: parseFloat(amount.value) || 0,
      description: reason.value || '',
      category: selectedGroup.value?.name || '',
      partyType: selectedGroup.value?.name || '',
      partyId: selectedObject.value?.id?.toString() || '',
      referenceId: reference.value || undefined,
      ordCode: receiptCode.value || undefined,
      affectBusinessResult: true
    }

    console.log('Creating receipt with payload:', requestBody)
    
    const response = await cashBookService.createCashBook(requestBody)
    
    if (response.success) {
      console.log('Receipt created successfully:', response)
      // Show success message (you can add toast notification here)
      goBack()
    } else {
      console.error('Failed to create receipt:', response.message)
      // Show error message
    }
  } catch (error) {
    console.error('Error creating receipt:', error)
    // Show error message
  }
}
</script>

<template>
  <UDashboardPanel id="create-receipt" class="flex flex-col h-full">
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
              Tạo phiếu thu
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
                          Tài khoản nhận tiền<span class="text-red-500">*</span>
                        </label>
                        <!-- Temporary: using text input instead of dropdown -->
                        <input
                          v-model="bankAccountText"
                          type="text"
                          placeholder="Nhập tài khoản nhận tiền"
                          class="h-9 w-full px-3 rounded-md border border-gray-300 bg-white placeholder:text-gray-400 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        >
                        <!-- 
                        <RemoteSearchSelect
                          v-model="selectedBankAccount"
                          :fetch-fn="fetchBankAccounts"
                          placeholder="Chọn tài khoản"
                          label-field="name"
                          :trigger-class="'h-9 w-full'"
                          :full-width="true"
                        />
                        -->
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">
                          Nhóm đối tượng nộp<span class="text-red-500">*</span>
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
                          Nhóm đối tượng nộp<span class="text-red-500">*</span>
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
                          Đối tượng nộp
                        </label>
                        <RemoteSearchSelect
                          v-model="selectedObject"
                          :fetch-fn="objectFetchFn"
                          :fetch-more-fn="objectFetchMoreFn"
                          placeholder="Tìm theo tên, SĐT...(F4)"
                          :clearable="true"
                          :debounce="300"
                          label-field="name"
                          open-key="F4"
                          :full-width="true"
                          :dropdown-max-height="420"
                          :searchable="true"
                          :search-in-trigger="true"
                          infinite-scroll
                          :trigger-class="'h-9 w-full'"
                        >
                          <template #trigger-left="{ value }">
                            <img
                              v-if="value"
                              :src="(value as any).avatarUrl || '/no-avatar.jpg'"
                              class="w-4 h-4 object-cover rounded-full mr-2"
                              alt="avatar"
                              @error="e => { const t = e.target as HTMLImageElement; if (t) t.src = '/no-avatar.jpg' }"
                            >
                          </template>
                          <template #item="{ item }">
                            <div class="flex items-center gap-2 w-full">
                              <img
                                :src="item.avatarUrl || '/no-avatar.jpg'"
                                class="w-6 h-6 rounded-full object-cover"
                                alt="avatar"
                                @error="e => { const t = e.target as HTMLImageElement; if (t) t.src = '/no-avatar.jpg' }"
                              >
                              <div class="flex-1 min-w-0">
                                <div class="text-sm text-gray-900 font-medium truncate">
                                  {{ item.name }}
                                </div>
                                <div v-if="item.phone" class="text-xs text-gray-500 truncate">
                                  {{ item.phone }}
                                </div>
                              </div>
                              <span v-if="item.code" class="ml-auto text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{{ item.code }}</span>
                            </div>
                          </template>
                        </RemoteSearchSelect>
                      </div>
                    </div>

                    <!-- Đối tượng nộp for bank (second row) -->
                    <div v-if="paymentType === 'bank'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">
                          Đối tượng nộp
                        </label>
                        <RemoteSearchSelect
                          v-model="selectedObject"
                          :fetch-fn="objectFetchFn"
                          :fetch-more-fn="objectFetchMoreFn"
                          placeholder="Tìm theo tên, SĐT...(F4)"
                          :clearable="true"
                          :debounce="300"
                          label-field="name"
                          open-key="F4"
                          :full-width="true"
                          :dropdown-max-height="420"
                          :searchable="true"
                          :search-in-trigger="true"
                          infinite-scroll
                          :trigger-class="'h-9 w-full'"
                        >
                          <template #trigger-left="{ value }">
                            <img
                              v-if="value"
                              :src="(value as any).avatarUrl || '/no-avatar.jpg'"
                              class="w-4 h-4 object-cover rounded-full mr-2"
                              alt="avatar"
                              @error="e => { const t = e.target as HTMLImageElement; if (t) t.src = '/no-avatar.jpg' }"
                            >
                          </template>
                          <template #item="{ item }">
                            <div class="flex items-center gap-2 w-full">
                              <img
                                :src="item.avatarUrl || '/no-avatar.jpg'"
                                class="w-6 h-6 rounded-full object-cover"
                                alt="avatar"
                                @error="e => { const t = e.target as HTMLImageElement; if (t) t.src = '/no-avatar.jpg' }"
                              >
                              <div class="flex-1 min-w-0">
                                <div class="text-sm text-gray-900 font-medium truncate">
                                  {{ item.name }}
                                </div>
                                <div v-if="item.phone" class="text-xs text-gray-500 truncate">
                                  {{ item.phone }}
                                </div>
                              </div>
                              <span v-if="item.code" class="ml-auto text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{{ item.code }}</span>
                            </div>
                          </template>
                        </RemoteSearchSelect>
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">
                          Lý do thu<span class="text-red-500">*</span>
                        </label>
                        <input
                          v-model="reason"
                          type="text"
                          placeholder="Nhập lý do thu"
                          class="h-9 w-full px-3 rounded-md border border-gray-300 bg-white placeholder:text-gray-400 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        >
                      </div>
                    </div>

                    <!-- Form Fields Row 2 (for cash only, bank has it above) -->
                    <div v-if="paymentType === 'cash'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">
                          Lý do thu<span class="text-red-500">*</span>
                        </label>
                        <input
                          v-model="reason"
                          type="text"
                          placeholder="Nhập lý do thu"
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
                        Chi nhánh nhận<span class="text-red-500">*</span>
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
                        Ngày nhận tiền<span class="text-red-500">*</span>
                      </label>
                      <input
                        v-model="receiptDate"
                        type="date"
                        class="h-9 w-full px-3 rounded-md border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      >
                    </div>

                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-1">
                        Mã phiếu thu
                      </label>
                      <input
                        v-model="receiptCode"
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
