<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseCardHeader from '@/components/BaseCardHeader.vue'
import CustomRadio from '@/components/CustomRadio.vue'
import BaseDropdownSelect from '@/components/BaseDropdownSelect.vue'
import RemoteSearchSelect from '@/components/RemoteSearchSelect.vue'
import { useLocations } from '@/composables/useLocations'

const router = useRouter()

const name = ref('')
const note = ref('')
type Classify = 'manual' | 'auto'
const classify = ref<Classify>('manual')

// ---------------- Classification (Phân loại) builder ----------------
type MatchType = 'all' | 'any'
const matchType = ref<MatchType>('all')

type FieldKey = 'status' | 'createdAt' | 'totalSpend' | 'address' | 'marketingEmail'
interface ConditionBase {
  id: number
  field: FieldKey | ''
  operator: string | ''
}
type ConditionValue = string | number | boolean | Record<string, unknown> | null
interface Condition extends ConditionBase { value: ConditionValue }

const conditions = ref<Condition[]>([])
let cid = 1
function addEmptyCondition() {
  conditions.value.push({ id: cid++, field: '', operator: '', value: null })
}
function removeCondition(id: number) {
  conditions.value = conditions.value.filter(c => c.id !== id)
}

const fieldOptions = [
  { id: 'status', label: 'Trạng thái' },
  { id: 'createdAt', label: 'Ngày tạo' },
  { id: 'totalSpend', label: 'Tổng chi tiêu' },
  { id: 'address', label: 'Địa chỉ' },
  { id: 'marketingEmail', label: 'Nhận email quảng cáo' }
] as const

function operatorOptions(field: FieldKey | '') {
  switch (field) {
    case 'status':
      return [{ id: 'is', label: 'là' }]
    case 'createdAt':
      return [{ id: 'between', label: 'trong khoảng' }]
    case 'totalSpend':
      return [
        { id: 'eq', label: 'bằng (=)' },
        { id: 'gt', label: 'lớn hơn (>)' },
        { id: 'lt', label: 'nhỏ hơn (<)' }
      ]
    case 'address':
      return [{ id: 'is', label: 'là' }]
    case 'marketingEmail':
      return [{ id: 'is', label: 'là' }]
    default:
      return []
  }
}

const statusOptions = [
  { id: 'active', label: 'Đang hoạt động' },
  { id: 'inactive', label: 'Ngừng hoạt động' }
]
const yesNoOptions = [
  { id: 'yes', label: 'Có' },
  { id: 'no', label: 'Không' }
]

// Location fetchers for address control
const { getProvinces, getWards } = useLocations()
const provinceByCond = ref<Record<number, Record<string, unknown> | null>>({})
const wardByCond = ref<Record<number, Record<string, unknown> | null>>({})

function resetByField(cond: Condition) {
  cond.operator = ''
  cond.value = null
  provinceByCond.value[cond.id] = null
  wardByCond.value[cond.id] = null
}

watch(classify, (m) => {
  if (m === 'auto' && conditions.value.length === 0) addEmptyCondition()
})

function isConditionComplete(c: Condition): boolean {
  if (!c.field || !c.operator) return false
  switch (c.field) {
    case 'status':
      return typeof c.value === 'string' && !!c.value
    case 'createdAt':
      return typeof c.value === 'string' && !!c.value.trim()
    case 'totalSpend':
      return typeof c.value === 'number' && !Number.isNaN(c.value)
    case 'address':
      return typeof c.value === 'object' && c.value !== null && 'province' in (c.value as Record<string, unknown>)
    case 'marketingEmail':
      return typeof c.value === 'boolean'
    default:
      return false
  }
}

// Overall form validity
const touchedName = ref(false)
const nameError = computed(() => {
  if (!touchedName.value) return ''
  return name.value.trim() ? '' : 'Vui lòng nhập tên nhóm khách hàng'
})
const autoValid = computed(() => {
  if (classify.value !== 'auto') return true
  if (!conditions.value.length) return false
  return conditions.value.every(isConditionComplete)
})
const isValid = computed(() => !!name.value.trim() && autoValid.value)

