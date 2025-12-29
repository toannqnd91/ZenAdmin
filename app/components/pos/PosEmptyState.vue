<template>
    <div class="flex-1 flex flex-col items-center justify-center text-slate-400 bg-white">
        <div class="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
            <slot name="icon">
                <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </slot>
        </div>
        <p class="font-medium text-slate-500 text-lg">{{ message }}</p>
        <p v-if="subMessage" class="text-sm text-slate-400 mt-2">{{ subMessage }}</p>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    message: string
    subMessage?: string
}>()
</script>
