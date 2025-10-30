<script setup lang="ts">
import { useAppTitle } from '@/composables/useAppSettings'
import RemoteSearchSelect from '@/components/RemoteSearchSelect.vue'
import { customersService, warehouseService, priceBooksService } from '@/services'
import type { CustomerGroupItem } from '@/services/customers.service'

definePageMeta({ layout: 'default' })

const appTitle = useAppTitle()
useHead({ title: `Thêm bảng giá - ${appTitle}` })

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { user } = useAuthService()

// type from query: 'branch' | 'customer-group'
const type = computed(() => (route.query.type as string) || 'customer-group')

// Simple form state (UI only)
const form = reactive({
  name: '',
  adjustment: '' as '' | 'increase' | 'decrease',
  adjustmentValue: 0 as number,
  autoAddNewProducts: false,
  customerGroupIds: [] as Record<string, unknown>[],
  branchIds: [] as Record<string, unknown>[]
})

const isSubmitting = ref(false)
const nameTouched = ref(false)
const isNameInvalid = computed(() => nameTouched.value && form.name.trim().length === 0)
const canSubmit = computed(() => {
  if (form.name.trim().length === 0) return false
  if (type.value === 'customer-group') return form.customerGroupIds.length > 0
  if (type.value === 'branch') return form.branchIds.length > 0
  return true
})

function onCancel() {
  router.push('/pricebooks')
}

async function onSave(draft = false) {
  if (!canSubmit.value) {
    nameTouched.value = true
    toast.add({ title: 'Thiếu thông tin', description: 'Vui lòng nhập Tên bảng giá và chọn đối tượng áp dụng', color: 'error' })
    return
  }
  isSubmitting.value = true
  try {
    // Build payload per API contract
    const now = new Date()
    const oneYear = new Date(now.getTime())
    oneYear.setFullYear(now.getFullYear() + 1)

    const warehouseIds = form.branchIds
      .map(it => Number((it as { id: number | string }).id))
      .filter(n => Number.isFinite(n))
    const customerGroupIds = form.customerGroupIds
      .map(it => Number((it as { id: number | string }).id))
      .filter(n => Number.isFinite(n))

    const currentUserId: string | null = (() => {
      type MaybeUser = { id?: string | number, sub?: string | number, userId?: string | number } | null | undefined
      const u = (user?.value as MaybeUser) || null
      if (!u) return null
      if (u.id != null) return String(u.id)
      if (u.sub != null) return String(u.sub)
      if (u.userId != null) return String(u.userId)
      return null
    })()

    const signedPercent = form.adjustment === 'decrease'
      ? -Math.abs(Number(form.adjustmentValue || 0))
      : Math.abs(Number(form.adjustmentValue || 0))

    const payload = {
      code: '',
      name: form.name.trim(),
      status: draft ? 0 : 1, // 0: draft, 1: active (assumption)
      startOn: now.toISOString(),
      endOn: oneYear.toISOString(),
      currency: 'VND',
      warehouseIds: type.value === 'branch' ? warehouseIds : [],
      customerGroupIds: type.value === 'customer-group' ? customerGroupIds : [],
      channelIds: [],
      creatorUserId: currentUserId || '',
      allowItemsNotInBook: true,
      warnItemsNotInBook: true,
      restrictItemsToBook: false,
      priceFormulaJson: '',
      priceFormulaDescription: form.adjustment === ''
        ? ''
        : (form.adjustment === 'increase'
            ? `Tăng giá ${Math.abs(Number(form.adjustmentValue || 0))}%`
            : `Giảm giá ${Math.abs(Number(form.adjustmentValue || 0))}%`),
      defaultAdjustmentPercent: form.adjustment === '' ? 0 : signedPercent,
      adjustmentMode: (form.adjustment || 'increase') as 'increase' | 'decrease'
    }

    const res = await priceBooksService.createPriceBook(payload)
    if (!res?.success) {
      throw new Error(res?.message || 'Tạo bảng giá thất bại')
    }

    toast.add({ title: 'Đã lưu', description: draft ? 'Lưu nháp thành công' : 'Lưu và áp dụng thành công', color: 'success' })
    router.push('/pricebooks')
  } finally {
    isSubmitting.value = false
  }
}

