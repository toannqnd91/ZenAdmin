<script setup lang="ts">
defineProps<{
  collapsed?: boolean
}>()

const team = {
  label: 'Đại Học Thái Bình',
  avatar: {
    src: 'https://tbu-test.vnnsoft.com/images/favicon.png',
    alt: 'Đại Học Thái Bình'
  }
}

const router = useRouter()
const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div
    class="flex items-center justify-center gap-2 py-2 cursor-pointer"
    @click="goHome">
    <UAvatar
      :src="team.avatar.src"
      :alt="team.avatar.alt"
      size="md"
    />
    <span v-if="!collapsed" class="font-semibold text-base">{{ team.label }}</span>
  </div>
</template>