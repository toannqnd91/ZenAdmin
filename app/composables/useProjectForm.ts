import { ref, computed, onMounted } from 'vue'
import { projectService, fileService } from '@/services'
import type { CreateProjectRequest, ProjectCategory } from '@/types/project'

interface FormErrors {
  name?: string
  description?: string
  content?: string
  categoryIds?: string
}

export const useProjectForm = (projectId?: number) => {
  const router = useRouter()
  const toast = useToast()

  // Form Data
  const formData = ref<CreateProjectRequest>({
    name: '',
    description: '',
    content: '',
    status: 'DRAFT',
    imageUrl: '',
    thumbnailUrl: '',
    slug: '',
    location: '',
    startDate: null,
    endDate: null,
    clientName: '',
    budget: 0,
    displayOrder: 0,
    isFeatured: false,
    isPublished: true,
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    categoryIds: []
  })

  // States
  const isSubmitting = ref(false)
  const isLoading = ref(false)
  const errors = ref<FormErrors>({})

  // Publication Logic
  const publicationStatus = ref('published')
  const statusItems = [
    { value: 'published', label: 'Hiện' },
    { value: 'draft', label: 'Ẩn' }
  ]

  // Watch publication status to update boolean
  watch(publicationStatus, (val) => {
    formData.value.isPublished = val === 'published'
  })

  watch(() => formData.value.isPublished, (val) => {
    publicationStatus.value = val ? 'published' : 'draft'
  })

  // Fetch Categories
  const { data: categoriesResponse, pending: categoriesPending, error: categoriesError } = useAsyncData(
    'project-categories',
    async () => await projectService.getCategories(),
    { server: false, lazy: false }
  )

  const categories = computed(() => categoriesResponse.value?.data || [])

  // Category Logic
  const isDropdownOpen = ref(false)
  const searchTerm = ref('')

  const filteredCategories = computed(() => {
    if (!searchTerm.value) return categories.value || []
    return (categories.value || []).filter(c => c.name.toLowerCase().includes(searchTerm.value.toLowerCase()))
  })

  const selectedCategories = computed(() => {
     return (categories.value || []).filter(c => formData.value.categoryIds.includes(c.id))
  })

  const toggleCategory = (id: number) => {
    const idx = formData.value.categoryIds.indexOf(id)
    if (idx > -1) formData.value.categoryIds.splice(idx, 1)
    else formData.value.categoryIds.push(id)
  }

  const removeCategory = (id: number) => {
    const idx = formData.value.categoryIds.indexOf(id)
    if (idx > -1) formData.value.categoryIds.splice(idx, 1)
  }

  // Image Upload
  const isUploadingImage = ref(false)
  const imagePreview = ref<string | null>(null)
  const fileInput = ref<HTMLInputElement | null>(null)

  const handleImageUpload = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return

    // Simple preview
    const reader = new FileReader()
    reader.onload = (e) => imagePreview.value = e.target?.result as string
    reader.readAsDataURL(file)

    try {
        isUploadingImage.value = true
        const res = await fileService.uploadFile(file, 'projects')
        if (res.success && res.data) {
             const fileData = res.data
             // Response is direct object { success: true, url: '...', ... }
             const url = fileData.url
             if (url) {
                formData.value.imageUrl = url
                formData.value.thumbnailUrl = url
             }
        }
    } catch (e) {
        console.error(e)
        toast.add({ title: 'Upload failed', color: 'error' })
    } finally {
        isUploadingImage.value = false
    }
  }

  const removeImage = () => {
    imagePreview.value = null
    formData.value.imageUrl = ''
    formData.value.thumbnailUrl = ''
    if (fileInput.value) fileInput.value.value = ''
  }

  const clickFileInput = () => fileInput.value?.click()


  // Data Loading for Edit
  const loadProjectData = async () => {
     if (!projectId) return
     isLoading.value = true
     try {
       const res = await projectService.getProject(projectId)
       if (res.success && res.data) {
         const data = res.data
         formData.value = {
            name: data.name || '',
            description: data.description || '',
            content: data.content || '',
            status: data.status || 'DRAFT',
            imageUrl: data.imageUrl || '',
            thumbnailUrl: data.thumbnailUrl || '',
            slug: data.slug || '',
            location: data.location || '',
            startDate: data.startDate,
            endDate: data.endDate,
            clientName: data.clientName || '',
            budget: data.budget || 0,
            displayOrder: data.displayOrder || 0,
            isFeatured: data.isFeatured || false,
            isPublished: data.isPublished,
            metaTitle: data.metaTitle || '',
            metaDescription: data.metaDescription || '',
            metaKeywords: data.metaKeywords || '',
            categoryIds: data.categories ? data.categories.map((c: any) => c.id || c) : [] // Handle if categories are objects or ids
         }
         
         // Update preview if image exists
         if (data.imageUrl) {
             imagePreview.value = fileService.getFileUrl(data.imageUrl)
         }
         
         // Update publication status
         publicationStatus.value = data.isPublished ? 'published' : 'draft'
       }
     } catch (e) {
       toast.add({ title: 'Lỗi', description: 'Không thể tải dữ liệu dự án', color: 'error' })
       router.push('/projects')
     } finally {
       isLoading.value = false
     }
  }

  if (projectId) {
      onMounted(loadProjectData)
  }

  // Validate
  const validate = () => {
    errors.value = {}
    if (!formData.value.name) errors.value.name = 'Tên dự án là bắt buộc'
    if (!formData.value.description) errors.value.description = 'Mô tả là bắt buộc'
    if (!formData.value.content) errors.value.content = 'Nội dung là bắt buộc'
    if (!formData.value.categoryIds.length) errors.value.categoryIds = 'Chọn ít nhất 1 danh mục'
    return Object.keys(errors.value).length === 0
  }

  // Submit
  const submitForm = async () => {
     if (!validate()) return
     isSubmitting.value = true
     try {
        // Auto-generate slug if empty
        if (!formData.value.slug) {
            formData.value.slug = formData.value.name
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[đĐ]/g, "d")
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/[\s-]+/g, "-")
                .replace(/^-+|-+$/g, "");
        }

        const payload = {
            id: 0,
            ...formData.value,
            budget: Number(formData.value.budget), // Ensure number
            displayOrder: Number(formData.value.displayOrder),
            startDate: formData.value.startDate ? new Date(formData.value.startDate).toISOString() : null,
            endDate: formData.value.endDate ? new Date(formData.value.endDate).toISOString() : null,
        }

        let res;
        if (projectId) {
            res = await projectService.updateProject(projectId, payload)
        } else {
            res = await projectService.createProject(payload)
        }
        
        if (res.success) {
            toast.add({ title: 'Thành công', description: projectId ? 'Cập nhật thành công' : 'Tạo mới thành công' })
            router.push('/projects')
        } else {
             toast.add({ title: 'Lỗi', description: res.message || 'Có lỗi xảy ra', color: 'error' })
        }
     } catch (e) {
         toast.add({ title: 'Lỗi', description: 'Có lỗi xảy ra', color: 'error' })
     } finally {
         isSubmitting.value = false
     }
  }

  return {
    formData,
    isSubmitting,
    isLoading,
    errors,
    publicationStatus,
    statusItems,
    isDropdownOpen,
    searchTerm,
    filteredCategories,
    selectedCategories,
    toggleCategory,
    removeCategory,
    isCategoriesLoading: computed(() => categoriesPending.value),
    categoriesError,
    isUploadingImage,
    imagePreview,
    fileInput,
    handleImageUpload,
    removeImage,
    clickFileInput,
    submitForm
  }
}