// Adjustment options (percent only): Increase(+) or Decrease(-)
const adjustmentItems = [
  { label: 'Tăng giá (%)', value: 'increase' },
  { label: 'Giảm giá (%)', value: 'decrease' }
]
// Remote sources for selects
const fetchCustomerGroups = async (q: string) => {
  try {
    const res = await customersService.getCustomerGroupsExternal()
    const list = (res?.data || []) as CustomerGroupItem[]
    const s = q.trim().toLowerCase()
    const arr = !s ? list : list.filter(x => x.name?.toLowerCase().includes(s))
    return arr as unknown as Record<string, unknown>[]
  } catch (e) {
    console.error('Load customer groups failed:', e)
    return [] as unknown as Record<string, unknown>[]
  }
}
const fetchBranches = async (q: string) => {
  try {
    const res = await warehouseService.getWarehouses()
    const list = (res?.data || []) as Array<{ id: number, name: string }>
    const s = q.trim().toLowerCase()
    const arr = !s ? list : list.filter(x => x.name?.toLowerCase().includes(s))
    return arr as unknown as Record<string, unknown>[]
  } catch (e) {
    console.error('Load warehouses failed:', e)
    return [] as unknown as Record<string, unknown>[]
  }
}

// Adjustment options via RemoteSearchSelect
const fetchAdjustmentOptions = async (q: string) => {
  const s = q.trim().toLowerCase()
  return !s ? adjustmentItems : adjustmentItems.filter(x => x.label.toLowerCase().includes(s))
}
const adjustmentModel = computed({
  get: () => adjustmentItems.find(o => o.value === form.adjustment) || null,
  set: (v: Record<string, unknown> | null) => {
    const val = v && typeof (v as Record<string, unknown>).value === 'string' ? (v as Record<string, unknown>).value as string : ''
    form.adjustment = (val as '' | 'increase' | 'decrease')
  }
})

function removeCustomerGroup(id: string) {
  form.customerGroupIds = form.customerGroupIds.filter(it => String((it as Record<string, unknown>).id) !== id)
}
function removeBranch(id: string) {
  form.branchIds = form.branchIds.filter(it => String((it as Record<string, unknown>).id) !== id)
}
</script>

