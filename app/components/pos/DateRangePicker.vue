<template>
    <div class="relative w-full" ref="pickerContainer">
        <!-- Date Range Input -->
        <div @click="togglePicker" ref="triggerElement"
            class="w-full h-9 flex items-center gap-2 px-3 rounded-lg border border-slate-200 bg-white cursor-pointer hover:border-blue-400 transition-colors"
            :class="isOpen ? 'border-blue-500 ring-2 ring-blue-100' : ''">
            <input :value="formatDate(startDate)" readonly placeholder="dd/mm/yyyy"
                class="flex-1 min-w-0 text-xs outline-none bg-transparent cursor-pointer text-center" />
            <svg class="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <input :value="formatDate(endDate)" readonly placeholder="dd/mm/yyyy"
                class="flex-1 min-w-0 text-xs outline-none bg-transparent cursor-pointer text-center" />
            <svg class="w-5 h-5 text-slate-500 flex-shrink-0 ml-1" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        </div>

        <!-- Calendar Popup (Teleported to body) -->
        <Teleport to="body">
            <div v-if="isOpen" ref="popupRef" @click.stop
                class="fixed bg-white rounded-lg shadow-xl border border-slate-200 z-50 p-4" :style="popupStyle">
                <div class="flex gap-3">
                    <!-- Left Month -->
                    <div class="flex-1">
                        <div class="flex items-center justify-between mb-4">
                            <button @click.stop="previousYear" class="p-1 hover:bg-slate-100 rounded">
                                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                </svg>
                            </button>
                            <button @click.stop="previousMonth" class="p-1 hover:bg-slate-100 rounded">
                                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div class="font-semibold text-sm">Th{{ leftMonth.month }} {{ leftMonth.year }}</div>
                            <div class="w-5"></div>
                            <div class="w-5"></div>
                        </div>
                        <CalendarMonth :year="leftMonth.year" :month="leftMonth.month" :start-date="startDate"
                            :end-date="endDate" :hover-date="hoverDate" :is-selecting="isSelecting"
                            @select-date="selectDate" @hover-date="onHoverDate" />
                    </div>

                    <!-- Right Month -->
                    <div class="flex-1">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-5"></div>
                            <div class="w-5"></div>
                            <div class="font-semibold text-sm">Th{{ rightMonth.month }} {{ rightMonth.year }}</div>
                            <button @click.stop="nextMonth" class="p-1 hover:bg-slate-100 rounded">
                                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                            <button @click.stop="nextYear" class="p-1 hover:bg-slate-100 rounded">
                                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                        <CalendarMonth :year="rightMonth.year" :month="rightMonth.month" :start-date="startDate"
                            :end-date="endDate" :hover-date="hoverDate" :is-selecting="isSelecting"
                            @select-date="selectDate" @hover-date="onHoverDate" />
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import CalendarMonth from './CalendarMonth.vue'

interface Props {
    startDate?: Date | null
    endDate?: Date | null
}

const props = withDefaults(defineProps<Props>(), {
    startDate: null,
    endDate: null
})

const emit = defineEmits<{
    'update:startDate': [date: Date | null]
    'update:endDate': [date: Date | null]
}>()

const pickerContainer = ref<HTMLElement>()
const triggerElement = ref<HTMLElement>()
const popupRef = ref<HTMLElement>()
const isOpen = ref(false)
const hoverDate = ref<Date | null>(null)
const isSelecting = ref(false)
const currentDate = new Date()
const viewYear = ref(currentDate.getFullYear())
const viewMonth = ref(currentDate.getMonth() + 1)

const popupStyle = ref({
    top: '0px',
    left: '0px',
    width: '560px'
})

const leftMonth = computed(() => ({
    year: viewYear.value,
    month: viewMonth.value
}))

const rightMonth = computed(() => {
    let month = viewMonth.value + 1
    let year = viewYear.value
    if (month > 12) {
        month = 1
        year++
    }
    return { year, month }
})

function updatePopupPosition() {
    if (triggerElement.value) {
        const rect = triggerElement.value.getBoundingClientRect()
        popupStyle.value = {
            top: `${rect.bottom + 8}px`,
            left: `${rect.left}px`,
            width: '560px'
        }
    }
}

function togglePicker() {
    isOpen.value = !isOpen.value
    if (isOpen.value) {
        updatePopupPosition()
    } else {
        hoverDate.value = null
        isSelecting.value = false
    }
}

watch(isOpen, (newVal) => {
    if (newVal) {
        updatePopupPosition()
    }
})

function previousMonth() {
    viewMonth.value--
    if (viewMonth.value < 1) {
        viewMonth.value = 12
        viewYear.value--
    }
}

function nextMonth() {
    viewMonth.value++
    if (viewMonth.value > 12) {
        viewMonth.value = 1
        viewYear.value++
    }
}

function previousYear() {
    viewYear.value--
}

function nextYear() {
    viewYear.value++
}

function selectDate(date: Date) {
    if (!props.startDate || (props.startDate && props.endDate)) {
        emit('update:startDate', date)
        emit('update:endDate', null)
        isSelecting.value = true
    } else {
        if (date < props.startDate) {
            emit('update:endDate', props.startDate)
            emit('update:startDate', date)
        } else {
            emit('update:endDate', date)
        }
        isSelecting.value = false
        setTimeout(() => {
            isOpen.value = false
        }, 200)
    }
}

function onHoverDate(date: Date | null) {
    if (isSelecting.value) {
        hoverDate.value = date
    }
}

function formatDate(date: Date | null): string {
    if (!date) return ''
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
}

function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement
    const isInsidePicker = pickerContainer.value && pickerContainer.value.contains(target)
    const isInsidePopup = popupRef.value && popupRef.value.contains(target)

    if (!isInsidePicker && !isInsidePopup) {
        isOpen.value = false
        isSelecting.value = false
        hoverDate.value = null
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
    window.addEventListener('scroll', updatePopupPosition, true)
    window.addEventListener('resize', updatePopupPosition)
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
    window.removeEventListener('scroll', updatePopupPosition, true)
    window.removeEventListener('resize', updatePopupPosition)
})
</script>
