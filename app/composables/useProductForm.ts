import { ref, computed } from 'vue'
import { productService, fileService } from '@/services'
import { useProductsCategoriesService } from '@/composables/useProductsCategoriesService'

export interface ProductFormData {
  name: string
  price: number | null
  sku: string
  description: string
  content: string
  imageUrls: string[]
  categoryIds: number[]
  url: string
  isFeatured: boolean
  isInStock: boolean
}

export const useProductForm = () => {
  // Form data
  const formData = ref<ProductFormData>({
    name: '',
    price: null,
    sku: '',
    description: '',
    content: '',
    imageUrls: [],
    categoryIds: [],
    url: '',
    isFeatured: false,
    isInStock: true
  })

  // State
  const isSubmitting = ref(false)
  const errors = ref<Record<string, string>>({})

  // Categories
  const { data: categories, loading: loadingCategories } = useProductsCategoriesService()
  // Dropdown state for category selection
  const isDropdownOpen = ref(false)
  const searchTerm = ref('')
  // Filtered categories for search
  const filteredCategories = computed(() => {
    if (!categories.value) return []
    if (!searchTerm.value) return categories.value
    return categories.value.filter((cat: any) =>
      cat.name.toLowerCase().includes(searchTerm.value.toLowerCase())
    )
  })
  // Selected categories as objects (for tag display)
  const selectedCategories = computed(() => {
    if (!categories.value) return []
    return categories.value.filter((cat: any) => formData.value.categoryIds.includes(cat.id))
  })
  // Remove category from selection
  const removeCategory = (id: number) => {
    const idx = formData.value.categoryIds.indexOf(id)
    if (idx !== -1) formData.value.categoryIds.splice(idx, 1)
  }

  // Image upload
  const isUploadingImage = ref(false)
  const imagePreviews = ref<string[]>([])

  const handleImageUpload = async (event: Event) => {
    const input = event.target as HTMLInputElement
    if (!input.files || !input.files.length) return
    isUploadingImage.value = true
    try {
      const files = Array.from(input.files)
      // Upload all images
      const uploadResults = await Promise.all(files.map(file => fileService.uploadFile(file)))
      const urls = uploadResults.map(res => res.data?.fileName || '').filter(Boolean)
      formData.value.imageUrls.push(...urls)
      imagePreviews.value.push(...urls.map(fileService.getFileUrl))
    } finally {
      isUploadingImage.value = false
    }
  }

  const removeImage = (index: number) => {
    formData.value.imageUrls.splice(index, 1)
    imagePreviews.value.splice(index, 1)
  }

  // Category selection
  const toggleCategory = (id: number) => {
    const idx = formData.value.categoryIds.indexOf(id)
    if (idx === -1) formData.value.categoryIds.push(id)
    else formData.value.categoryIds.splice(idx, 1)
  }

  // Submit
  const submitForm = async () => {
    errors.value = {}
    isSubmitting.value = true
    try {
      // Validate
      if (!formData.value.name) errors.value.name = 'Tên sản phẩm là bắt buộc'
      if (!formData.value.content) errors.value.content = 'Nội dung là bắt buộc'
      if (Object.keys(errors.value).length) return
      // Call API
      await productService.createProduct({
        ...formData.value,
        url: null,
        price: formData.value.price || 0,
        categoryIds: formData.value.categoryIds,
        imageUrls: formData.value.imageUrls
      })
      // Success
      return true
    } catch (e: any) {
      errors.value.form = e.message || 'Đã có lỗi xảy ra'
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    formData,
    isSubmitting,
    errors,
    categories,
    loadingCategories,
    // Dropdown state and logic
    isDropdownOpen,
    searchTerm,
    filteredCategories,
    selectedCategories,
    toggleCategory,
    removeCategory,
    isUploadingImage,
    imagePreviews,
    handleImageUpload,
    removeImage,
    submitForm
  }
}