<template>
  <UDashboardPanel id="pricebook-create">
    <template #header>
      <UDashboardNavbar title="Thêm bảng giá">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <UButton
              label="Hủy"
              variant="ghost"
              color="neutral"
              @click="onCancel"
            />
            <UButton
              label="Lưu nháp"
              color="neutral"
              variant="soft"
              :loading="isSubmitting"
              @click="() => onSave(true)"
            />
            <UButton
              label="Lưu & Áp dụng"
              :loading="isSubmitting"
              @click="() => onSave(false)"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full max-w-6xl mx-auto px-4 lg:px-6">
        <div class="flex flex-col gap-6">
          <!-- Thông tin bảng giá -->
          <UPageCard title="Thông tin bảng giá" variant="soft" class="bg-white rounded-lg">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Tên bảng giá <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.name"
                  type="text"
                  placeholder="Nhập tên bảng giá"
                  :class="[
                    'w-full px-3 h-9 text-sm rounded-md border focus:outline-none focus:ring-2',
                    isNameInvalid ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
                  ]"
                  :aria-invalid="isNameInvalid"
                  @blur="nameTouched = true"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Điều chỉnh giá</label>
                <div class="flex items-center gap-3">
                  <RemoteSearchSelect
                    v-model="adjustmentModel"
                    :fetch-fn="fetchAdjustmentOptions"
                    label-field="label"
                    :multiple="false"
                    :clearable="false"
                    :full-width="false"
                    :auto-width="false"
                    trigger-class="w-120"
                    placeholder="Chọn điều chỉnh giá"
                  />
                  <input
                    v-if="form.adjustment !== ''"
                    v-model.number="form.adjustmentValue"
                    type="number"
                    min="0"
                    max="100"
                    class="w-24 px-3 h-9 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-center"
                  >
                </div>
                <p v-if="form.adjustment !== ''" class="text-sm text-gray-500 mt-2">
                  Sản phẩm được thêm vào sẽ áp dụng chính sách
                  {{ form.adjustment === 'increase' ? ` tăng giá ${form.adjustmentValue || 0}%` : ` giảm giá ${form.adjustmentValue || 0}%` }}
                </p>
              </div>

              <div class="pt-2">
                <label class="inline-flex items-start gap-3">
                  <UCheckbox v-model="form.autoAddNewProducts" />
                  <div>
                    <div class="text-sm text-gray-900">Tự động thêm sản phẩm mới vào bảng giá</div>
                    <div class="text-xs text-gray-500">Sản phẩm sau khi được tạo ở danh sách sản phẩm sẽ được tự động thêm vào bảng giá</div>
                  </div>
                </label>
              </div>
            </div>
          </UPageCard>

          <!-- Áp dụng cho nhóm khách hàng -->
          <UPageCard
            v-if="type === 'customer-group'"
            title="Áp dụng cho nhóm khách hàng"
            variant="soft"
            class="bg-white rounded-lg"
          >
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">Chọn nhóm khách hàng</label>
              <RemoteSearchSelect
                v-model="form.customerGroupIds"
                :fetch-fn="fetchCustomerGroups"
                label-field="name"
                :multiple="true"
                :clearable="true"
                placeholder="Chọn nhóm khách hàng"
              />
              <div v-if="form.customerGroupIds.length" class="flex flex-wrap gap-3 pt-1">
                <span
                  v-for="cg in form.customerGroupIds"
                  :key="(cg as any).id"
                  class="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-primary-50 text-primary-700"
                >
                  {{ (cg as any).name }}
                  <button
                    type="button"
                    class="ml-2 text-primary-600 hover:text-primary-800"
                    @click="removeCustomerGroup((cg as any).id)"
                  >
                    ×
                  </button>
                </span>
              </div>
            </div>
          </UPageCard>

          <UPageCard
            v-if="type === 'branch'"
            title="Áp dụng cho chi nhánh"
            variant="soft"
            class="bg-white rounded-lg"
          >
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">Chọn chi nhánh</label>
              <RemoteSearchSelect
                v-model="form.branchIds"
                :fetch-fn="fetchBranches"
                label-field="name"
                :multiple="true"
                :clearable="true"
                placeholder="Chọn chi nhánh"
              />
              <div v-if="form.branchIds.length" class="flex flex-wrap gap-3 pt-1">
                <span
                  v-for="br in form.branchIds"
                  :key="(br as any).id"
                  class="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-primary-50 text-primary-700"
                >
                  {{ (br as any).name }}
                  <button
                    type="button"
                    class="ml-2 text-primary-600 hover:text-primary-800"
                    @click="removeBranch((br as any).id)"
                  >
                    ×
                  </button>
                </span>
              </div>
            </div>
          </UPageCard>

          <!-- Bottom actions -->
          <div class="flex items-center gap-2 self-end">
            <UButton
              label="Lưu nháp"
              color="neutral"
              variant="soft"
              :loading="isSubmitting"
              @click="() => onSave(true)"
            />
            <UButton
              label="Lưu & Áp dụng"
              :loading="isSubmitting"
              @click="() => onSave(false)"
            />
          </div>

          <div class="text-center text-sm text-gray-500 py-4">
            Tìm hiểu thêm về
            <NuxtLink to="/pricebooks" class="text-primary-600 hover:underline">bảng giá</NuxtLink>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
</style>
