import { ref, computed } from 'vue'
import { productService, fileService } from '@/services'
import type { ApiResponse } from '@/types/common'
import { useProductsCategoriesService } from '@/composables/useProductsCategoriesService'
import type { ProductCategory as ProductCategoryType } from '@/composables/useProductsCategoriesService'
import type { CreateProductRequest } from '@/services/product.service'

export interface ProductFormData {
  id?: number // when present (>0) triggers update instead of create
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
  // Optional extended fields (not strictly typed here to keep composable generic)
  manageInventory?: boolean
  warehouseStocks?: Record<number, number>
  // supplierId?: number | null
  // brandId?: number | null
  // warehouseId?: number | null
  // allowNegativeStock?: boolean
  // barcode?: string
}

export const useProductForm = () => {
  // Form data
  const formData = ref<ProductFormData>({
    id: 0,
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
  const { data: categories, loading: loadingCategories }
    = useProductsCategoriesService()

  // Selected categories as objects (for tag display)
  const selectedCategories = computed(() => {
    if (!categories.value) return []
    return (categories.value as ProductCategoryType[]).filter(cat =>
      formData.value.categoryIds.includes(cat.id)
    )
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
      const uploaded = Array.isArray(uploadResponse?.data)
        ? uploadResponse.data
        : []
      const urls: string[] = uploaded
        .map(f => f.fileName)
        .filter((f): f is string => !!f)
      // Guard: when editing an existing product imageUrls might be undefined
      if (!Array.isArray(formData.value.imageUrls)) {
        formData.value.imageUrls = []
      }
      formData.value.imageUrls.push(...urls)
      // Also preview them immediately
      imagePreviews.value.push(...urls)
      // Clear the input so selecting the same file again triggers change
      try {
        input.value = ''
      } catch (_e) {
        // some browsers may restrict setting value; ignore
      }
    } finally {
      isUploadingImage.value = false
    }
  }

  const removeImage = (index: number) => {
    formData.value.imageUrls.splice(index, 1)
    imagePreviews.value.splice(index, 1)
  }

  // Submit with optional extras for options/variations
  const submitForm = async (extras?: {
    options?: unknown[]
    variations?: unknown[]
    productImages?: { caption: string, mediaUrl: string }[]
  }) => {
    errors.value = {}
    isSubmitting.value = true
    try {
      // Validate
      if (!formData.value.name) errors.value.name = 'Tên sản phẩm là bắt buộc'
      if (!formData.value.content)
        errors.value.content = 'Nội dung là bắt buộc'
      if (Object.keys(errors.value).length)
        throw new Error('Vui lòng kiểm tra lại thông tin bắt buộc')

      // Build slug similar to page slug
      const slug
        = (formData.value.name || 'new-product')
          .toLowerCase()
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .replace(/[^a-z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-') || 'new-product'

      // ==== PAYLOAD GỬI LÊN BACKEND (bổ sung tại đây nếu cần) ===================
      // ==== PAYLOAD SENT TO BACKEND (supplement here if needed)
      const isUpdate = !!formData.value.id && formData.value.id > 0

      // collectionIds: array of selected collection ids, or null if none
      // collectionIds: mảng các id bộ sưu tập đã chọn, hoặc null nếu không chọn cái nào
      let collectionIds: number[] | null = null
      if ('selectedCollections' in formData.value && Array.isArray((formData.value as any).selectedCollections)) {
        const arr = (formData.value as any).selectedCollections as number[]
        collectionIds = arr.length ? arr : null
      } else if ('collectionIds' in formData.value && Array.isArray((formData.value as any).collectionIds)) {
        const arr = (formData.value as any).collectionIds as number[]
        collectionIds = arr.length ? arr : null
      }

      // variations: nếu là update thì thêm Id vào từng variation nếu có, create thì giữ nguyên không có Id
      let variations = extras?.variations || []
      if (isUpdate && Array.isArray(variations)) {
        variations = variations.map((v: any, idx: number) => {
          // Nếu variation đã có id thì giữ, nếu không thì bỏ qua
          if (v && v.id) return v
          // Tìm id từ data gốc nếu có (nếu cần có thể truyền vào qua extras)
          if (v && v.name && Array.isArray((formData.value as any).originalVariations)) {
            const found = (formData.value as any).originalVariations.find((ori: any) => ori.name === v.name)
            if (found && found.id) return { ...v, id: found.id }
          }
          return v
        })
      }
      let inventory: Array<{ warehouseId: number, quantity: number }> | undefined = undefined
      // Nếu quản lý tồn kho thì build inventory từ warehouseStocks
      if (formData.value.manageInventory) {
        const stocks = formData.value.warehouseStocks as Record<string, number> || {}
        const keys = Object.keys(stocks)
        if (keys.length > 0) {
          inventory = keys.map((k: string) => ({ warehouseId: parseInt(k, 10), quantity: Number(stocks[k]) || 0 }))
        } else {
          inventory = [{ warehouseId: 0, quantity: 0 }]
        }
      }
      const payload: Record<string, unknown> = {
        id: formData.value.id || 0,
        name: formData.value.name,
        slug,
        price: Number(formData.value.price) || 0,
        oldPrice: Number(formData.value.compareAtPrice) || 0,
        costPrice: Number(formData.value.importPrice) || 0,
        isCallForPricing: false,
        isAllowToOrder: false,
        isPublished: true,
        isFeatured: !!formData.value.isFeatured,
        stockTrackingIsEnabled: false,
        categoryIds: formData.value.categoryIds || [],
        // Map descriptions
        shortDescription: formData.value.description || '',
        description: formData.value.content || '',
        collectionIds: collectionIds,
        // IDs from extended form if any
        supplierId:
          (formData.value as unknown as Record<string, unknown>)[
            'supplierId'
          ] ?? null,
        brandId:
          (formData.value as unknown as Record<string, unknown>)['brandId']
          ?? null,
        // SKU/Barcode if available
        sku:
          formData.value.sku
          || (formData.value as unknown as Record<string, unknown>)['sku']
          || '',
        gtin:
          (formData.value as unknown as Record<string, unknown>)['barcode']
          || '',
        // Images (backend may accept imageUrls directly)
        // Only include imageUrls if not using productImages
        ...(extras?.productImages
          ? {}
          : { imageUrls: formData.value.imageUrls || [] }),
        // Extras from UI mapping
        options: extras?.options || [],
        variations,
        ...(extras?.productImages
          ? { productImages: extras.productImages }
          : {}),
        // === Thêm field mới ở đây ===
        ...(inventory ? { inventory } : {})
      }
      // ==== HẾT PHẦN PAYLOAD =====================================================

      // Inventory flags if present on extended form
      const manageInventory = (
        formData.value as unknown as Record<string, unknown>
      )['manageInventory']
      const allowNegativeStock = (
        formData.value as unknown as Record<string, unknown>
      )['allowNegativeStock']
      if (typeof manageInventory === 'boolean')
        payload.stockTrackingIsEnabled = manageInventory
      if (typeof allowNegativeStock === 'boolean')
        payload.isAllowToOrder = allowNegativeStock

      // Remove imageUrls if productImages is present
      if (extras?.productImages && 'imageUrls' in payload) {
        delete payload.imageUrls
      }

      // Log payload to console
      console.log('Product payload:', JSON.stringify(payload, null, 2))

      // Write payload to file for user inspection (Node.js/SSR only)
      if (typeof window === 'undefined') {
        const fs = await import('fs')
        fs.writeFileSync(
          'create-product.json',
          JSON.stringify(payload, null, 2),
          'utf-8'
        )
      }

      let res: ApiResponse<unknown>
      if (isUpdate) {
        // Update: send to update endpoint
        res = await productService.updateProduct({
          ...(payload as unknown as CreateProductRequest),
          id: formData.value.id || 0
        })
      } else {
        // Create
        res = await productService.createProduct(
          payload as unknown as CreateProductRequest
        )
      }
      if (!res.success) {
        const msg = res.message || 'Đã có lỗi xảy ra'
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
    selectedCategories,
    removeCategory,
    isUploadingImage,
    imagePreviews,
    handleImageUpload,
    removeImage,
    submitForm
  }
}
