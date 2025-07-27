import { ref, computed, onMounted, watchEffect, unref } from 'vue'
import { newsService } from '@/services'
import type { NewsCategory } from '@/types/newsCategory'
import type { News } from '@/services/news.service'

export const useNewsService = () => {
  const toast = useToast()

  // Reactive state
  const q = ref('')
  const selectedCategoryId = ref<number | null>(null)
  
  // Data state
  const news = ref<News[]>([])
  const categories = ref<NewsCategory[]>([])
  const loading = ref(false)
  const categoriesLoading = ref(false)
  const error = ref<Error | null>(null)

  // Computed
  const filteredNews = computed(() => {
    let filtered = news.value
    
    // Filter by search query
    if (q.value) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(q.value.toLowerCase()) ||
        item.description.toLowerCase().includes(q.value.toLowerCase())
      )
    }
    
    // Filter by category
    if (selectedCategoryId.value) {
      filtered = filtered.filter(item => item.categoryId === selectedCategoryId.value)
    }
    
    return filtered
  })

  // Methods
  async function fetchNews(options?: {
    categoryId?: number
    search?: string
    pagination?: { start: number, number: number }
    sort?: { field: string, reverse: boolean }
  }) {
    loading.value = true
    error.value = null

    try {
      const response = await newsService.getNews(options)
      if (response.success) {
        news.value = response.data
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to fetch news')
      toast.add({
        title: 'Error',
        description: error.value.message,
        color: 'error'
      })
    } finally {
      loading.value = false
    }
  }

  async function fetchCategories() {
    categoriesLoading.value = true

    try {
      const response = await newsService.getCategories()
      if (response.success) {
        categories.value = response.data
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch categories'
      toast.add({
        title: 'Error',
        description: errorMessage,
        color: 'error'
      })
    } finally {
      categoriesLoading.value = false
    }
  }

  async function createNews(data: {
    title: string
    content: string
    description: string
    categoryId: number
    imageUrl?: string
    isPublished?: boolean
  }) {
    loading.value = true

    try {
      const response = await newsService.createNews(data)
      if (response.success) {
        // Refresh the list
        await fetchNews()
        toast.add({
          title: 'Success',
          description: 'News created successfully'
        })
        return response.data
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create news'
      toast.add({
        title: 'Error',
        description: errorMessage,
        color: 'error'
      })
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateNews(id: number, data: Partial<{
    title: string
    content: string
    description: string
    categoryId: number
    imageUrl: string
    isPublished: boolean
  }>) {
    loading.value = true

    try {
      const response = await newsService.updateNews({ id, ...data })
      if (response.success) {
        // Refresh the list
        await fetchNews()
        toast.add({
          title: 'Success',
          description: 'News updated successfully'
        })
        return response.data
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update news'
      toast.add({
        title: 'Error',
        description: errorMessage,
        color: 'error'
      })
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteNews(id: number) {
    try {
      const response = await newsService.deleteNews(id)
      if (response.success) {
        // Remove from local state
        news.value = news.value.filter(n => n.id !== id)
        toast.add({
          title: 'Success',
          description: 'News deleted successfully'
        })
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete news'
      toast.add({
        title: 'Error',
        description: errorMessage,
        color: 'error'
      })
    }
  }

  async function createCategory(data: {
    name: string
    description: string
    imageUrl?: string
    icon?: string
  }) {
    categoriesLoading.value = true

    try {
      const response = await newsService.createCategory(data)
      if (response.success) {
        // Refresh categories
        await fetchCategories()
        toast.add({
          title: 'Success',
          description: 'Category created successfully'
        })
        return response.data
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create category'
      toast.add({
        title: 'Error',
        description: errorMessage,
        color: 'error'
      })
      throw err
    } finally {
      categoriesLoading.value = false
    }
  }

  async function deleteCategory(id: number) {
    try {
      const response = await newsService.deleteCategory(id)
      if (response.success) {
        // Remove from local state
        categories.value = categories.value.filter(c => c.id !== id)
        toast.add({
          title: 'Success',
          description: 'Category deleted successfully'
        })
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete category'
      toast.add({
        title: 'Error',
        description: errorMessage,
        color: 'error'
      })
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  function truncateContent(content: string, maxLength: number = 150) {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  // Watch search and category changes
  watchEffect(() => {
    const searchValue = unref(q)
    const categoryValue = unref(selectedCategoryId)
    
    fetchNews({
      search: searchValue || undefined,
      categoryId: categoryValue || undefined
    })
  })

  // Initial fetch
  onMounted(() => {
    fetchNews()
    fetchCategories()
  })

  return {
    // Data
    q,
    selectedCategoryId,
    news: readonly(news),
    categories: readonly(categories),
    filteredNews,
    loading: readonly(loading),
    categoriesLoading: readonly(categoriesLoading),
    error: readonly(error),

    // Methods
    fetchNews,
    fetchCategories,
    createNews,
    updateNews,
    deleteNews,
    createCategory,
    deleteCategory,
    formatDate,
    truncateContent
  }
}
