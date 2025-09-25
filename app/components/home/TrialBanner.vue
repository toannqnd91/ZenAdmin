<script setup lang="ts">
interface Props {
  daysLeft: number
}
const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'activate'): void }>()

const daysText = computed(() => {
  const d = props.daysLeft
  if (d <= 0) return 'Hôm nay là ngày cuối cùng dùng thử, vui lòng kích hoạt để không bị gián đoạn.'
  if (d === 1) return 'Bạn còn 01 ngày dùng thử miễn phí, kích hoạt gói để tiếp tục sử dụng dịch vụ.'
  return `Bạn còn ${String(d).padStart(2, '0')} ngày dùng thử miễn phí, kích hoạt gói để tiếp tục sử dụng dịch vụ.`
})
</script>

<template>
  <div class="w-full bg-[rgb(204,231,255)] border border-[rgba(27,100,242,0.15)] rounded-lg px-4 md:px-5 py-3 flex flex-col md:flex-row md:items-center gap-4">
    <div class="flex items-start gap-3 flex-1">
      <div class="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold shadow-inner">
        <slot name="avatar">
          <svg
            viewBox="0 0 24 24"
            class="w-7 h-7"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </slot>
      </div>
      <div class="space-y-1">
        <p class="text-sm md:text-base font-medium text-gray-800">
          {{ daysText }}
        </p>
        <p class="text-xs md:text-sm text-gray-600 flex flex-wrap items-center gap-2">
          Liên hệ tư vấn:
          <span class="font-semibold">CSKH</span>
          <span class="inline-flex items-center gap-1 text-green-600">
            <UIcon name="i-logos-whatsapp-icon" class="w-4 h-4" />
            0947708288
          </span>
          <span class="inline-flex items-center gap-1 text-blue-600 ml-6">
            <UIcon name="i-simple-icons-messenger" class="w-4 h-4" />
            Messenger
          </span>
        </p>
      </div>
    </div>
    <div class="flex md:justify-end">
      <UButton color="primary" class="font-medium shadow-sm" @click="emit('activate')">
        Kích hoạt gói dịch vụ
      </UButton>
    </div>
  </div>
</template>
