

<script setup lang="ts">
import { useWidgets } from '@/composables/useWidgets'

const {
  q,
  loading,
  error,
  filteredWidgets,
  fetchWidgets,
  deleteWidget,
  formatDate
} = useWidgets()

onMounted(fetchWidgets)
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-3xl font-semibold">Widget Instances</h1>
      <NuxtLink to="/widgets/create" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded flex items-center">
        <span class="mr-2 text-xl">+</span> Create Widget
      </NuxtLink>
    </div>
    <hr class="mb-4" />
    <div class="mb-4 flex items-center">
      <input v-model="q" type="text" placeholder="Search widgets..." class="border rounded px-3 py-2 w-64" />
    </div>
    <div v-if="loading">Loading...</div>
    <div v-else-if="error" class="text-red-500">{{ error }}</div>
    <table v-else class="min-w-full border border-gray-200 rounded">
      <thead>
        <tr class="bg-gray-100">
          <th class="p-2 border text-left">Name</th>
          <th class="p-2 border text-left">Widget Type</th>
          <th class="p-2 border text-left">Widget Zone</th>
          <th class="p-2 border text-left">Publish Start</th>
          <th class="p-2 border text-left">Publish End</th>
          <th class="p-2 border text-left">Display Order</th>
          <th class="p-2 border text-center">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="widget in filteredWidgets" :key="widget.id">
          <td class="p-2 border">{{ widget.name }}</td>
          <td class="p-2 border">{{ widget.widgetType }}</td>
          <td class="p-2 border">{{ widget.widgetZone }}</td>
          <td class="p-2 border">{{ formatDate(widget.publishStart) }}</td>
          <td class="p-2 border">{{ formatDate(widget.publishEnd) }}</td>
          <td class="p-2 border text-center">{{ widget.displayOrder }}</td>
          <td class="p-2 border text-center">
            <NuxtLink :to="`/widgets/${widget.id}/edit`" class="inline-flex items-center justify-center w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded mr-2" title="Edit">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13zm0 0V21h8" /></svg>
            </NuxtLink>
            <button class="inline-flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded" title="Delete" @click="deleteWidget(widget.id)">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
