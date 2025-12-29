<template>
    <div class="p-4 border-b border-slate-100 cursor-pointer transition-all relative group" :class="[
        active
            ? 'bg-blue-50 border-l-4 border-l-blue-600'
            : 'hover:bg-slate-50 border-l-4 border-l-transparent'
    ]" @click="$emit('click')">
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    active?: boolean
}>()

defineEmits(['click'])
</script>
