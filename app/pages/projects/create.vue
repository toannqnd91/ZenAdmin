<script setup lang="ts">
import { useAppTitle } from '@/composables/useAppSettings'
import ProjectForm from '@/components/projects/ProjectForm.vue'

definePageMeta({ layout: 'default' })
const appTitle = useAppTitle()
useHead({ title: `Thêm dự án mới - ${appTitle}` })
</script>

<template>
    <ProjectForm />
</template>
