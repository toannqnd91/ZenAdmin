import { ref, computed, watch, onMounted } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { useBrandsService } from '@/composables/useBrandsService'
import { useSuppliersService } from '@/composables/useSuppliersService'
import { useCollectionsService } from '@/composables/useCollectionsService'
import { useProductForm } from '@/composables/useProductForm'
import type { ProductFormData as BaseProductFormData } from '@/composables/useProductForm'
import type { ProductCategory } from '@/composables/useProductsCategoriesService'
import { productService } from '@/services/product.service'
import { useApiConfig } from '@/composables/useApiConfig'

type ExtendedProductFormData = BaseProductFormData & {
  supplierId: number | null
  collectionIds: number[]
  tags?: string[]
  warehouseId?: number | null
  manageInventory?: boolean
  allowNegativeStock?: boolean
  manageByBatch?: boolean
  warehouseStocks?: Record<number, number>
  hasSkuOrBarcode?: boolean
  sku?: string
  barcode?: string
}

export function useCreateProductPage() {
  const { imageBaseUrl } = useApiConfig()
  const getPreviewUrl = (img: string): string => {
    if (!img) return ''
    if (/^https?:\/\//.test(img)) return img
    const filename = String(img).split('/').pop() || ''
    return `${imageBaseUrl}/image/${filename}`
  }

  const productForm = useProductForm()
  const formData = productForm.formData as Ref<ExtendedProductFormData>
  const errors = productForm.errors as Ref<Record<string, string>>
  const categories = productForm.categories as Ref<ProductCategory[] | undefined>
  const isUploadingImage = productForm.isUploadingImage as Ref<boolean>
  const imagePreviews = productForm.imagePreviews as Ref<string[]>
  const handleImageUpload = productForm.handleImageUpload as (e: Event) => Promise<void> | void
  const removeImage = productForm.removeImage as (index: number) => void
  const submitForm = productForm.submitForm as (extras?: { options?: unknown[], variations?: unknown[] }) => Promise<boolean | undefined>
  const selectedCategories = productForm.selectedCategories as ComputedRef<ProductCategory[]>
  const removeCategory = productForm.removeCategory as (id: number) => void

  formData.value.supplierId ??= null
  formData.value.collectionIds ??= []

  const { data: suppliers, loading: suppliersLoading } = useSuppliersService()
  const { collections, loading: collectionsLoading } = useCollectionsService()

  const selectedSupplier = ref<number | null>(formData.value.supplierId ?? null)
  const selectedCollections = ref<number[]>(formData.value.collectionIds ?? [])

  watch(selectedSupplier, (val) => {
    formData.value.supplierId = val
  })
  watch(selectedCollections, (val) => {
    formData.value.collectionIds = val
  })

  const categoryOptions = computed(() => {
    const cats = (categories.value ?? []) as ProductCategory[]
    return cats.map(c => ({ id: c.id, label: c.name }))
  })

  const { data: brands, loading: brandsLoading, error: brandsError } = useBrandsService()
  const trademark = ref<string>('')
  const status = ref<'Public' | 'Draft'>('Public')
  const pageTemplate = ref<string>('Default product')
  const markAsSoldOut = ref<boolean>(false)

  const slug = computed(() => {
    const s = (formData.value.name || 'new-product')
      .toLowerCase()
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
    return s || 'new-product'
  })

  const _onSubmit = async () => {
    const { imageBaseUrl } = useApiConfig()
    try {
      const attrs = (activeAttributes.value as Array<{ name: string, values: string[] }>) || []
      const options = attrs.map((a: { name: string, values: string[] }) => ({
        name: a.name,
        displayType: 'text',
        values: (a.values || []).map(v => ({ key: v, display: null }))
      }))

      const normalizeImageUrl = (url: string) => {
        if (!url) return ''
        if (url.startsWith('http://') || url.startsWith('https://')) return url
        const fname = url.replace(/^\/image\//, '')
        return `${imageBaseUrl}/image/${fname}`
      }

      const variations = (variants.value || []).map((v) => {
        const vRec = (v || {}) as { name?: string, options?: Record<string, string>, price?: number }
        const name = String(vRec.name || '')
        const opts = (vRec.options || {}) as Record<string, string>
        const optionNames = attrs.map(a => a.name)
        const optionCombinations = optionNames.map((n: string, idx: number) => {
          const combo: Record<string, unknown> = {
            OptionName: n,
            Value: String(opts[n] ?? ''),
            SortIndex: idx
          }
          combo.Id = 0
          return combo
        })

        const stocks = (formData.value.warehouseStocks || {}) as Record<number, number>
        const inventory = Object.keys(stocks).map(idStr => ({
          warehouseId: Number(idStr),
          quantity: Number((stocks as Record<string, number>)[idStr] || 0)
        }))

        const imageUrls = Array.isArray(formData.value.imageUrls)
          ? formData.value.imageUrls.map(normalizeImageUrl)
          : []
        return {
          name,
          normalizedName: name,
          sku: null,
          gtin: null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          costPrice: Number((v as any)?.costPrice) || Number(formData.value.importPrice) || 0,
          price: Number(v?.price) || Number(formData.value.price) || 0,
          oldPrice: Number(formData.value.compareAtPrice) || Number(v?.price) || 0,
          thumbnailImage: null,
          thumbnailImageUrl: imageUrls.length ? imageUrls[0] : null,
          newImages: [],
          imageUrls,
          OptionCombinations: optionCombinations,
          inventory
        }
      })

      formData.value.imageUrls = Array.isArray(formData.value.imageUrls)
        ? formData.value.imageUrls.map(normalizeImageUrl)
        : []

      const ok = await submitForm({ options, variations })
      if (ok) {
        console.log('Sản phẩm đã được tạo thành công.')
      }
    } catch (err) {
      let message = 'Đã xảy ra lỗi khi lưu sản phẩm.'
      if (err && typeof err === 'object') {
        const e = err as Record<string, unknown>
        if ('message' in e && typeof e.message === 'string') {
          message = e.message
        } else if (typeof (e as { [k: string]: unknown } & { response?: { data?: unknown } }).response?.data !== 'undefined') {
          const data = (e as { response?: { data?: unknown } }).response?.data
          if (typeof data === 'string') {
            message = data
          } else if (data && typeof (data as Record<string, unknown>).message === 'string') {
            message = String((data as Record<string, unknown>).message)
          } else if (data && typeof (data as Record<string, unknown>).error === 'string') {
            message = String((data as Record<string, unknown>).error)
          } else {
            message = JSON.stringify(data ?? {})
          }
        } else {
          message = JSON.stringify(e)
        }
      }
      alert(message)
    }
  }

  watch(markAsSoldOut, (v) => {
    formData.value.isInStock = !v
  })

  formData.value.compareAtPrice ??= 0
  formData.value.importPrice ??= 0
  formData.value.chargeTax ??= false

  formData.value.warehouseId ??= 1
  formData.value.manageInventory ??= false
  formData.value.allowNegativeStock ??= false
  formData.value.manageByBatch ??= false
  formData.value.warehouseStocks ??= { 1: 0 }
  formData.value.hasSkuOrBarcode ??= false
  formData.value.sku ??= ''
  formData.value.barcode ??= ''

  const warehouses = ref<{ id: number, name: string }[]>([])
  const warehousesLoading = ref(false)

  const fetchWarehouses = async () => {
    warehousesLoading.value = true
    try {
      const res = await productService.getWarehouses()
      if (res?.success && Array.isArray(res.data)) {
        warehouses.value = res.data
        for (const w of warehouses.value) {
          if (formData.value.warehouseStocks?.[w.id] === undefined) {
            formData.value.warehouseStocks = {
              ...(formData.value.warehouseStocks || {}),
              [w.id]: 0
            }
          }
        }
      }
    } catch {
      // ignore
    } finally {
      warehousesLoading.value = false
    }
  }

  onMounted(fetchWarehouses)

  const profitDisplay = computed(() => {
    const price = Number(formData.value.price) || 0
    const cost = Number(formData.value.importPrice) || 0
    if (!price || !cost) return ''
    return (price - cost).toLocaleString('vi-VN')
  })
  const marginDisplay = computed(() => {
    const price = Number(formData.value.price) || 0
    const cost = Number(formData.value.importPrice) || 0
    if (!price || !cost) return ''
    const margin = ((price - cost) / price) * 100
    return margin ? margin.toFixed(0) : ''
  })

  const tagInput = ref<string>('')
  if (!('tags' in formData.value)) {
    ; (formData.value as unknown as { tags: string[] }).tags = []
  }
  const getTags = () => (formData.value as unknown as { tags: string[] }).tags
  const commitTag = () => {
    const raw = tagInput.value.trim()
    if (!raw) return
    const value = raw.replace(/[,]+$/g, '').trim()
    if (!value) return
    const list = getTags()
    if (!list.includes(value)) list.push(value)
    tagInput.value = ''
  }
  const onTagKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commitTag()
    } else if (e.key === 'Backspace' && tagInput.value === '') {
      const list = getTags()
      if (list.length) list.pop()
    }
  }
  const onTagPaste = (e: ClipboardEvent) => {
    const text = e.clipboardData?.getData('text') || ''
    if (!text) return
    const parts = text.split(/[\n\t,]/).map(s => s.trim()).filter(Boolean)
    if (!parts.length) return
    e.preventDefault()
    const list = getTags()
    for (const p of parts) {
      if (!list.includes(p)) list.push(p)
    }
  }
  const removeTag = (idx: number) => {
    const list = getTags()
    if (idx >= 0 && idx < list.length) list.splice(idx, 1)
  }

  const tagsList = computed(() => getTags())

  const dragSrcIndex = ref<number | null>(null)
  const onDragStart = (e: DragEvent, idx: number) => {
    if (isUploadingImage.value) {
      e.preventDefault()
      return
    }
    dragSrcIndex.value = idx
    try {
      e.dataTransfer?.setData('text/plain', String(idx))
      e.dataTransfer!.effectAllowed = 'move'
    } catch {
      // ignore
    }
  }
  const onDragOver = (e: DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  }
  const onDrop = (e: DragEvent, idx: number) => {
    e.preventDefault()
    const srcRaw = dragSrcIndex.value ?? Number(e.dataTransfer?.getData('text/plain'))
    const srcIdx = Number(srcRaw)
    const toIdx = Number(idx)
    if (isNaN(srcIdx) || srcIdx === toIdx) {
      dragSrcIndex.value = null
      return
    }
    const previews = imagePreviews.value || []
    const urls = formData.value.imageUrls || []
    if (srcIdx < 0 || srcIdx >= previews.length || toIdx < 0 || toIdx > previews.length) {
      dragSrcIndex.value = null
      return
    }
    const p = previews.splice(srcIdx, 1)[0] as string
    previews.splice(toIdx, 0, p)
    const u = urls.splice(srcIdx, 1)[0] as string
    urls.splice(toIdx, 0, u)
    imagePreviews.value = [...previews]
    formData.value.imageUrls = [...urls]
    dragSrcIndex.value = null
  }
  const onDragEnd = () => {
    dragSrcIndex.value = null
  }

  // attributes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attributes = ref([] as any[])
  const showAttributesEditor = ref(false)
  const ATTRIBUTE_SUGGESTIONS = ['Màu sắc', 'Kích thước', 'Chất liệu']
  const getNextSuggestedAttrName = () => {
    const used = attributes.value.map(a => (a.name || '').trim())
    return ATTRIBUTE_SUGGESTIONS.find(s => !used.includes(s)) || ''
  }
  const startAttributes = () => {
    showAttributesEditor.value = true
    if (!attributes.value.length) {
      attributes.value.push({ name: getNextSuggestedAttrName(), values: [], input: '' })
    }
  }
  const addAttribute = () => {
    if (attributes.value.length >= 3) return
    attributes.value.push({ name: getNextSuggestedAttrName(), values: [], input: '' })
  }
  const removeAttribute = (idx: number) => {
    attributes.value.splice(idx, 1)
    if (attributes.value.length === 0) {
      showAttributesEditor.value = false
    }
  }
  const addAttrValue = (attrIdx: number) => {
    const attr = attributes.value[attrIdx]
    if (!attr) return
    const val = (attr.input || '').trim()
    if (val && !attr.values.includes(val)) {
      attr.values.push(val)
    }
    attr.input = ''
  }
  const removeAttrValue = (attrIdx: number, valIdx: number) => {
    const attr = attributes.value[attrIdx]
    if (!attr) return
    attr.values.splice(valIdx, 1)
  }

  const activeAttributes = computed(() => {
    const list = (attributes.value as unknown[]).map((raw) => {
      const a = raw as Record<string, unknown>
      const name = String((a && (a as { name?: unknown }).name) ?? '').trim()
      const values = Array.isArray(a && (a as { values?: unknown[] }).values)
        ? ((a as { values?: unknown[] }).values ?? []).filter(Boolean).map(v => String(v))
        : []
      return { name, values }
    })
    return list.filter(a => a.name && a.values.length > 0)
  })

  const variants = computed(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const attrs = activeAttributes.value as unknown as any[]
    if (!Array.isArray(attrs) || attrs.length === 0) return []
    const lists = attrs.map((a) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vs = (a && (a as any).values) as unknown
      return Array.isArray(vs) ? vs : []
    }) as unknown as unknown[]
    let product: string[][] = []
    for (const listAny of lists) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const list = (listAny as any[]).map(v => String(v))
      if (product.length === 0) {
        product = list.map(v => [v])
      } else {
        const next: string[][] = []
        for (const combo of product) {
          for (const v of list) next.push([...combo, String(v)])
        }
        product = next
      }
    }
    return product.map((vals) => {
      const options: Record<string, string> = {}
      for (let i = 0; i < attrs.length; i += 1) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const a = attrs[i] as any
        const name = String((a && a.name) || '')
        if (name) options[name] = String(vals[i] || '')
      }
      return {
        key: vals.join(' / '),
        name: vals.join(' / '),
        options,
        price: Number(formData.value.price) || 0,
        stock: 0
      }
    })
  })

  const totalVariantStock = computed(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const list = variants.value as unknown as any[]
    if (!Array.isArray(list) || list.length === 0) return 0
    const sumInventoryArray = (inv: unknown) => {
      if (!Array.isArray(inv)) return 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (inv as any[]).reduce((s: number, it: any) => s + (Number(it?.quantity) || 0), 0)
    }
    const globalStocks = formData.value.warehouseStocks || {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const globalSum = Object.keys(globalStocks).reduce((s, k) => s + (Number((globalStocks as any)[k]) || 0), 0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return list.reduce((total: number, v: any) => {
      if (Array.isArray(v?.inventory)) {
        return total + sumInventoryArray(v.inventory)
      }
      return total + globalSum
    }, 0)
  })

  const selectedVariantKeys = ref<string[]>([])
  const isAllVariantsChecked = computed(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const list = variants.value as unknown as any[]
    if (!Array.isArray(list) || list.length === 0) return false
    return selectedVariantKeys.value.length > 0 && selectedVariantKeys.value.length === list.length
  })
  const onToggleAllVariants = (checked: boolean) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const list = variants.value as unknown as any[]
    if (checked) {
      const keys: string[] = []
      if (Array.isArray(list)) {
        for (const v of list) {
          const k = String((v && (v as { key?: unknown }).key) ?? '')
          if (k) keys.push(k)
        }
      }
      selectedVariantKeys.value = keys
    } else {
      selectedVariantKeys.value = []
    }
  }
  const onToggleVariant = (key: string, checked: boolean) => {
    const arr = [...selectedVariantKeys.value]
    const idx = arr.indexOf(key)
    if (checked && idx === -1) arr.push(key)
    if (!checked && idx !== -1) arr.splice(idx, 1)
    selectedVariantKeys.value = arr
  }

  return {
    state: {
      productForm,
      formData,
      errors,
      categories,
      selectedCategories,
      suppliers,
      suppliersLoading,
      collections,
      collectionsLoading,
      selectedSupplier,
      selectedCollections,
      brands,
      brandsLoading,
      brandsError,
      trademark,
      status,
      pageTemplate,
      markAsSoldOut,
      slug,
      categoryOptions,
      tagInput,
      tagsList
    },
    media: {
      isUploadingImage,
      imagePreviews,
      handleImageUpload,
      removeImage,
      getPreviewUrl,
      onDragStart,
      onDragOver,
      onDrop,
      onDragEnd
    },
    inventory: {
      warehouses,
      warehousesLoading,
      profitDisplay,
      marginDisplay
    },
    tags: {
      onTagKeydown,
      commitTag,
      onTagPaste,
      removeTag
    },
    variants: {
      startAttributes,
      attributes,
      showAttributesEditor,
      addAttribute,
      removeAttribute,
      addAttrValue,
      removeAttrValue,
      activeAttributes,
      variants,
      totalVariantStock,
      isAllVariantsChecked,
      selectedVariantKeys,
      onToggleAllVariants,
      onToggleVariant
    },
    actions: {
      removeCategory,
      submitForm,
      _onSubmit
    }
  }
}
