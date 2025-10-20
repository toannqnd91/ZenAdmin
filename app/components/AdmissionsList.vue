<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import type { Admission } from '~/types'

const { admissions } = defineProps<{ admissions: Admission[] }>()
const router = useRouter()

const now = ref(new Date())
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

function parseDate(dateStr: string) {
  return new Date(dateStr.replace(' ', 'T').replace(' +', '+'))
}

function getTimeLeft(target: string) {
  const end = parseDate(target)
  const current = now.value
  let diff = end.getTime() - current.getTime()
  if (diff <= 0) return null

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  diff -= days * (1000 * 60 * 60 * 24)
  const hours = Math.floor(diff / (1000 * 60 * 60))
  diff -= hours * (1000 * 60 * 60)
  const minutes = Math.floor(diff / (1000 * 60))
  diff -= minutes * (1000 * 60)
  const seconds = Math.floor(diff / 1000)

  return `${days} ngày ${hours} giờ ${minutes} phút ${seconds} giây`
}

const admissionsWithStatus = computed(() =>
  (admissions ?? []).map((admission) => {
    const current = now.value
    const endDate = parseDate(admission.endDate)
    const resultDate = parseDate(admission.resultAnnouncement)

    if (current < endDate) {
      return {
        ...admission,
        statusObj: {
          label: 'Kết thúc nộp hồ sơ tuyển sinh:',
          time: getTimeLeft(admission.endDate),
          date: endDate,
          show: true,
          status: 'open'
        }
      }
    } else if (current < resultDate) {
      return {
        ...admission,
        statusObj: {
          label: 'Công bố kết quả tuyển sinh:',
          time: getTimeLeft(admission.resultAnnouncement),
          date: resultDate,
          show: true,
          status: 'pending'
        }
      }
    } else {
      return {
        ...admission,
        statusObj: {
          label: 'Tuyển sinh kết thúc',
          show: false,
          status: 'closed'
        }
      }
    }
  })
)
</script>

<template>
  <ul role="list" class="divide-y divide-default">
    <li
      v-for="(item, index) in admissionsWithStatus"
      :key="item.id"
      class="flex items-center justify-between gap-3 py-3 pr-0 sm:pr-0 cursor-pointer transition"
      @click="router.push(`/dang-ky-xet-tuyen/${item.id}`)"
    >
      <div class="flex items-center gap-3 min-w-0">
        <div
          :class="[
            'flex items-center justify-center font-bold rounded-full h-10 w-10 text-base',
            [
              'bg-blue-200 text-blue-700',
              'bg-green-200 text-green-700',
              'bg-yellow-200 text-yellow-700',
              'bg-pink-200 text-pink-700',
              'bg-purple-200 text-purple-700',
              'bg-orange-200 text-orange-700'
            ][index % 6]
          ]"
        >
          {{ index + 1 }}
        </div>
        <div class="text-sm min-w-0">
          <p
            class="font-medium truncate"
            :class="item.statusObj.show ? 'text-primary-600' : 'text-muted'"
          >
            {{ item.title }}
          </p>
          <p v-if="item.statusObj.show" class="truncate font-semibold">
            {{ item.statusObj.label }}
            <span v-if="item.statusObj.time">Còn {{ item.statusObj.time }}</span>
            <span v-if="item.statusObj.date">
              ({{ item.statusObj.date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }}
              {{ item.statusObj.date.toLocaleDateString('vi-VN') }})
            </span>
          </p>
          <p v-else class="text-muted truncate">
            Tuyển sinh kết thúc
          </p>
        </div>
      </div>
      <div>
        <UBadge
          v-if="item.statusObj.status === 'open'"
          color="success"
          variant="subtle"
        >
          Đang Mở
        </UBadge>
        <UBadge
          v-else-if="item.statusObj.status === 'pending'"
          color="warning"
          variant="subtle"
        >
          Đợi Công Bố Kết Quả
        </UBadge>
        <UBadge
          v-else
          color="error"
          variant="subtle"
        >
          Đã Đóng
        </UBadge>
      </div>
    </li>
  </ul>
</template>
