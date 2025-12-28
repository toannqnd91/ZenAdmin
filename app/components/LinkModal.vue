<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { menuTypeService, type MenuType } from '@/services/menu-type.service'
import { productService, newsService } from '@/services'
import BaseModal from '@/components/base/BaseModal.vue'

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
  },
  initialEntityId: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['update:open', 'submit'])

const modalOpen = ref(props.open)
const linkName = ref(props.initialName)
const linkTypeId = ref(props.initialTypeId)
const entityValue = ref(props.initialEntityId !== null && props.initialEntityId !== undefined ? String(props.initialEntityId) : '')
const menuTypes = ref<MenuType[]>([])
const loadingMenuTypes = ref(false)
const entityOptions = ref<any[]>([])
const loadingEntityOptions = ref(false)

watch(() => props.open, (val) => {
  modalOpen.value = val
})
watch(() => props.initialName, (val) => {
  linkName.value = val
})
watch(() => props.initialTypeId, (val) => {
  linkTypeId.value = val
})
watch(() => props.initialEntityId, (val) => {
  entityValue.value = val !== null && val !== undefined ? String(val) : ''
})

// Computed: selected menu type
const selectedMenuType = computed(() => {
  return menuTypes.value.find(t => t.id === Number(linkTypeId.value))
})

// Computed: check if entity field should be dropdown
const isEntityDropdown = computed(() => {
  const entity = selectedMenuType.value?.entity
  return entity && entity !== null && entity !== ''
})

// Function to load entity options based on type
const loadOptions = async () => {
  if (!linkTypeId.value) return

  const type = menuTypes.value.find(t => t.id === Number(linkTypeId.value))

  // If menuTypes not loaded yet, or type not found
  if (!type) return

  // If type has no entity (Text input mode)
  if (!type.entity) {
    entityOptions.value = []
    // Only reset if the current value does NOT match the initial value passed in props.
    if (String(entityValue.value) !== String(props.initialEntityId)) {
      entityValue.value = ''
    }
    return
  }

  // Load options based on entity type
  loadingEntityOptions.value = true
  try {
    switch (type.entity.toLowerCase()) {
      case 'product':
      case 'productcategory':
        const productsResponse = await productService.getProducts({
          pagination: { start: 0, number: 100 }
        })
        if (productsResponse.success && productsResponse.data) {
          entityOptions.value = productsResponse.data.items.map((p: any) => ({
            id: p.id,
            name: p.name,
            url: p.slug ? `/san-pham/${p.slug}` : (p.url || '')
          }))
        }
        break

      case 'news':
        const newsResponse = await newsService.getNews({
          pagination: { start: 0, number: 100 }
        })
        if (newsResponse?.success && newsResponse.data) {
          entityOptions.value = newsResponse.data.items.map((n: any) => ({
            id: n.id,
            name: n.title,
            // Extract slug from URL to avoid double prefixing by backend
            url: n.url ? n.url.split('/').pop() : ''
          }))
        }
        break

      case 'newscategory':
        const newsCatResponse = await newsService.getCategories()
        if (newsCatResponse?.success && newsCatResponse.data) {
          // Recursive flatten function for categories
          const flattenCats = (items: any[], level = 0): any[] => {
            let result: any[] = []
            items.forEach(c => {
              result.push({
                id: c.id,
                name: (level > 0 ? '-- '.repeat(level) : '') + c.name, // Add visual indentation
                // Extract slug from URL for categories as well
                url: c.url ? c.url.split('/').pop() : (c.slug ? c.slug : '')
              })
              if (c.categories && c.categories.length > 0) {
                result = result.concat(flattenCats(c.categories, level + 1))
              }
            })
            return result
          }

          const cats = Array.isArray(newsCatResponse.data) ? newsCatResponse.data : []
          entityOptions.value = flattenCats(cats)
        }
        break

      default:
        entityOptions.value = []
    }
  } catch (e) {
    console.error('Error loading entity options:', e)
    entityOptions.value = []
  } finally {
    loadingEntityOptions.value = false

    // Fallback: If current entityValue (ID) doesn't match any option, try to find a match by URL/Slug
    // This handles cases where entityId might be 0/missing but URL is correct.
    if (entityOptions.value.length > 0 && entityValue.value) {
      const currentVal = String(entityValue.value)
      // Check if current value exists as an ID in options
      const exactMatch = entityOptions.value.some(o => String(o.id) === currentVal)

      if (!exactMatch) {
        // Try matching by URL slug (assuming entityValue might be a full URL like 'category/slug')
        const slugMatch = entityOptions.value.find(o => o.url && currentVal.endsWith(o.url))
        if (slugMatch) {
          entityValue.value = String(slugMatch.id)
        }
      }
    }
  }
}

// Watch linkTypeId changes
watch(linkTypeId, () => {
  loadOptions()
})

const fetchMenuTypes = async () => {
  loadingMenuTypes.value = true
  try {
    menuTypes.value = await menuTypeService.getMenuTypes()
    // Set default if not set
    if (!linkTypeId.value && menuTypes.value.length > 0) {
      linkTypeId.value = menuTypes.value[0].id
    }
    // Try loading options after types are loaded
    await loadOptions()
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

  // Find selected entity option to get URL
  let entityUrl = ''
  if (entityValue.value) {
    const selectedOption = entityOptions.value.find(o => o.id == entityValue.value)
    if (selectedOption) {
      entityUrl = selectedOption.url
    } else if (!isEntityDropdown.value) {
      // If it's a text input (Address web), the value itself is the URL
      entityUrl = String(entityValue.value)
    }
  }

  emit('submit', {
    name: linkName.value,
    typeId: linkTypeId.value,
    typeName: selectedType?.name || '',
    typeEntity: entityValue.value || null,
    typeEntityUrl: entityUrl
  })
  closeModal()
}
</script>

<template>
  <BaseModal v-model="modalOpen" :title="title" width-class="max-w-2xl"
    @update:model-value="emit('update:open', $event)">
    <div class="space-y-4 py-2">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tên<span class="text-red-500">*</span>
        </label>
        <input v-model="linkName" type="text" placeholder="Nhập tên liên kết"
          class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>

      <div class="flex gap-4">
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Loại liên kết</label>
          <select v-model="linkTypeId"
            class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            :disabled="loadingMenuTypes">
            <option v-if="loadingMenuTypes" disabled>Đang tải...</option>
            <option v-for="t in menuTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>

        <div class="flex-1">
          <!-- Show input if entity is null/empty (e.g., "Địa chỉ web") -->
          <div v-if="!isEntityDropdown">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL</label>
            <input v-model="entityValue" type="text" placeholder="Nhập URL"
              class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          <!-- Show dropdown if entity has value (e.g., "Product", "NewsCategory") -->
          <div v-else>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ selectedMenuType?.name }}
            </label>
            <select v-model="entityValue"
              class="w-full px-3 h-9 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              :disabled="loadingEntityOptions">
              <option value="">-- Chọn --</option>
              <option v-if="loadingEntityOptions" disabled>Đang tải...</option>
              <option v-for="opt in entityOptions" :key="opt.id" :value="String(opt.id)">{{ opt.name }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3 w-full">
        <button type="button"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          @click="closeModal">
          Hủy
        </button>
        <button type="button"
          class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!linkName.trim() || !linkTypeId" @click="handleSubmit">
          Hoàn thành
        </button>
      </div>
    </template>
  </BaseModal>
</template>
