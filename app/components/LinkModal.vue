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
  <UModal v-model:open="modalOpen" :title="title" :ui="{ footer: 'justify-end' }"
    @update:open="emit('update:open', $event)">
    <template #body>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tên<span class="text-red-500">*</span>
          </label>
          <input v-model="linkName" type="text" placeholder="Nhập tên liên kết"
            class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Loại liên kết</label>
          <select v-model="linkTypeId"
            class="w-1/2 px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            :disabled="loadingMenuTypes">
            <option v-if="loadingMenuTypes" disabled>Đang tải...</option>
            <option v-for="t in menuTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>
      </div>
    </template>
    <template #footer="{ close }">
      <UButton label="Hủy" color="neutral" variant="outline" @click="closeModal" />
      <UButton label="Hoàn thành" color="primary" :disabled="!linkName.trim() || !linkTypeId" @click="handleSubmit" />
    </template>
  </UModal>
</template>
