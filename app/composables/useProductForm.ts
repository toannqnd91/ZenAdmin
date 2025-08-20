import { ref, computed } from 'vue'
import { productService, fileService } from '@/services'
import { useProductsCategoriesService } from '@/composables/useProductsCategoriesService'

export interface ProductFormData {
  name: string
  price: number | null
  compareAtPrice: number | null
  importPrice: number | null
  chargeTax: boolean
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
    compareAtPrice: null,
    importPrice: null,
    chargeTax: false,
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
      // Upload all images in one request
      const uploadResponse = await fileService.uploadMultipleFiles(files)
      // API trả về { data: [ { fileName, ... } ] }
      const uploaded = Array.isArray(uploadResponse?.data) ? uploadResponse.data : []
      const urls: string[] = uploaded.map(f => f.fileName).filter((f): f is string => !!f)
      formData.value.imageUrls.push(...urls)
      // Hiển thị đúng preview cho các ảnh vừa upload
      imagePreviews.value.push(...urls.map(url => fileService.getFileUrl(url)))
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
      if (Object.keys(errors.value).length) throw new Error('Vui lòng kiểm tra lại thông tin bắt buộc')

      // Build slug similar to page slug
      const slug = (formData.value.name || 'new-product')
        .toLowerCase()
        .normalize('NFD').replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-') || 'new-product'



      // ==== PAYLOAD GỬI LÊN BACKEND ==============================================
      const payload: Record<string, unknown> = {
        id: 0,
        name: formData.value.name,
        slug,
        price: Number(formData.value.price) || 0,
        oldPrice: Number(formData.value.compareAtPrice) || 0,
        isCallForPricing: false,
        isAllowToOrder: false,
        isPublished: true,
        isFeatured: !!formData.value.isFeatured,
        stockTrackingIsEnabled: false,
        categoryIds: formData.value.categoryIds || [],
        // Map descriptions
        shortDescription: formData.value.description || '',
        description: formData.value.content || '',
        // IDs from extended form if any
        supplierId: (formData.value as any).supplierId ?? null,
        brandId: (formData.value as any).brandId ?? null,
        // SKU/Barcode if available
        sku: formData.value.sku || (formData.value as any).sku || '',
        gtin: (formData.value as any).barcode || '',
        // Images (backend may accept imageUrls directly)
        imageUrls: formData.value.imageUrls || []
        // === Thêm field mới ở đây ===
      }
      // ==== HẾT PHẦN PAYLOAD =====================================================

      // Log payload to console
      // eslint-disable-next-line no-console
      console.log('Product payload:', JSON.stringify(payload, null, 2))

      // Write payload to file for user inspection (Node.js/SSR only)
      if (typeof window === 'undefined') {
        const fs = await import('fs')
        fs.writeFileSync('create-product.json', JSON.stringify(payload, null, 2), 'utf-8')
      }

      // Inventory flags if present on extended form
      const manageInventory = (formData.value as any).manageInventory
      const allowNegativeStock = (formData.value as any).allowNegativeStock
      if (typeof manageInventory === 'boolean') payload.stockTrackingIsEnabled = manageInventory
      if (typeof allowNegativeStock === 'boolean') payload.isAllowToOrder = allowNegativeStock

      const res = await productService.createProduct(payload as any)
      if (res && typeof res === 'object' && 'success' in res && (res as any).success === false) {
        const msg = (res as any).message || 'Đã có lỗi xảy ra'
        throw new Error(msg)
      }
      return true
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
