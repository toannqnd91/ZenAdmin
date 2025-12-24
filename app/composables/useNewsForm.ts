import { ref, computed, onMounted } from 'vue'
import { newsService, fileService } from '@/services'
import type { NewsFormData } from '@/services/news.service'

interface FormErrors {
  title?: string
  desc?: string
  content?: string
  categoryIds?: string
}

export const useNewsForm = (newsId?: number) => {
  // Helper to decode HTML entities (for desc previously saved as encoded HTML)
  const decodeEntities = (str: string): string => {
    if (!str) return ''
    if (typeof window === 'undefined') return str
    const textarea = document.createElement('textarea')
    textarea.innerHTML = str
    return textarea.value
  }
  // Form data
  const formData = ref<NewsFormData>({
    title: '',
    desc: '',
    content: '',
    imageUrl: '',
    tags: [],
    categoryIds: []
  })

  // Form states
  const isSubmitting = ref(false)
  const isLoading = ref(false)
  const errors = ref<FormErrors>({})

  // Publication status
  const publicationStatus = ref('published')
  const statusItems = [
    { value: 'published', label: 'Hiện' },
    { value: 'draft', label: 'Ẩn' }
  ]

  // Tags management
  const tagInput = ref('')
  const addTag = (event?: Event) => {
    // Prevent form submission if called from Enter key
    if (event) {
      event.preventDefault()
    }

    const tag = tagInput.value.trim()
    if (tag && !formData.value.tags?.includes(tag)) {
      if (!formData.value.tags) formData.value.tags = []
      formData.value.tags.push(tag)
      tagInput.value = ''
    }
  }

  const removeTag = (index: number) => {
    if (formData.value.tags) {
      formData.value.tags.splice(index, 1)
    }
  }

  // Categories management
  const isDropdownOpen = ref(false)
  const searchTerm = ref('')

  // Fetch categories (client-side to ensure auth token available on hard reload)
  const { data: categoriesResponse, pending: categoriesPending, error: categoriesError, refresh: refreshCategories } = useAsyncData(
    'news-categories',
    async () => {
      try {
        return await newsService.getCategories()
      } catch (e) {
        console.error('Lỗi tải danh mục tin tức:', e)
        return { success: false, data: [] }
      }
    },
    { server: false, lazy: false }
  )

  const categories = computed(() => {
    if (!categoriesResponse.value?.success || !categoriesResponse.value.data) return []
    return categoriesResponse.value.data
  })

  const filteredCategories = computed(() => {
    if (!searchTerm.value) return categories.value
    return categories.value.filter(category =>
      category.name.toLowerCase().includes(searchTerm.value.toLowerCase())
    )
  })

  const selectedCategories = computed(() => {
    return categories.value.filter(category =>
      formData.value.categoryIds.includes(category.id)
    )
  })

  const toggleCategory = (categoryId: number) => {
    const index = formData.value.categoryIds.indexOf(categoryId)
    if (index > -1) {
      formData.value.categoryIds.splice(index, 1)
    } else {
      formData.value.categoryIds.push(categoryId)
    }
  }

  const removeCategory = (categoryId: number) => {
    const index = formData.value.categoryIds.indexOf(categoryId)
    if (index > -1) {
      formData.value.categoryIds.splice(index, 1)
    }
  }

  // Image upload handling
  const isUploadingImage = ref(false)
  const imageFile = ref<File | null>(null)
  const imagePreview = ref<string | null>('')
  const originalImageUrl = ref<string>('')
  const fileInput = ref<HTMLInputElement>()

  const handleImageUpload = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      console.error('Vui lòng chọn file ảnh (JPG, PNG, GIF, SVG)')
      // Reset file input
      target.value = ''
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      console.error('Kích thước file không được vượt quá 2MB')
      // Reset file input
      target.value = ''
      return
    }

    imageFile.value = file

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)

    // Upload file
    try {
      isUploadingImage.value = true
      const response = await fileService.uploadFile(file, 'news')
      // New format: { success: true, data: { url: "...", ... } }
      if (response && response.success && response.data) {
        // response.data is the file object e.g. { url: '...', fileName: '...' }
        const fileData = response.data
        if (fileData && fileData.url) {
          formData.value.imageUrl = fileData.url
          // Update preview to use the returned URL if needed, although we already set a local blob preview
          // imagePreview.value = fileData.url 
        } else {
          console.error('Lỗi upload ảnh: Không tìm thấy url trong response data', fileData)
        }
      } else {
        console.error('Lỗi upload ảnh: Response không hợp lệ', response)
      }
    } catch (error) {
      console.error('Lỗi upload ảnh:', error)
    } finally {
      isUploadingImage.value = false
    }
  }

  const removeImage = () => {
    imageFile.value = null
    imagePreview.value = ''
    formData.value.imageUrl = ''
    // Reset file input to allow selecting the same file again
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }

  const restoreOriginalImage = () => {
    const imageUrl = originalImageUrl.value
    if (imageUrl && imageUrl.trim()) {
      imageFile.value = null
      imagePreview.value = fileService.getFileUrl(imageUrl)
      formData.value.imageUrl = imageUrl
    }
  }

  const clickFileInput = () => {
    fileInput.value?.click()
  }

  // Form validation
  const validateForm = () => {
    errors.value = {}

    if (!formData.value.title.trim()) {
      errors.value.title = 'Tiêu đề là bắt buộc'
    }

    if (!formData.value.desc.trim()) {
      errors.value.desc = 'Mô tả ngắn là bắt buộc'
    }

    if (!formData.value.content.trim()) {
      errors.value.content = 'Nội dung là bắt buộc'
    }

    if (!formData.value.categoryIds.length) {
      errors.value.categoryIds = 'Vui lòng chọn ít nhất một danh mục'
    }

    return Object.keys(errors.value).length === 0
  }

  // Load news data for editing
  const loadNewsData = async () => {
    if (!newsId) return

    isLoading.value = true
    try {
      const response = await newsService.getNewsById(newsId)
      if (response.success && response.data) {
        const news = response.data
        formData.value = {
          title: news.title,
          desc: decodeEntities(news.desc || ''),
          content: news.content,
          imageUrl: news.imageUrl || '',
          tags: news.tags || [],
          categoryIds: news.categories.map(c => c.id)
        }

        // Set image preview if exists
        if (news.imageUrl) {
          originalImageUrl.value = news.imageUrl
          imagePreview.value = fileService.getFileUrl(news.imageUrl)
        }
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu tin tức:', error)
    } finally {
      isLoading.value = false
    }
  }

  // Submit form (create or update)
  const submitForm = async () => {
    if (!validateForm()) return

    isSubmitting.value = true

    try {
      let response
      if (newsId) {
        // Update mode
        response = await newsService.updateNews(newsId, formData.value)
      } else {
        // Ensure desc plain text trimmed (summary editor runs in plainText mode)
        formData.value.desc = formData.value.desc.trim()
        // Create mode
        response = await newsService.createNews(formData.value)
      }

      if (response.success) {
        // Redirect to news list
        await navigateTo('/news')
      } else {
        console.error('Lỗi:', response.message)
      }
    } catch (error) {
      console.error('Lỗi:', error)
    } finally {
      isSubmitting.value = false
    }
  }

  // Load data on init if editing
  if (newsId) {
    // Load data asynchronously without blocking composable initialization
    onMounted(async () => {
      await loadNewsData()
    })
  }

  return {
    // Form data
    formData,
    isSubmitting,
    isLoading,
    errors,

    // Publication
    publicationStatus,
    statusItems,

    // Tags
    tagInput,
    addTag,
    removeTag,

    // Categories
    categories,
    isDropdownOpen,
    searchTerm,
    filteredCategories,
    selectedCategories,
    toggleCategory,
    removeCategory,
    isCategoriesLoading: computed(() => categoriesPending.value),
    categoriesError,
    refreshCategories,

    // Image upload
    isUploadingImage,
    imageFile,
    imagePreview,
    originalImageUrl,
    fileInput,
    handleImageUpload,
    removeImage,
    restoreOriginalImage,
    clickFileInput,

    // Form methods
    validateForm,
    submitForm,
    loadNewsData,

    // Computed
    isEditMode: computed(() => !!newsId)
  }
}
