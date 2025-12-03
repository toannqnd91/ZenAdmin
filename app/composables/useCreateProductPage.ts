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
import appSettings from '@/app.settings'

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
  const submitForm = productForm.submitForm as (extras?: { options?: unknown[], variations?: unknown[], productImages?: { caption: string, mediaUrl: string }[] }) => Promise<boolean | undefined>
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

  type DropdownOption = { id: number | string, label: string, children?: DropdownOption[] }
  const categoryOptions = computed<DropdownOption[]>(() => {
    const cats = (categories.value ?? []) as ProductCategory[]
    const mapCat = (c: ProductCategory): DropdownOption => ({
      id: c.id,
      label: c.name,
      children: ([...(Array.isArray(c.categories) ? c.categories : []), ...(Array.isArray(c.children) ? c.children : [])] as ProductCategory[])
        .map(mapCat)
    })
    return cats.map(mapCat)
  })

  const { data: brands, loading: brandsLoading, error: brandsError } = useBrandsService()
  // Brand selection: store id, not just name
  const trademark = ref<number | null>(null)
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

  const _onSubmit = async (): Promise<number | null> => {
    const { imageBaseUrl: _imageBaseUrl } = useApiConfig()
    // Sync brandId to formData before submit
    if ('brandId' in formData.value) {
      formData.value.brandId = trademark.value || null
    } else {
      const fd = formData.value as unknown as { brandId?: number | null }
      fd.brandId = trademark.value || null
    }
    try {
      const attrs = (activeAttributes.value as Array<{ name: string, values: string[] }>) || []
      const options = attrs.map((a: { name: string, values: string[] }) => ({
        name: a.name,
        displayType: 'text',
        values: (a.values || []).map(v => ({ key: v, display: null }))
      }))

      // const normalizeImageUrl = (url: string) => {
      //   if (!url) return ''
      //   if (url.startsWith('http://') || url.startsWith('https://')) return url
      //   const fname = url.replace(/^\/image\//, '')
      //   return `${imageBaseUrl}/image/${fname}`
      // }

      const validWarehouseIds = warehouses.value.map(w => w.id)
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

        // Build inventory from variantData entry (per warehouse) falling back to base stocks
        const key = name
        const vData = variantData.value[key]
        const baseStocks = (formData.value.warehouseStocks || {}) as Record<number, number>
        const inventory = validWarehouseIds.map(wid => ({
          warehouseId: wid,
          quantity: vData && vData.stocks && typeof vData.stocks[wid] === 'number' ? vData.stocks[wid] : (baseStocks[wid] || 0)
        }))

        // No imageUrls in variant payload
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
          thumbnailImageUrl: null,
          newImages: [],
          OptionCombinations: optionCombinations,
          inventory
        }
      })

      // Build productImages array from imagePreviews, only filename for mediaUrl
      const productImages = (imagePreviews.value || []).map(img => ({
        caption: 'Image Caption',
        mediaUrl: typeof img === 'string' ? img.split('/').pop() || img : img
      }))

      // Remove imageUrls from formData before submit
      if ('imageUrls' in formData.value) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (formData.value as any).imageUrls
      }

      // Patch submitForm to accept productImages at root
      const ok = await submitForm({ options, variations, productImages })
      if (ok) {
        const newId = Number(formData.value.id || 0)
        return newId > 0 ? newId : null
      }
      return null
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
      return null
    }
  }

  watch(markAsSoldOut, (v) => {
    formData.value.isInStock = !v
  })

  formData.value.compareAtPrice ??= 0
  formData.value.importPrice ??= 0
  formData.value.chargeTax ??= false

  // Do not force a default warehouse id; will select first real warehouse after fetch
  if (formData.value.warehouseId === undefined) formData.value.warehouseId = null
  formData.value.manageInventory ??= false
  formData.value.allowNegativeStock ??= false
  formData.value.manageByBatch ??= false
  // Start with empty stocks; will add real warehouse ids after fetch
  formData.value.warehouseStocks ??= {}
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
        // Auto-select first warehouse if none selected or current invalid
        if (warehouses.value.length) {
          const currentId = formData.value.warehouseId
          const exists = currentId && warehouses.value.some(w => w.id === currentId)
          if (!exists) {
            const first = warehouses.value[0]
            if (first && typeof first.id === 'number') formData.value.warehouseId = first.id
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

  // Store per-variant data: per-warehouse price (with custom flag) + per-warehouse stock
  interface VariantWarehousePrice { value: number, custom: boolean }
  interface VariantRecord { prices: Record<number, VariantWarehousePrice>, stocks: Record<number, number> }
  const variantData = ref<Record<string, VariantRecord>>({})

  // Internal list of variant keys ("Color / Size" etc.)
  const variantKeys = ref<string[]>([])

  // Build combinations when attributes / warehouses / selected warehouse change
  watch(
    [activeAttributes, () => formData.value.warehouseId, warehouses],
    () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const attrs = activeAttributes.value as unknown as any[]
      if (!Array.isArray(attrs) || attrs.length === 0) {
        variantKeys.value = []
        return
      }
      // Build cartesian product of attribute values
      const lists = attrs.map(a => Array.isArray(a.values) ? a.values.map((v: unknown) => String(v)) : [])
      let product: string[][] = []
      for (const list of lists) {
        if (product.length === 0) {
          product = list.map((v: string) => [v])
        } else {
          const next: string[][] = []
          for (const combo of product) {
            for (const v of list) next.push([...combo, String(v)])
          }
          product = next
        }
      }
      const newKeys = product.map(vals => vals.join(' / '))

      // Initialize variantData entries for new keys (no side effects in computed)
      // Build next variantData object immutably to avoid delete side-effects
      const nextVariantData: Record<string, VariantRecord> = {}
      for (const key of newKeys) {
        if (!variantData.value[key]) {
          const initialStocks: Record<number, number> = {}
          for (const w of warehouses.value) {
            initialStocks[w.id] = (formData.value.warehouseStocks || {})[w.id] || 0
          }
          nextVariantData[key] = { prices: {}, stocks: initialStocks }
        } else {
          // Clone existing to maintain reactivity on nested objects
          const existing = variantData.value[key]
          // Ensure any new warehouse ids are present
          for (const w of warehouses.value) {
            if (existing.stocks[w.id] === undefined) {
              existing.stocks[w.id] = (formData.value.warehouseStocks || {})[w.id] || 0
            }
          }
          nextVariantData[key] = existing
        }
      }
      variantData.value = nextVariantData
      variantKeys.value = newKeys
    },
    { immediate: true, deep: true }
  )

  const variants = computed(() => {
    const wid = (formData.value.warehouseId && warehouses.value.some(w => w.id === formData.value.warehouseId)) ? formData.value.warehouseId : 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const attrs = activeAttributes.value as unknown as any[]
    return variantKeys.value.map((key) => {
      const entry = variantData.value[key]
      const parts = key.split(' / ')
      const options: Record<string, string> = {}
      for (let i = 0; i < attrs.length; i += 1) {
        const name = String(attrs[i].name || '')
        if (name) options[name] = String(parts[i] || '')
      }
      return {
        key,
        name: key,
        options,
        price: wid && entry?.prices[wid] ? entry.prices[wid].value : Number(formData.value.price) || 0,
        stock: wid && entry?.stocks[wid] !== undefined ? entry.stocks[wid] : 0
      }
    })
  })

  const totalVariantStock = computed(() => {
    const wid = formData.value.warehouseId || 0
    return Object.keys(variantData.value).reduce((sum, k) => {
      const entry = variantData.value[k]
      return sum + (entry && entry.stocks ? (entry.stocks[wid] || 0) : 0)
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

  // Helpers for ensuring data
  const ensureVariantWarehouse = (key: string, warehouseId: number) => {
    if (!warehouseId) return
    if (!variantData.value[key]) {
      const initial: Record<number, number> = {}
      for (const w of warehouses.value) initial[w.id] = (formData.value.warehouseStocks || {})[w.id] || 0
      variantData.value[key] = { prices: {}, stocks: initial }
    }
    const rec = variantData.value[key]
    if (!rec.prices[warehouseId]) rec.prices[warehouseId] = { value: Number(formData.value.price) || 0, custom: false }
    if (rec.stocks[warehouseId] === undefined) rec.stocks[warehouseId] = 0
  }
  const updateVariantPrice = (key: string, warehouseId: number, price: number) => {
    ensureVariantWarehouse(key, warehouseId)
    const p = Number(price) || 0
    variantData.value[key]!.prices[warehouseId] = { value: p, custom: true }
    const rec = variantData.value[key]!
    const warehouseIds = warehouses.value.map(w => w.id)
    if (!appSettings.variantPricePerWarehouse) {
      // Đồng bộ giá giữa các kho: sửa 1 kho thì các kho khác cũng đổi
      for (const wid of warehouseIds) {
        rec.prices[wid] = { value: p, custom: wid === warehouseId }
      }
    }
    // Nếu cho phép giá khác nhau: chỉ sửa kho hiện tại (đã làm ở trên)
  }
  const updateVariantStock = (key: string, warehouseId: number, qty: number) => {
    ensureVariantWarehouse(key, warehouseId)
    variantData.value[key]!.stocks[warehouseId] = Math.max(0, Number(qty) || 0)
  }

  // Editing state for inline edits
  const editingPriceKeys = ref(new Set<string>())
  const editingStockKeys = ref(new Set<string>())
  const startEditPrice = (key: string) => {
    editingPriceKeys.value.add(key)
  }
  const startEditStock = (key: string) => {
    editingStockKeys.value.add(key)
  }
  const isEditingPrice = (key: string) => editingPriceKeys.value.has(key)
  const isEditingStock = (key: string) => editingStockKeys.value.has(key)
  const commitPrice = (key: string, warehouseId: number, value: number) => {
    updateVariantPrice(key, warehouseId, value)
    editingPriceKeys.value.delete(key)
  }
  const commitStock = (key: string, warehouseId: number, value: number) => {
    updateVariantStock(key, warehouseId, value)
    editingStockKeys.value.delete(key)
  }

  // When global price changes last, force override ALL variant prices (latest wins)
  watch(() => formData.value.price, (newPrice) => {
    const base = Number(newPrice) || 0
    for (const k of Object.keys(variantData.value)) {
      const rec = variantData.value[k]
      if (!rec) continue
      for (const widStr of Object.keys(rec.prices)) {
        const p = rec.prices[Number(widStr)]
        if (p) {
          p.value = base
          p.custom = false // reset custom so future global changes continue to apply
        }
      }
    }
  })

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
      onToggleVariant,
      updateVariantPrice,
      updateVariantStock,
      startEditPrice,
      startEditStock,
      isEditingPrice,
      isEditingStock,
      commitPrice,
      commitStock,
      variantData
    },
    actions: {
      removeCategory,
      submitForm,
      _onSubmit
    }
  }
}
