<script setup lang="ts">
import BaseModal from '@/components/base/BaseModal.vue'

const router = useRouter()

interface Props {
  modelValue?: boolean
}

const props = withDefaults(defineProps<Props>(), { modelValue: false })
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', value: 'branch' | 'customer-group'): void
}>()

const open = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

function pick(type: 'branch' | 'customer-group') {
  emit('select', type)
  // Navigate immediately to the create page with type param
  router.push({ path: '/pricebooks/create', query: { type } })
  open.value = false
}
</script>

<template>
  <BaseModal v-model="open" title="Tạo bảng giá" width-class="max-w-3xl">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <NuxtLink
        :to="{ path: '/pricebooks/create', query: { type: 'branch' } }"
        class="text-left w-full rounded-xl border border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm transition p-5 flex items-start gap-4"
        @click="pick('branch')"
      >
        <div class="size-11 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
          <UIcon name="i-lucide-home" class="text-primary-600 size-5" />
        </div>
        <div>
          <div class="text-[16px] font-semibold text-gray-900">
            Quản lý theo chi nhánh
          </div>
          <p class="text-sm text-gray-600 mt-1">
            Tạo bảng giá cho một hoặc nhiều chi nhánh cửa hàng
          </p>
        </div>
      </NuxtLink>

      <NuxtLink
        :to="{ path: '/pricebooks/create', query: { type: 'customer-group' } }"
        class="text-left w-full rounded-xl border border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm transition p-5 flex items-start gap-4"
        @click="pick('customer-group')"
      >
        <div class="size-11 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
          <UIcon name="i-lucide-users" class="text-primary-600 size-5" />
        </div>
        <div>
          <div class="text-[16px] font-semibold text-gray-900">
            Quản lý theo nhóm khách hàng
          </div>
          <p class="text-sm text-gray-600 mt-1">
            Tạo bảng giá cho các nhóm khách hàng (bán buôn, cộng tác viên,...)
          </p>
        </div>
      </NuxtLink>
    </div>

    <template #footer>
      <button
        type="button"
        class="h-9 px-4 rounded-md border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50"
        @click="open = false"
      >
        Hủy
      </button>
    </template>
  </BaseModal>
</template>
