<template>
    <div class="calendar-month">
        <!-- Weekday Headers -->
        <div class="grid grid-cols-7 gap-1 mb-2">
            <div v-for="day in weekdays" :key="day" class="text-center text-xs font-medium text-slate-600 py-1">
                {{ day }}
            </div>
        </div>

        <!-- Calendar Days -->
        <div class="grid grid-cols-7 gap-1">
            <button v-for="day in calendarDays" :key="`${day.date?.getTime()}`"
                @click.stop="day.date && selectDate(day.date)"
                @mouseenter="day.date && day.isCurrentMonth && onHover(day.date)" @mouseleave="onHover(null)"
                :disabled="!day.isCurrentMonth"
                class="aspect-square flex items-center justify-center text-xs rounded transition-colors"
                :class="getDayClass(day)">
                {{ day.day }}
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    year: number
    month: number
    startDate?: Date | null
    endDate?: Date | null
    hoverDate?: Date | null
    isSelecting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    isSelecting: false
})

const emit = defineEmits<{
    'select-date': [date: Date]
    'hover-date': [date: Date | null]
}>()

const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

interface CalendarDay {
    day: number
    date: Date | null
    isCurrentMonth: boolean
}

const calendarDays = computed<CalendarDay[]>(() => {
    const days: CalendarDay[] = []
    const firstDay = new Date(props.year, props.month - 1, 1)
    const lastDay = new Date(props.year, props.month, 0)

    let startDayOfWeek = firstDay.getDay()
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1

    const prevMonthLastDay = new Date(props.year, props.month - 1, 0).getDate()
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
        days.push({
            day: prevMonthLastDay - i,
            date: new Date(props.year, props.month - 2, prevMonthLastDay - i),
            isCurrentMonth: false
        })
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
        days.push({
            day: i,
            date: new Date(props.year, props.month - 1, i),
            isCurrentMonth: true
        })
    }

    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
        days.push({
            day: i,
            date: new Date(props.year, props.month, i),
            isCurrentMonth: false
        })
    }

    return days
})

function selectDate(date: Date) {
    emit('select-date', date)
}

function onHover(date: Date | null) {
    emit('hover-date', date)
}

function isSameDay(date1: Date | null, date2: Date | null): boolean {
    if (!date1 || !date2) return false
    return date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
}

function isInRange(date: Date): boolean {
    if (!props.startDate) return false
    const endDate = props.endDate || (props.isSelecting ? props.hoverDate : null)
    if (!endDate) return false

    const start = props.startDate.getTime()
    const end = endDate.getTime()
    const current = date.getTime()

    return current > Math.min(start, end) && current < Math.max(start, end)
}

function getDayClass(day: CalendarDay): string {
    if (!day.date || !day.isCurrentMonth) {
        return 'text-slate-300 cursor-not-allowed'
    }

    const classes: string[] = ['cursor-pointer']

    if (isSameDay(day.date, props.startDate) || isSameDay(day.date, props.endDate)) {
        classes.push('bg-blue-600 text-white font-semibold hover:bg-blue-700')
    } else if (isInRange(day.date)) {
        classes.push('bg-blue-100 text-blue-900')
    } else if (day.isCurrentMonth) {
        classes.push('hover:bg-slate-100 text-slate-700')
    }

    return classes.join(' ')
}
</script>
