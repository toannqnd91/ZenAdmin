<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue'

const props = defineProps({
  open: Boolean,
  title: {
    type: String,
    default: 'Thêm liên kết'
  },
  initialName: {
    type: String,
    default: ''
  },
  initialType: {
    type: String,
    default: 'Trang chủ'
  },
  linkTypeOptions: {
    type: Array,
    default: () => [
      { label: 'Trang chủ', value: 'Trang chủ' },
      { label: 'Danh mục sản phẩm', value: 'Danh mục sản phẩm' },
      { label: 'Sản phẩm', value: 'Sản phẩm' },
      { label: 'Tất cả sản phẩm', value: 'Tất cả sản phẩm' },
      { label: 'Trang nội dung', value: 'Trang nội dung' },
      { label: 'Danh mục bài viết', value: 'Danh mục bài viết' },
      { label: 'Trang tìm kiếm', value: 'Trang tìm kiếm' },
      { label: 'Địa chỉ web', value: 'Địa chỉ web' }
    ]
  }
})

const emit = defineEmits(['update:open', 'submit'])

const modalOpen = ref(props.open)
const linkName = ref(props.initialName)
const linkType = ref(props.initialType)

watch(() => props.open, (val) => {
  modalOpen.value = val
})
watch(() => props.initialName, (val) => {
  linkName.value = val
})
watch(() => props.initialType, (val) => {
  linkType.value = val
})

const closeModal = () => {
  emit('update:open', false)
}

const handleSubmit = () => {
  if (!linkName.value.trim()) return
  emit('submit', {
    name: linkName.value,
    type: linkType.value
  })
  closeModal()
}
</script>

<template>
  <UModal
    v-model:open="modalOpen"
    :title="title"
    :ui="{ footer: 'justify-end' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">
            Tên<span class="text-red-500">*</span>
          </label>
          <UInput
            v-model="linkName"
            placeholder="Nhập tên liên kết"
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Liên kết</label>
          <USelect
            v-model="linkType"
            :items="linkTypeOptions"
            class="w-1/2"
          />
        </div>
      </div>
    </template>
    <template #footer="{ close }">
      <UButton
        label="Hủy"
        color="neutral"
        variant="outline"
        @click="closeModal"
      />
      <UButton
        label="Hoàn thành"
        color="primary"
        :disabled="!linkName.trim() || !linkType"
        @click="handleSubmit"
      />
    </template>
  </UModal>
</template>
