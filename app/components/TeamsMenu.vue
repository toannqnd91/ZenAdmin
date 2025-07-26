<script setup lang="ts">
const appConfig = useAppConfig()
const { settings } = appConfig

defineProps<{
  collapsed?: boolean
}>()

const team = {
  label: settings.team.label,
  avatar: {
    src: settings.team.avatar.src,
    alt: settings.team.avatar.alt
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