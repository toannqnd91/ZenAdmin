import { ref, computed } from 'vue'
import { newsService, fileService } from '@/services'
import type { NewsFormData } from '@/services/news.service'

interface FormErrors {
  title?: string
  desc?: string
  content?: string
  categoryIds?: string
}

export const useNewsForm = async (newsId?: number) => {
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

  // Fetch categories
  const { data: categoriesResponse } = await useAsyncData('news-categories', async () => {
    const response = await newsService.getCategories()
    return response
  })

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
  const imagePreview = ref<string>('')
  const fileInput = ref<HTMLInputElement>()

  const handleImageUpload = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    
    if (!file) return
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      console.error('Vui lòng chọn file ảnh (JPG, PNG, GIF, SVG)')
      return
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      console.error('Kích thước file không được vượt quá 2MB')
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
      
      if (response && response.success && response.data) {
        const fileData = Array.isArray(response.data) ? response.data[0] : response.data
        
        if (fileData && fileData.fileName) {
          formData.value.imageUrl = fileData.fileName
          console.log('Upload ảnh thành công! FileName:', fileData.fileName)
        } else {
          console.error('Lỗi upload ảnh: Không tìm thấy fileName trong response data', fileData)
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
          desc: news.desc,
          content: news.content,
          imageUrl: news.imageUrl || '',
          tags: news.tags || [],
          categoryIds: news.categories.map(c => c.id)
        }
        
        // Set image preview if exists
        if (news.imageUrl) {
          imagePreview.value = news.imageUrl
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
      console.log('Form data before sending:', formData.value)
      
      let response
      if (newsId) {
        // Update mode
        response = await newsService.updateNews(newsId, formData.value)
      } else {
        // Create mode
        response = await newsService.createNews(formData.value)
      }
      
      if (response.success) {
        console.log(newsId ? 'Cập nhật tin tức thành công!' : 'Tạo tin tức thành công!')
        
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
    await loadNewsData()
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
    
    // Image upload
    isUploadingImage,
    imageFile,
    imagePreview,
    fileInput,
    handleImageUpload,
    removeImage,
    clickFileInput,
    
    // Form methods
    validateForm,
    submitForm,
    loadNewsData,
    
    // Computed
    isEditMode: computed(() => !!newsId)
  }
}
