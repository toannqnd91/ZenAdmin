<script setup lang="ts">
import { useAppTitle } from '@/composables/useAppSettings'
import ProjectForm from '@/components/projects/ProjectForm.vue'

definePageMeta({ layout: 'default' })
const appTitle = useAppTitle()
const route = useRoute()
const projectId = Number(route.params.id)

useHead({ title: `Chỉnh sửa dự án - ${appTitle}` })
</script>

<template>
    <ProjectForm :project-id="projectId" />
</template>
