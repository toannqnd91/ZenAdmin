<template>
    <div class="flex flex-col bg-white border-r border-slate-200 h-full flex-shrink-0">
        <!-- Header Section -->
        <div v-if="$slots.header">
            <slot name="header"></slot>
        </div>

        <!-- Scrollable List -->
        <div class="flex-1 overflow-y-auto relative">
            <slot></slot>

            <!-- Empty State Helper -->
            <div v-if="$slots.empty"
                class="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <slot name="empty"></slot>
            </div>
        </div>

        <!-- Footer Section -->
        <div v-if="$slots.footer" class="border-t border-slate-200 bg-white">
            <slot name="footer"></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
// Generic Sidebar Container for POS Modules
</script>
