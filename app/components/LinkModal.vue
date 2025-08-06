<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, onMounted } from 'vue'
import { menuTypeService, type MenuType } from '@/services/menu-type.service'

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
  initialTypeId: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['update:open', 'submit'])

const modalOpen = ref(props.open)
const linkName = ref(props.initialName)
const linkTypeId = ref(props.initialTypeId)
const menuTypes = ref<MenuType[]>([])
const loadingMenuTypes = ref(false)

watch(() => props.open, (val) => {
  modalOpen.value = val
})
watch(() => props.initialName, (val) => {
  linkName.value = val
})
watch(() => props.initialTypeId, (val) => {
  linkTypeId.value = val
})

const fetchMenuTypes = async () => {
  loadingMenuTypes.value = true
  try {
    menuTypes.value = await menuTypeService.getMenuTypes()
    // Set default if not set
    if (!linkTypeId.value && menuTypes.value.length > 0) {
      linkTypeId.value = menuTypes.value[0].id
    }
  } catch (e) {
    // handle error if needed
  } finally {
    loadingMenuTypes.value = false
  }
}

onMounted(fetchMenuTypes)

const closeModal = () => {
  emit('update:open', false)
}

const handleSubmit = () => {
  if (!linkName.value.trim() || !linkTypeId.value) return
  const selectedType = menuTypes.value.find(t => t.id === Number(linkTypeId.value))
  emit('submit', {
    name: linkName.value,
    typeId: linkTypeId.value,
    typeName: selectedType?.name || '',
    typeEntity: selectedType?.entity || null
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
          <label class="block text-sm font-medium mb-1">Loại liên kết</label>
          <USelect
            v-model="linkTypeId"
            :items="menuTypes.map(t => ({ label: t.name, value: t.id }))"
            class="w-1/2"
            :loading="loadingMenuTypes"
            :disabled="loadingMenuTypes"
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
        :disabled="!linkName.trim() || !linkTypeId"
        @click="handleSubmit"
      />
    </template>
  </UModal>
</template>
