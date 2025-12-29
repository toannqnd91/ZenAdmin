export interface NewsCategory {
  id: number
  name: string
  description: string
  parentId?: number | null
  parent?: NewsCategory | null
  children?: NewsCategory[]
  imageUrl: string | null
  icon: string | null
  slug: string
  isDeleted: boolean
  isShow: boolean
  isFeatured: boolean
  sortOrder?: number | null
  createdDate: string
  createdBy: string
  updatedDate: string
  updatedBy?: string | null
  tenantId: string
  url?: string
  categories?: NewsCategory[]
  // Alias for backward compatibility
  isVisible?: boolean
}

export interface NewsCategoriesApiResponse {
  code: string
  success: boolean
  message: string
  data: NewsCategory[]
}

export interface NewsCategoryDetailResponse {
  code: string
  success: boolean
  message: string
  data: NewsCategory
}
