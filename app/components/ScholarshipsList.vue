<script setup lang="ts">
import type { Scholarship } from '~/types'

const props = defineProps<{
  scholarships: Scholarship[]
  modelValue: number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()
</script>

<template>
  <ul role="list" class="divide-y divide-default">
    <li
        v-for="scholarship in scholarships"
        :key="scholarship.id"
        class="flex items-center justify-between gap-3 py-3 cursor-pointer"
        @click="emit('update:modelValue', scholarship.id)"
        >
      <div class="flex items-center gap-3 min-w-0">
        <input
          type="radio"
          :checked="props.modelValue === scholarship.id"
          @change="emit('update:modelValue', scholarship.id)"
          class="accent-primary-600"
        />
        <div class="text-sm min-w-0">
          <div class="font-semibold truncate">
            {{ scholarship.code }} - {{ scholarship.name }} 
            <UModal 
            :title="scholarship.name" 
            :ui="{ width: 'max-w-5xl' }"
            >
                <UButton
                    label="(xem thêm)"
                    :color="props.modelValue === scholarship.id ? 'primary' : 'neutral'"
                    variant="link"
                    size="xs"
                    class="p-0 border-0 shadow-none"
                    />
                <template #body>
                    <div v-html="scholarship.description"></div>
                </template>
            </UModal>
          </div>
          <div class="text-xs text-gray-500 truncate" v-if="scholarship.description">
            <!-- {{ scholarship.description }} -->
          </div>
        </div>
      </div>
    </li>
  </ul>
</template>