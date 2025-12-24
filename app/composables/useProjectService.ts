import { ref, computed, onMounted, watch, unref } from 'vue'
import { projectService } from '@/services/project.service'
import type { Project } from '@/types/project'

export const useProjectService = () => {
  const toast = useToast()

  // Reactive state
  const q = ref('')
  const pagination = ref({ pageIndex: 0, pageSize: 20 })
  const totalRecords = ref(0)
  const totalPages = ref(0)

  // Data state
  const projects = ref<Project[]>([])
  const categories = ref<any[]>([]) // Using any for now or import ProjectCategory
  const loading = ref(false)
  const error = ref<Error | null>(null)

  // Methods
  async function fetchCategories() {
    try {
      const res = await projectService.getCategories()
      if (res.success && res.data) {
        categories.value = res.data
      }
    } catch (err) {
      console.error('Failed to fetch project categories', err)
    }
  }

  async function createProject(data: any) {
    loading.value = true
    try {
      const res = await projectService.createProject(data)
      if (res.success) {
        toast.add({ title: 'Success', description: 'Dự án đã được tạo thành công' })
        return true
      } else {
        throw new Error(res.message)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Create failed'
      toast.add({ title: 'Error', description: msg, color: 'error' })
      return false
    } finally {
      loading.value = false
    }
  }

  async function fetchProjects(options?: {
    search?: string
    pagination?: { start: number, number: number }
    sort?: { field: string, reverse: boolean }
  }) {
    loading.value = true
    error.value = null

    try {
      const res = await projectService.getProjects(options)
      if (res.data) {
        projects.value = res.data.items
        totalRecords.value = res.data.totalRecord
        totalPages.value = res.data.numberOfPages
      } else {
        projects.value = []
        totalRecords.value = 0
        totalPages.value = 0
      }
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to fetch projects')
      toast.add({
        title: 'Error',
        description: error.value.message,
        color: 'error'
      })
    } finally {
      loading.value = false
    }
  }

  function truncateContent(content: string | null, maxLength: number = 150) {
    if (!content) return ''
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  // Watch search, pagination
  watch([q, pagination], () => {
    const searchValue = unref(q)
    fetchProjects({
      search: searchValue || undefined,
      pagination: {
        start: pagination.value.pageIndex * pagination.value.pageSize,
        number: pagination.value.pageSize
      },
      sort: { field: 'Id', reverse: false }
    })
  }, { deep: true })

  // Initial fetch
  onMounted(() => {
    fetchProjects({
      pagination: {
        start: pagination.value.pageIndex * pagination.value.pageSize,
        number: pagination.value.pageSize
      },
      sort: { field: 'Id', reverse: false }
    })
  })

  return {
    // Data
    q,
    projects: computed(() => projects.value),
    categories: computed(() => categories.value),
    pagination,
    totalRecords: computed(() => totalRecords.value),
    totalPages: computed(() => totalPages.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),

    // Methods
    fetchProjects,
    fetchCategories,
    createProject,
    truncateContent
  }
}
