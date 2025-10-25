<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'

interface ContactInfo {
  phone?: string | null
  email?: string | null
  address?: string | null
}

interface Props {
  modelValue?: boolean
  contact?: ContactInfo
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  contact: () => ({ phone: null, email: null, address: null })
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', value: ContactInfo): void
}>()

const open = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

const form = ref<ContactInfo>({ phone: null, email: null, address: null })

watch(() => props.modelValue, (v) => {
  if (v) {
    // Reset form each time modal opens
    form.value = {
      phone: props.contact?.phone ?? null,
      email: props.contact?.email ?? null,
      address: props.contact?.address ?? null
    }
  }
})

function onSave() {
  emit('save', { ...form.value })
  open.value = false
}
</script>

<template>
  <BaseModal v-model="open" title="Sửa thông tin liên hệ" width-class="max-w-lg">
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
        <input
          v-model="form.phone"
          type="text"
          class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Nhập số điện thoại"
        >
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          v-model="form.email"
          type="email"
          class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Nhập email"
        >
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
        <input
          v-model="form.address"
          type="text"
          class="w-full px-3 h-[36px] text-sm rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Nhập địa chỉ"
        >
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="h-9 px-4 rounded-md border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50"
        @click="open = false"
      >
        Hủy
      </button>
      <button
        type="button"
        class="h-9 px-4 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
        @click="onSave"
      >
        Lưu
      </button>
    </template>
  </BaseModal>
</template>