function goBack() {
  router.push('/customer_groups')
}

async function handleCreate() {
  touchedName.value = true
  if (!isValid.value) return
  // TODO: integrate API create when backend is ready
  try {
    const toast = useToast?.()
    toast?.add?.({ title: 'Đã tạo nhóm khách hàng', color: 'success' })
  } catch { /* no-op */ }
  router.push('/customer_groups')
}
</script>

<template>
  <UDashboardPanel id="customer-groups-create" class="flex flex-col h-full">
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
              Tạo nhóm khách hàng
            </div>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full max-w-screen-xl mx-auto px-6 py-6">
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
          <!-- Thông tin chung -->
          <UPageCard variant="soft" class="bg-white rounded-lg">
            <BaseCardHeader>Thông tin chung</BaseCardHeader>
            <div class="-mx-6 px-6 pb-4">
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Tên nhóm khách hàng <span class="text-red-500">*</span>
              </label>
              <input
                v-model="name"
                type="text"
                placeholder="Nhập tên nhóm khách hàng"
                class="w-full h-9 px-3 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                :class="nameError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'"
                @blur="touchedName = true"
              >
              <p v-if="nameError" class="text-xs text-red-600 mt-1">
                {{ nameError }}
              </p>
            </div>
          </UPageCard>

          <!-- Ghi chú -->
          <UPageCard variant="soft" class="bg-white rounded-lg">
            <BaseCardHeader>Ghi chú</BaseCardHeader>
            <div class="-mx-6 px-6 pb-4">
              <textarea
                v-model="note"
                rows="4"
                placeholder="VD: Nhận hàng ghi công nợ"
                class="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none bg-white"
              />
            </div>
          </UPageCard>
        </div>

        <!-- Phân loại -->
        <UPageCard variant="soft" class="bg-white rounded-lg mt-4">
          <BaseCardHeader>Phân loại</BaseCardHeader>
          <div class="-mx-6 px-6 pb-4">
            <div class="space-y-3">
              <CustomRadio v-model="classify" value="manual" label="Thủ công" />
              <div>
                <CustomRadio v-model="classify" value="auto" label="Tự động" />
                <div v-if="classify === 'auto'" class="mt-4 space-y-4">
                  <div class="flex items-center gap-4 text-[15px]">
                    <span class="text-gray-700">Khách hàng phải thỏa mãn:</span>
                    <CustomRadio v-model="matchType" value="all" label="Tất cả các điều kiện" />
                    <CustomRadio v-model="matchType" value="any" label="Một trong các điều kiện" />
                  </div>

                  <div
                    v-for="cond in conditions"
                    :key="cond.id"
                    class="flex items-center gap-3"
                  >
                    <!-- Field -->
                    <BaseDropdownSelect
                      :model-value="cond.field"
                      :options="fieldOptions as unknown as Array<{ id: string | number; label: string }>"
                      placeholder="Chọn trường"
                      class="w-[180px] h-9 px-3 rounded-md border border-gray-300 bg-white text-sm"
                      @update:model-value="(v: any) => { cond.field = v as FieldKey; resetByField(cond) }"
                    />

                    <!-- Operator -->
                    <BaseDropdownSelect
                      :model-value="cond.operator"
                      :options="operatorOptions(cond.field) as unknown as Array<{ id: string | number; label: string }>"
                      placeholder="Chọn toán tử"
                      class="w-[170px] h-9 px-3 rounded-md border border-gray-300 bg-white text-sm"
                      @update:model-value="(v: any) => { cond.operator = String(v) }"
                    />

                    <!-- Value control depends on field -->
                    <div class="w-[520px]">
                      <!-- Status -->
                      <BaseDropdownSelect
                        v-if="cond.field === 'status'"
                        :model-value="typeof cond.value === 'string' ? cond.value : ''"
                        :options="statusOptions"
                        placeholder="Vui lòng chọn"
                        class="w-[520px] h-9 px-3 rounded-md border border-gray-300 bg-white text-sm"
                        @update:model-value="(v: any) => { cond.value = String(v) }"
                      />

                      <!-- CreatedAt date range (free text for now) -->
                      <input
                        v-else-if="cond.field === 'createdAt'"
                        :value="typeof cond.value === 'string' ? cond.value : ''"
                        placeholder="dd/MM/yyyy - dd/MM/yyyy"
                        class="w-[520px] h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        @input="(e: any) => (cond.value = e.target.value)"
                      >

                      <!-- Total spend number -->
                      <div v-else-if="cond.field === 'totalSpend'" class="inline-flex items-center w-[520px]">
                        <input
                          :value="typeof cond.value === 'number' ? String(cond.value) : ''"
                          type="number"
                          placeholder="Nhập tổng chi tiêu"
                          class="flex-1 h-9 px-3 rounded-l-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          @input="(e: any) => (cond.value = Number(e.target.value))"
                        >
                        <span class="h-9 inline-flex items-center justify-center w-10 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-sm text-gray-500">đ</span>
                      </div>

                      <!-- Address: province + ward -->
                      <div v-else-if="cond.field === 'address'" class="flex items-center gap-3 w-[520px]">
                        <RemoteSearchSelect
                          :model-value="provinceByCond[cond.id] || null"
                          :fetch-fn="getProvinces as any"
                          placeholder="Chọn Tỉnh thành"
                          label-field="name"
                          :full-width="false"
                          :trigger-class="'w-[248px]'"
                          @update:model-value="(p: any) => { provinceByCond[cond.id] = p; wardByCond[cond.id] = null; cond.value = { province: p, ward: null } }"
                        />
                        <RemoteSearchSelect
                          :model-value="wardByCond[cond.id] || null"
                          :fetch-fn="((q: string) => getWards(q, (provinceByCond[cond.id] as any)?.code || (provinceByCond[cond.id] as any)?.id)) as any"
                          placeholder="Chọn Quận huyện"
                          label-field="name"
                          :full-width="false"
                          :trigger-class="'w-[248px]'"
                          :disabled="!provinceByCond[cond.id]"
                          @update:model-value="(w: any) => { wardByCond[cond.id] = w; const pv = provinceByCond[cond.id] || null; cond.value = { province: pv, ward: w || null } }"
                        />
                      </div>

                      <!-- Yes/No -->
                      <BaseDropdownSelect
                        v-else-if="cond.field === 'marketingEmail'"
                        :model-value="typeof cond.value === 'boolean' ? (cond.value ? 'yes' : 'no') : ''"
                        :options="yesNoOptions"
                        placeholder="Vui lòng chọn"
                        class="w-[520px] h-9 px-3 rounded-md border border-gray-300 bg-white text-sm"
                        @update:model-value="(v: any) => { cond.value = String(v) === 'yes' }"
                      />
                    </div>

                    <button
                      class="ml-1 text-gray-400 hover:text-red-600"
                      title="Xoá điều kiện"
                      @click="removeCondition(cond.id)"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <button
                    class="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm"
                    type="button"
                    @click="addEmptyCondition"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span>Thêm điều kiện khác</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </UPageCard>

        <div class="flex items-center justify-between mt-8">
          <div class="text-gray-600 text-sm">
            Tìm hiểu thêm về
            <NuxtLink to="#" class="text-primary-600 font-medium hover:underline">Tạo nhóm khách hàng</NuxtLink>
          </div>
          <UButton
            color="primary"
            size="lg"
            class="px-6"
            :disabled="!isValid"
            @click="handleCreate"
          >
            Tạo nhóm
          </UButton>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
